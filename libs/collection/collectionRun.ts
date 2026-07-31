import { getProjectRowWithId, getProjectRows } from '@/libs/database/Projects/queries';
import { ProjectRow } from '@/libs/database/Projects/types';
import { getEffectiveEnabledChatbotIds } from '@/libs/database/Settings/queries';
import { getTodayISODateString, ISODateString } from '@/libs/database/shared/ISODateString';
import {
  finishCollectionRunRow,
  finishRunningCollectionRunRow,
  getCollectionRunRowWithId,
  insertCollectionRunWithItems,
  recomputeCollectionRunCounters,
  reopenCollectionRunRow,
} from '@/libs/database/CollectionRuns/queries';
import { CollectionRunRow } from '@/libs/database/CollectionRuns/types';
import {
  cancelPendingCollectionRunItemRows,
  countCollectionRunItemRowsByStatus,
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
  return rows.filter((row): row is ProjectRow => !!row && !row.is_paused && !row.is_archived);
}

/** Creates a `pending` Collection Run and materialises one `pending` item per
 * (Prompt x enabled Chatbot), setting `items_total`. Does not start anything. Every Project/Prompt
 * lookup happens before the Run is inserted, and the insert itself — Run row, item rows and
 * `items_total` — is one atomic transaction (`insertCollectionRunWithItems`), so the Run can never
 * be observed `pending` with its items not yet landed. A Run with zero items — every Prompt already
 * has today's data, which is a legitimate no-op — is finalised `completed` immediately rather than
 * left for the loop to discover nothing to do. */
export async function createCollectionRun(
  input?: CreateCollectionRunInput
): Promise<CollectionRunRow> {
  const targetDate = input?.targetDate ?? getTodayISODateString();
  const projects = await resolveProjectRowsToCollect(input?.projectIds);
  const chatbotIds = await getEffectiveEnabledChatbotIds();

  const runId = crypto.randomUUID();
  const itemInputs = [];
  for (const project of projects) {
    const prompts = await selectPromptsToCollect(project.id, targetDate, {
      maxPrompts: input?.maxPrompts,
      shouldForce: input?.shouldForce,
    });
    for (const prompt of prompts) {
      for (const chatbotId of chatbotIds) {
        itemInputs.push({
          run_id: runId,
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

  const run = await insertCollectionRunWithItems(
    {
      id: runId,
      status: 'pending',
      started_at: null,
      finished_at: null,
      items_total: 0,
      items_completed: 0,
      items_failed: 0,
      error: null,
    },
    itemInputs
  );

  if (!itemInputs.length) return finishCollectionRunRow(run.id, 'completed');

  return run;
}

/** Resets this Run's `failed` items to `pending`, then reopens the Run — unless it is currently
 * `running`, in which case the live loop's own re-check before finalising picks the reset items
 * back up, and reopening here would fight it for the Run's status. No-op if nothing failed. */
export async function retryFailedCollectionRunItems(runId: string): Promise<CollectionRunRow> {
  const resetItems = await resetFailedCollectionRunItemRows(runId);
  if (resetItems.length) {
    await reopenCollectionRunRow(runId);
    ensureCollectionRunLoopIsRunning();
  }
  await recomputeCollectionRunCounters(runId);
  const run = await getCollectionRunRowWithId(runId);
  if (!run) throw new Error(`No collection_runs row found for id ${runId}`);
  return run;
}

/** Stops new Prompts being claimed by cancelling every still-`pending` item. In-flight Prompts
 * finish and are recorded normally. A `pending` Run was never claimed, so no loop will ever
 * finalise it — it is marked `cancelled` directly. A `running` Run with nothing left `running` is
 * between the loop's last group and its own finalise step, so it is finalised directly too, via the
 * same conditional write the loop itself uses — if the loop wins that race instead, this write
 * simply no-ops. Otherwise the Run is left for the loop's finaliser to land `cancelled` once it
 * drains and observes a cancelled item. */
export async function cancelCollectionRun(runId: string): Promise<CollectionRunRow> {
  await cancelPendingCollectionRunItemRows(runId);
  await recomputeCollectionRunCounters(runId);
  const run = await getCollectionRunRowWithId(runId);
  if (!run) throw new Error(`No collection_runs row found for id ${runId}`);

  if (run.status === 'pending') return finishCollectionRunRow(runId, 'cancelled');
  if (run.status === 'running') {
    const counts = await countCollectionRunItemRowsByStatus(runId);
    if (!counts.running) {
      const finalised = await finishRunningCollectionRunRow(runId, 'cancelled');
      if (finalised) return finalised;
      return (await getCollectionRunRowWithId(runId)) ?? run;
    }
  }
  return run;
}
