import { deletePromptResponseRowsWithRunIdAndPromptId } from '@/libs/database/PromptResponses/queries';
import { updateProjectRow } from '@/libs/database/Projects/queries';
import {
  claimCollectionRunRow,
  finishCollectionRunRow,
  getOldestPendingCollectionRunRow,
  refreshCollectionRunCounters,
  resetRunningCollectionRunRows,
} from '@/libs/database/CollectionRuns/queries';
import { CollectionRunRow, CollectionRunStatus } from '@/libs/database/CollectionRuns/types';
import {
  cancelPendingCollectionRunItemRows,
  claimCollectionRunItemRowsForPrompt,
  countCollectionRunItemRowsByStatus,
  finishCollectionRunItemRow,
  getNextPendingPromptGroupForRun,
  resetRunningCollectionRunItemRows,
} from '@/libs/database/CollectionRunItems/queries';
import {
  CollectionRunItemRow,
  PendingCollectionRunPromptGroup,
} from '@/libs/database/CollectionRunItems/types';
import { MAX_CONCURRENT_PROMPT_GROUPS } from './constants';
import { executePrompt } from './executePrompt';

// The single in-process guard below is only an optimisation. The real correctness mechanism is
// the conditional UPDATE inside `claimCollectionRunRow` / `claimCollectionRunItemRowsForPrompt`:
// under Turbopack, `instrumentation.ts` and this route handler can resolve `runLoop.ts` to
// different module instances, so two loops can genuinely coexist in the same process. Both would
// still be correct because every claim is a conditional UPDATE that only one of them can win —
// this guard just avoids the redundant work of running two loops when they share a module.
let activeLoopPromise: Promise<void> | undefined;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Starts the single Collection Run loop if it is not already alive, and returns immediately.
 * Idempotent: the in-process guard means a second call while a loop is running does nothing. */
export function ensureCollectionRunLoopIsRunning(): void {
  if (activeLoopPromise) return;
  // Detached on purpose: nothing in a request path should await a loop that can run for as long
  // as the whole Collection Run takes. This is only safe because every bit of progress is durable
  // in SQLite (the claim UPDATEs) and `resumeInterruptedCollectionRuns()` runs at boot — a killed
  // process leaves no in-memory intent to lose, just `running` rows for the next boot to reset.
  // The `.catch()` is required: without it, a throw here would surface as an unhandled promise
  // rejection and could take the whole server down.
  activeLoopPromise = drainCollectionRuns()
    .catch((error) => console.error('Collection Run loop failed', error))
    .finally(() => {
      activeLoopPromise = undefined;
    });
}

/** Resolves when the currently-running loop has drained. Test seam and shutdown hook; nothing in
 * a request path should await this. */
export async function waitForCollectionRunLoop(): Promise<void> {
  await activeLoopPromise;
}

/** Boot-time recovery: any item left `running` by a killed process goes back to `pending`, and any
 * Run left `running` goes back to `pending`, so the loop picks up where it stopped. A Run that was
 * being cancelled when the process died still has its already-cancelled items recorded as
 * `cancelled` — its freshly-reset (previously `running`) items are cancelled too, so a cancel
 * interrupted by a quit is not silently un-cancelled. */
export async function resumeInterruptedCollectionRuns(): Promise<void> {
  await resetRunningCollectionRunItemRows();
  const resumedRuns = await resetRunningCollectionRunRows();
  for (const run of resumedRuns) {
    const counts = await countCollectionRunItemRowsByStatus(run.id);
    if (counts.cancelled) await cancelPendingCollectionRunItemRows(run.id);
  }
}

async function drainCollectionRuns(): Promise<void> {
  while (true) {
    const run = await getOldestPendingCollectionRunRow();
    if (!run) return;
    const claimed = await claimCollectionRunRow(run.id);
    if (!claimed) continue; // Another loop instance won the race — re-query, don't assume.
    await executeCollectionRun(claimed);
  }
}

async function executeCollectionRun(run: CollectionRunRow): Promise<void> {
  try {
    const inFlightGroups = new Set<Promise<void>>();
    // Every Project this loop instance actually claims a group for, so `prompts_updated_at` can
    // be bumped for exactly those Projects at finalisation below (mirrors today's per-invocation
    // freshness write; moving freshness fully onto the Run is issues 13/14's job).
    const touchedProjectIds = new Set<string>();

    while (true) {
      const group = await getNextPendingPromptGroupForRun(run.id);
      // No pending groups remain. Items only leave `pending` via a claim in this same loop (a
      // failure marks an item `failed`, never back to `pending`), so none can appear later in
      // this run — safe to stop claiming and just drain whatever is still in flight below.
      if (!group) break;

      const items = await claimCollectionRunItemRowsForPrompt(
        run.id,
        group.promptId,
        group.chatbotIds
      );
      if (!items.length) continue; // Raced with another loop instance — re-query, don't assume.

      touchedProjectIds.add(group.projectId);

      const groupPromise: Promise<void> = executeGroup(run, group, items).finally(() => {
        inFlightGroups.delete(groupPromise);
      });
      inFlightGroups.add(groupPromise);

      if (inFlightGroups.size >= MAX_CONCURRENT_PROMPT_GROUPS) {
        await Promise.race(inFlightGroups);
      }
    }
    await Promise.all(inFlightGroups);

    const counts = await countCollectionRunItemRowsByStatus(run.id);
    const status: CollectionRunStatus = counts.cancelled ? 'cancelled' : 'completed';
    await refreshCollectionRunCounters(run.id);
    await finishCollectionRunRow(run.id, status);

    const now = new Date().toISOString();
    await Promise.all(
      [...touchedProjectIds].map((projectId) =>
        updateProjectRow(projectId, { prompts_updated_at: now })
      )
    );
  } catch (error) {
    // An error escaping here means the Run itself could not execute (e.g. a claim or counter
    // write throwing) — as opposed to a per-item failure, which `executeGroup` below already
    // contains. This is the only path that ends a Run `failed`.
    await finishCollectionRunRow(run.id, 'failed', getErrorMessage(error));
  }
}

async function executeGroup(
  run: CollectionRunRow,
  group: PendingCollectionRunPromptGroup,
  items: CollectionRunItemRow[]
): Promise<void> {
  try {
    // The chatbot ids come from the CLAIMED rows, not the ones asked for — closing the window
    // where a process killed after this same delete-then-insert on a previous pass left duplicate
    // Prompt Responses, and keeping a retry (restricted to only the failed Chatbots) from
    // touching already-good Prompt Responses for the Chatbots it didn't claim.
    const chatbotIds = items.map((item) => item.chatbot_id);
    await deletePromptResponseRowsWithRunIdAndPromptId(run.id, group.promptId, chatbotIds);

    const outcomes = await executePrompt({
      promptId: group.promptId,
      promptName: group.promptName,
      projectId: group.projectId,
      chatbotIds,
      workflowId: run.id,
      runId: run.id,
    });

    // `executePrompt` returns one outcome per requested chatbot id, in that same order, so
    // `items[i]` and `outcomes[i]` line up positionally.
    await Promise.all(
      items.map((item, index) => {
        const outcome = outcomes[index];
        return finishCollectionRunItemRow(item.id, {
          status: outcome.isCompleted ? 'completed' : 'failed',
          error: outcome.error,
          attemptsUsed: outcome.attempts,
        });
      })
    );
  } catch (error) {
    // `executePrompt` only throws when persistence itself fails — every item of this group fails
    // with that message, and the Run carries on (a Run with failed items still ends `completed`).
    const message = getErrorMessage(error);
    await Promise.all(
      items.map((item) =>
        finishCollectionRunItemRow(item.id, { status: 'failed', error: message, attemptsUsed: 1 })
      )
    );
  } finally {
    // Counters are derived, never accumulated in memory, so they stay correct after a crash, a
    // resume, or a retry with no reconciliation code.
    await refreshCollectionRunCounters(run.id);
  }
}
