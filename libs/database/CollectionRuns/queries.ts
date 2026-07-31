import 'server-only';

import { and, asc, eq, sql } from 'drizzle-orm';

import { getDatabase } from '../client';
import { collectionRuns } from '../schema';
import { CollectionRunRow, CollectionRunStatus } from './types';

type InsertCollectionRunRowInput = Omit<CollectionRunRow, 'id' | 'created_at'> & {
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

/** Reopens a terminal Run back to `pending` — used by `retryFailedCollectionRunItems`. Clears
 * `started_at`, `finished_at` and `error` so the reopened Run reads as freshly pending; the next
 * claim sets `started_at` again. */
export async function reopenCollectionRunRow(id: string): Promise<CollectionRunRow> {
  const db = await getDatabase();
  const [row] = await db
    .update(collectionRuns)
    .set({ status: 'pending', started_at: null, finished_at: null, error: null })
    .where(eq(collectionRuns.id, id))
    .returning();
  if (!row) throw new Error(`No collection_runs row found for id ${id}`);
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

export async function setCollectionRunItemsTotal(
  id: string,
  total: number
): Promise<CollectionRunRow> {
  const db = await getDatabase();
  const [row] = await db
    .update(collectionRuns)
    .set({ items_total: total })
    .where(eq(collectionRuns.id, id))
    .returning();
  if (!row) throw new Error(`No collection_runs row found for id ${id}`);
  return row;
}

/** Recomputes `items_completed` and `items_failed` from the item rows in one statement, rather
 * than incrementing counters in memory — so they are automatically correct after a crash, a
 * resume, or a retry, with no reconciliation code. */
export async function refreshCollectionRunCounters(id: string): Promise<void> {
  const db = await getDatabase();
  await db.run(sql`
    UPDATE collection_runs
    SET items_completed = (SELECT count(*) FROM collection_run_items WHERE run_id = ${id} AND status = 'completed'),
        items_failed    = (SELECT count(*) FROM collection_run_items WHERE run_id = ${id} AND status = 'failed')
    WHERE id = ${id}
  `);
}
