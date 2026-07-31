import 'server-only';

import { and, asc, eq, ne, sql } from 'drizzle-orm';

import { getDatabase } from '../client';
import { collectionRuns, collectionRunItems } from '../schema';
import { CollectionRunItemRow } from '../CollectionRunItems/types';
import { CollectionRunRow, CollectionRunStatus } from './types';

type InsertCollectionRunRowInput = Omit<CollectionRunRow, 'id' | 'created_at'> & {
  created_at?: string;
};
type InsertCollectionRunItemRowInput = Omit<CollectionRunItemRow, 'id' | 'created_at'> & {
  created_at?: string;
};

export async function insertCollectionRunRow(
  input: InsertCollectionRunRowInput
): Promise<CollectionRunRow> {
  const db = await getDatabase();
  const [row] = await db.insert(collectionRuns).values(input).returning();
  if (!row) throw new Error('Insert into collection_runs returned no row');
  return row;
}

/** Atomically inserts the Run row, its item rows and sets `items_total` in one transaction, so the
 * Run never becomes visible as `pending` (and therefore claimable by the loop) before its items
 * exist. Without this, a loop draining a previous Run could claim this one in the gap between the
 * two inserts, see no groups, and finalise it `completed` before the items land. Both sqlite
 * drivers this app uses are synchronous under the hood, so — unlike a real async driver — their
 * `transaction()` requires the callback to run to completion synchronously (an `await` inside it
 * would let the native BEGIN/COMMIT wrapper finish before the awaited work actually ran); the
 * caller passes a pre-generated `id` so both inserts can reference it without an intermediate
 * round trip. */
export async function insertCollectionRunWithItems(
  input: InsertCollectionRunRowInput & { id: string },
  itemInputs: InsertCollectionRunItemRowInput[]
): Promise<CollectionRunRow> {
  const db = await getDatabase();
  return db.transaction((tx) => {
    tx.insert(collectionRuns).values(input).run();
    if (itemInputs.length) tx.insert(collectionRunItems).values(itemInputs).run();
    const [row] = tx
      .update(collectionRuns)
      .set({ items_total: itemInputs.length })
      .where(eq(collectionRuns.id, input.id))
      .returning()
      .all();
    if (!row) throw new Error(`No collection_runs row found for id ${input.id}`);
    return row;
  });
}

export async function getCollectionRunRowWithId(id: string): Promise<CollectionRunRow | undefined> {
  const db = await getDatabase();
  const rows = await db.select().from(collectionRuns).where(eq(collectionRuns.id, id)).limit(1);
  return rows[0];
}

export async function getOldestPendingCollectionRunRow(): Promise<CollectionRunRow | undefined> {
  const db = await getDatabase();
  const rows = await db
    .select()
    .from(collectionRuns)
    .where(eq(collectionRuns.status, 'pending'))
    .orderBy(asc(collectionRuns.created_at))
    .limit(1);
  return rows[0];
}

/** Conditional claim: proceeds to `running` only if the Run is still `pending`. This is the
 * correctness mechanism the single-loop guarantee rests on — the caller must treat `undefined` as
 * "someone else already claimed it" rather than an error. */
export async function claimCollectionRunRow(id: string): Promise<CollectionRunRow | undefined> {
  const db = await getDatabase();
  const [row] = await db
    .update(collectionRuns)
    .set({ status: 'running', started_at: new Date().toISOString() })
    .where(and(eq(collectionRuns.id, id), eq(collectionRuns.status, 'pending')))
    .returning();
  return row;
}

export async function finishCollectionRunRow(
  id: string,
  status: CollectionRunStatus,
  error?: string
): Promise<CollectionRunRow> {
  const db = await getDatabase();
  const [row] = await db
    .update(collectionRuns)
    .set({ status, finished_at: new Date().toISOString(), error: error ?? null })
    .where(eq(collectionRuns.id, id))
    .returning();
  if (!row) throw new Error(`No collection_runs row found for id ${id}`);
  return row;
}

/** Same write as `finishCollectionRunRow`, but conditional on the Run still being `running` — so
 * the loop's finaliser (success/cancelled path) and its outer catch (`failed` path) can never
 * clobber a Run that `retryFailedCollectionRunItems` reopened underneath them. Returns `undefined`,
 * rather than throwing, when the Run was no longer `running` — the caller lost the race and should
 * leave whatever wrote over it alone. */
export async function finishRunningCollectionRunRow(
  id: string,
  status: CollectionRunStatus,
  error?: string
): Promise<CollectionRunRow | undefined> {
  const db = await getDatabase();
  const [row] = await db
    .update(collectionRuns)
    .set({ status, finished_at: new Date().toISOString(), error: error ?? null })
    .where(and(eq(collectionRuns.id, id), eq(collectionRuns.status, 'running')))
    .returning();
  return row;
}

/** Reopens a terminal Run back to `pending` — used by `retryFailedCollectionRunItems`. Clears
 * `started_at`, `finished_at` and `error` so the reopened Run reads as freshly pending; the next
 * claim sets `started_at` again. No-op (returns `undefined`, does not throw) when the Run is
 * currently `running`: a retry firing mid-drain must not reopen a live Run out from under its own
 * loop — resetting the failed items to `pending` is enough for the live loop to pick them back up. */
export async function reopenCollectionRunRow(id: string): Promise<CollectionRunRow | undefined> {
  const db = await getDatabase();
  const [row] = await db
    .update(collectionRuns)
    .set({ status: 'pending', started_at: null, finished_at: null, error: null })
    .where(and(eq(collectionRuns.id, id), ne(collectionRuns.status, 'running')))
    .returning();
  return row;
}

/** Boot-time recovery: any Run left `running` by a killed process goes back to `pending` so the
 * loop picks it up again. Returns the reset rows so the caller can check each for `cancelled`
 * items (a cancel interrupted by a quit must not be silently un-cancelled). */
export async function resetRunningCollectionRunRows(): Promise<CollectionRunRow[]> {
  const db = await getDatabase();
  return db
    .update(collectionRuns)
    .set({ status: 'pending' })
    .where(eq(collectionRuns.status, 'running'))
    .returning();
}

/** Recomputes `items_completed` and `items_failed` from the item rows in one statement, rather
 * than incrementing counters in memory — so they are automatically correct after a crash, a
 * resume, or a retry, with no reconciliation code. */
export async function recomputeCollectionRunCounters(id: string): Promise<void> {
  const db = await getDatabase();
  await db.run(sql`
    UPDATE collection_runs
    SET items_completed = (SELECT count(*) FROM collection_run_items WHERE run_id = ${id} AND status = 'completed'),
        items_failed    = (SELECT count(*) FROM collection_run_items WHERE run_id = ${id} AND status = 'failed')
    WHERE id = ${id}
  `);
}
