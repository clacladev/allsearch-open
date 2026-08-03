import { deletePromptResponseRowsWithRunIdAndPromptId } from '@/libs/database/PromptResponses/queries';
import { updateProjectRow } from '@/libs/database/Projects/queries';
import {
  claimCollectionRunRow,
  finishRunningCollectionRunRow,
  getOldestPendingCollectionRunRow,
  recomputeCollectionRunCounters,
  resetRunningCollectionRunRows,
} from '@/libs/database/CollectionRuns/queries';
import { CollectionRunRow } from '@/libs/database/CollectionRuns/types';
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
      if (group) {
        const items = await claimCollectionRunItemRowsForPrompt(
          run.id,
          group.promptId,
          group.chatbotIds
        );
        if (!items.length) continue; // Raced with another loop instance — re-query, don't assume.

        touchedProjectIds.add(group.projectId);

        // `.catch()` is attached here, before the promise is admitted to the in-flight set: without
        // it, a rejection from `executeGroup` (it can still throw from the delete-then-insert or
        // the finish writes, even though its own try/catch contains a persistence failure) would
        // surface as an unhandled rejection rather than something `Promise.race`/`Promise.all`
        // below can observe safely.
        const groupPromise: Promise<void> = executeGroup(run, group, items)
          .catch((error) => console.error('Collection Run group failed', error))
          .finally(() => inFlightGroups.delete(groupPromise));
        inFlightGroups.add(groupPromise);

        if (inFlightGroups.size >= MAX_CONCURRENT_PROMPT_GROUPS) {
          await Promise.race(inFlightGroups);
        }
        continue;
      }

      if (inFlightGroups.size) {
        // Groups are still finishing, which could themselves free up capacity or (indirectly)
        // leave more to claim; wait for one before deciding there is nothing left.
        await Promise.race(inFlightGroups);
        continue;
      }

      // Nothing pending and nothing in flight, as of this check. `retryFailedCollectionRunItems`
      // resets items back to `pending` from outside this loop and can do so at any moment
      // (finding 2) — including after a claim pass here already saw no groups — so this is
      // re-verified against a fresh count rather than assumed. If pending items appeared, loop
      // back into claiming instead of falling through to finalise.
      const counts = await countCollectionRunItemRowsByStatus(run.id);
      if (counts.pending) continue;

      await recomputeCollectionRunCounters(run.id);
      // Conditional on the Run still being `running`: closes the same window from the other side
      // — `retryFailedCollectionRunItems` could reopen this Run to `pending` between the count
      // above and this write, and that reopen must not be clobbered back to a terminal status by a
      // finaliser acting on a now-stale view of the Run.
      await finishRunningCollectionRunRow(run.id, counts.cancelled ? 'cancelled' : 'completed');
      break;
    }

    const now = new Date().toISOString();
    await Promise.all(
      [...touchedProjectIds].map((projectId) =>
        updateProjectRow(projectId, { prompts_updated_at: now })
      )
    );
  } catch (error) {
    // An error escaping here means the Run itself could not execute (e.g. a claim or counter
    // write throwing) — as opposed to a per-item failure, which `executeGroup` below already
    // contains. This is the only path that ends a Run `failed`, and only when the Run is still
    // `running` — a Run already reopened by a retry, or already finalised by this same run loop on
    // a previous pass, must not be clobbered.
    await finishRunningCollectionRunRow(run.id, 'failed', getErrorMessage(error));
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
    // `executePrompt` throwing usually means persistence itself failed — every item of this group
    // fails with that message, and the Run carries on (a Run with failed items still ends
    // `completed`). It can also mean the Prompt or Project was deleted mid-Run: the `ON DELETE
    // CASCADE` FKs remove the item rows too, so `finishCollectionRunItemRow` below returns
    // `undefined` for them instead of throwing (the work it would have recorded is moot, not a
    // failure) — and this whole branch is wrapped so that failing to record a failure can never
    // itself escape and be mistaken by the caller for the Run being unable to execute at all.
    try {
      const message = getErrorMessage(error);
      await Promise.all(
        items.map((item) =>
          finishCollectionRunItemRow(item.id, { status: 'failed', error: message, attemptsUsed: 1 })
        )
      );
    } catch (innerError) {
      console.error('Collection Run group failure handling itself failed', innerError);
    }
  } finally {
    // Counters are derived, never accumulated in memory, so they stay correct after a crash, a
    // resume, or a retry with no reconciliation code. Guarded for the same reason as the catch
    // above — the Run's own Project could be gone by now too (its counters row is unaffected, but
    // there is no reason to let this throw escape either).
    try {
      await recomputeCollectionRunCounters(run.id);
    } catch (counterError) {
      console.error('Collection Run counter recompute failed', counterError);
    }
  }
}
