import 'server-only';

import { and, asc, eq, inArray, sql } from 'drizzle-orm';

import { getDatabase } from '../client';
import { collectionRunItems, projects, prompts } from '../schema';
import { ChatbotId } from '../shared/ChatbotId';
import {
  CollectionRunItemRow,
  CollectionRunItemStatus,
  CollectionRunItemStatusCounts,
  PendingCollectionRunPromptGroup,
} from './types';

type InsertCollectionRunItemRowInput = Omit<CollectionRunItemRow, 'id' | 'created_at'> & {
  created_at?: string;
};

export async function insertCollectionRunItemRows(
  inputs: InsertCollectionRunItemRowInput[]
): Promise<CollectionRunItemRow[]> {
  if (!inputs.length) return [];
  const db = await getDatabase();
  return db.insert(collectionRunItems).values(inputs).returning();
}

/** Groups the still-pending items of the earliest-created Prompt in this Run, bringing back the
 * Prompt name in the same query so the caller does not need a second round trip. Returns
 * `undefined` once no `pending` items remain. */
export async function getNextPendingPromptGroupForRun(
  runId: string
): Promise<PendingCollectionRunPromptGroup | undefined> {
  const db = await getDatabase();
  const rows = await db
    .select({
      projectId: collectionRunItems.project_id,
      promptId: collectionRunItems.prompt_id,
      promptName: prompts.name,
      chatbotId: collectionRunItems.chatbot_id,
      createdAt: collectionRunItems.created_at,
    })
    .from(collectionRunItems)
    .leftJoin(prompts, eq(collectionRunItems.prompt_id, prompts.id))
    .where(and(eq(collectionRunItems.run_id, runId), eq(collectionRunItems.status, 'pending')))
    .orderBy(asc(collectionRunItems.created_at));

  const first = rows[0];
  if (!first) return;

  const groupRows = rows.filter((row) => row.promptId === first.promptId);
  return {
    projectId: first.projectId,
    promptId: first.promptId,
    promptName: first.promptName ?? '',
    chatbotIds: groupRows.map((row) => row.chatbotId),
  };
}

/** Batch conditional claim: transitions every still-`pending` item of this (Run, Prompt) whose
 * Chatbot is in `chatbotIds` to `running`, together. The caller must use the returned rows'
 * `chatbot_id`s, not the ones it asked for — a second call for an already-claimed group returns
 * `[]` rather than racing. */
export async function claimCollectionRunItemRowsForPrompt(
  runId: string,
  promptId: string,
  chatbotIds: ChatbotId[]
): Promise<CollectionRunItemRow[]> {
  if (!chatbotIds.length) return [];
  const db = await getDatabase();
  return db
    .update(collectionRunItems)
    .set({ status: 'running', started_at: new Date().toISOString() })
    .where(
      and(
        eq(collectionRunItems.run_id, runId),
        eq(collectionRunItems.prompt_id, promptId),
        inArray(collectionRunItems.chatbot_id, chatbotIds),
        eq(collectionRunItems.status, 'pending')
      )
    )
    .returning();
}

/** Returns `undefined` rather than throwing when the row is gone — deleting the Prompt or Project
 * mid-Run cascades the item row away (`ON DELETE CASCADE`), and the row being gone means the work
 * it tracked is moot, not a failure. */
export async function finishCollectionRunItemRow(
  id: string,
  fields: { status: CollectionRunItemStatus; error?: string; attemptsUsed: number }
): Promise<CollectionRunItemRow | undefined> {
  const db = await getDatabase();
  const [row] = await db
    .update(collectionRunItems)
    .set({
      status: fields.status,
      error: fields.error ?? null,
      finished_at: new Date().toISOString(),
      attempts: sql`${collectionRunItems.attempts} + ${fields.attemptsUsed}`,
    })
    .where(eq(collectionRunItems.id, id))
    .returning();
  return row;
}

/** Boot-time recovery: any item left `running` by a killed process goes back to `pending`. */
export async function resetRunningCollectionRunItemRows(): Promise<CollectionRunItemRow[]> {
  const db = await getDatabase();
  return db
    .update(collectionRunItems)
    .set({ status: 'pending' })
    .where(eq(collectionRunItems.status, 'running'))
    .returning();
}

/** Clears `error`, `started_at` and `finished_at` on this Run's `failed` items and returns them to
 * `pending`; `attempts` is kept so retries accumulate honestly. */
export async function resetFailedCollectionRunItemRows(
  runId: string
): Promise<CollectionRunItemRow[]> {
  const db = await getDatabase();
  return db
    .update(collectionRunItems)
    .set({ status: 'pending', error: null, started_at: null, finished_at: null })
    .where(and(eq(collectionRunItems.run_id, runId), eq(collectionRunItems.status, 'failed')))
    .returning();
}

/** Stops new Prompts being claimed for this Run: every still-`pending` item is cancelled in one
 * statement. In-flight (`running`) items are left alone so they finish and are recorded normally. */
export async function cancelPendingCollectionRunItemRows(
  runId: string
): Promise<CollectionRunItemRow[]> {
  const db = await getDatabase();
  return db
    .update(collectionRunItems)
    .set({ status: 'cancelled' })
    .where(and(eq(collectionRunItems.run_id, runId), eq(collectionRunItems.status, 'pending')))
    .returning();
}

export type CollectionRunItemProgressRow = {
  projectId: string;
  projectName: string;
  promptId: string;
  promptName: string;
  chatbotId: ChatbotId;
  status: CollectionRunItemStatus;
};

/** One query for a whole Run's progress: item rows joined to their Prompt and Project names.
 * The ORDER BY must stay deterministic — the stream endpoint compares serialised snapshots to
 * decide whether anything changed, and a non-deterministic order would emit phantom updates.
 * Ordered by Project name, then Prompt created_at/name, then Chatbot id, so the grouped output is
 * meaningful (not tie-broken on a random item UUID) and stable between polls. */
export async function getCollectionRunItemProgressRowsForRun(
  runId: string
): Promise<CollectionRunItemProgressRow[]> {
  const db = await getDatabase();
  const rows = await db
    .select({
      projectId: collectionRunItems.project_id,
      projectName: projects.name,
      promptId: collectionRunItems.prompt_id,
      promptName: prompts.name,
      chatbotId: collectionRunItems.chatbot_id,
      status: collectionRunItems.status,
    })
    .from(collectionRunItems)
    .leftJoin(prompts, eq(collectionRunItems.prompt_id, prompts.id))
    .leftJoin(projects, eq(collectionRunItems.project_id, projects.id))
    .where(eq(collectionRunItems.run_id, runId))
    .orderBy(
      asc(projects.name),
      asc(prompts.created_at),
      asc(prompts.name),
      asc(collectionRunItems.chatbot_id)
    );

  return rows.map((row) => ({
    projectId: row.projectId,
    projectName: row.projectName ?? '',
    promptId: row.promptId,
    promptName: row.promptName ?? '',
    chatbotId: row.chatbotId,
    status: row.status as CollectionRunItemStatus,
  }));
}

export async function countCollectionRunItemRowsByStatus(
  runId: string
): Promise<CollectionRunItemStatusCounts> {
  const db = await getDatabase();
  const rows = await db
    .select({ status: collectionRunItems.status, count: sql<number>`count(*)` })
    .from(collectionRunItems)
    .where(eq(collectionRunItems.run_id, runId))
    .groupBy(collectionRunItems.status);

  const counts: CollectionRunItemStatusCounts = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  };
  for (const row of rows) counts[row.status as CollectionRunItemStatus] = Number(row.count);
  return counts;
}
