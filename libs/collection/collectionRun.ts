import { getProjectRowWithId, getProjectRows } from '@/libs/database/Projects/queries';
import { ProjectRow } from '@/libs/database/Projects/types';
import { getEffectiveEnabledChatbotIds } from '@/libs/database/Settings/queries';
import { getTodayISODateString, ISODateString } from '@/libs/database/shared/ISODateString';
import {
  finishCollectionRunRow,
  getCollectionRunRowWithId,
  insertCollectionRunRow,
  refreshCollectionRunCounters,
  reopenCollectionRunRow,
  setCollectionRunItemsTotal,
} from '@/libs/database/CollectionRuns/queries';
import { CollectionRunRow } from '@/libs/database/CollectionRuns/types';
import {
  cancelPendingCollectionRunItemRows,
  insertCollectionRunItemRows,
  resetFailedCollectionRunItemRows,
} from '@/libs/database/CollectionRunItems/queries';
import { ensureCollectionRunLoopIsRunning } from './runLoop';
import { selectPromptsToCollect } from './selectPrompts';

export type CreateCollectionRunInput = {
  /** Omitted = every non-archived, non-paused Project. */
  projectIds?: string[];
  targetDate?: ISODateString;
  maxPrompts?: number;
  shouldForce?: boolean;
};

async function resolveProjectRowsToCollect(projectIds?: string[]): Promise<ProjectRow[]> {
  if (!projectIds) return (await getProjectRows(false)).filter((project) => !project.is_paused);
  const rows = await Promise.all(projectIds.map((projectId) => getProjectRowWithId(projectId)));
  return rows.filter((row): row is ProjectRow => !!row);
}

/** Creates a `pending` Collection Run and materialises one `pending` item per
 * (Prompt x enabled Chatbot), setting `items_total`. Does not start anything. A Run with zero
 * items — every Prompt already has today's data, which is a legitimate no-op — is finalised
 * `completed` immediately rather than left for the loop to discover nothing to do. */
export async function createCollectionRun(
  input?: CreateCollectionRunInput
): Promise<CollectionRunRow> {
  const targetDate = input?.targetDate ?? getTodayISODateString();
  const projects = await resolveProjectRowsToCollect(input?.projectIds);
  const chatbotIds = await getEffectiveEnabledChatbotIds();

  const run = await insertCollectionRunRow({
    status: 'pending',
    started_at: null,
    finished_at: null,
    items_total: 0,
    items_completed: 0,
    items_failed: 0,
    error: null,
  });

  const itemInputs = [];
  for (const project of projects) {
    const prompts = await selectPromptsToCollect(project.id, targetDate, {
      maxPrompts: input?.maxPrompts,
      shouldForce: input?.shouldForce,
    });
    for (const prompt of prompts) {
      for (const chatbotId of chatbotIds) {
        itemInputs.push({
          run_id: run.id,
          project_id: project.id,
          prompt_id: prompt.id,
          chatbot_id: chatbotId,
          status: 'pending' as const,
          attempts: 0,
          error: null,
          started_at: null,
          finished_at: null,
        });
      }
    }
  }

  await insertCollectionRunItemRows(itemInputs);
  const runWithTotal = await setCollectionRunItemsTotal(run.id, itemInputs.length);

  if (!itemInputs.length) return finishCollectionRunRow(run.id, 'completed');

  return runWithTotal;
}

/** Resets this Run's `failed` items to `pending` and reopens the Run. The loop then re-executes
 * each affected Prompt restricted to exactly those Chatbots. No-op if nothing failed. */
export async function retryFailedCollectionRunItems(runId: string): Promise<CollectionRunRow> {
  const resetItems = await resetFailedCollectionRunItemRows(runId);
  const run = resetItems.length
    ? await reopenCollectionRunRow(runId)
    : await getCollectionRunRowWithId(runId);
  if (!run) throw new Error(`No collection_runs row found for id ${runId}`);
  await refreshCollectionRunCounters(runId);
  if (resetItems.length) ensureCollectionRunLoopIsRunning();
  return run;
}

/** Stops new Prompts being claimed by cancelling every still-`pending` item. In-flight Prompts
 * finish and are recorded normally; the Run itself is left for the loop's finaliser to land
 * `cancelled` once it drains and observes a cancelled item. */
export async function cancelCollectionRun(runId: string): Promise<CollectionRunRow> {
  await cancelPendingCollectionRunItemRows(runId);
  await refreshCollectionRunCounters(runId);
  const run = await getCollectionRunRowWithId(runId);
  if (!run) throw new Error(`No collection_runs row found for id ${runId}`);
  return run;
}
