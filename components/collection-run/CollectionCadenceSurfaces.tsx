'use client';

import { FloatingAlert } from '@/components/shared/floating-alert';
import { deriveCollectionCadenceState } from '@/libs/collection/cadence';
import type { CollectionCadenceState } from '@/libs/collection/cadence';
import { useCollectionCadence } from './useCollectionCadence';
import type { CollectionCadenceResponse } from '@/app/api/collection-runs/cadence/types';

/** Pure decision core of the component below, extracted so the criteria that decide which of the
 * three cadence surfaces render (retry offer, staleness banner, quiet countdown) can be
 * unit-tested without a DOM or SWR — the same pattern `deriveIsRunInProgress` establishes in
 * `useCollectionRunProgress.ts`. */
export function deriveCadenceSurfaces(input: {
  hasProjects: boolean;
  isRunInProgress: boolean | undefined;
  cadenceData: CollectionCadenceResponse | undefined;
  dismissedRetryRunId: string | undefined;
  now: number;
}): {
  shouldShowRetry: boolean;
  failedRun: CollectionCadenceResponse['failedRun'];
  cadenceState: CollectionCadenceState;
} {
  const { hasProjects, isRunInProgress, cadenceData, dismissedRetryRunId, now } = input;

  // undefined = not known yet; prevents a flash before discovery resolves. Hides all three
  // surfaces while a Run is in progress, before Project discovery, and before cadence data loads.
  if (!hasProjects || isRunInProgress !== false || !cadenceData) {
    return { shouldShowRetry: false, failedRun: null, cadenceState: { kind: 'unknown' } };
  }

  const failedRun = cadenceData.failedRun;
  return {
    shouldShowRetry: !!failedRun && failedRun.runId !== dismissedRetryRunId,
    failedRun,
    cadenceState: deriveCollectionCadenceState({
      lastCompletedRunFinishedAt: cadenceData.lastCompletedRunFinishedAt,
      now,
    }),
  };
}

// Renders the retry-offer and staleness-banner cadence surfaces above the Collection Run progress
// bar, in every page under (private). The quiet countdown surface lives in the sidebar instead
// (`CollectionCadenceSidebarCard`); both share `useCollectionCadence`'s SWR cache key, so mounting
// both costs no extra network requests.
export function CollectionCadenceSurfaces({ hasProjects }: { hasProjects: boolean }) {
  const {
    shouldShowRetry,
    failedRun,
    cadenceState,
    triggerRefresh,
    isRefreshing,
    triggerRetry,
    isRetrying,
    dismissRetry,
  } = useCollectionCadence(hasProjects);

  if (!shouldShowRetry && cadenceState.kind !== 'stale') return null;

  return (
    <div
      className="pointer-events-none fixed right-0 bottom-0 z-40 flex w-full max-w-sm flex-col gap-3 p-4"
      style={{ paddingBottom: 'calc(var(--collection-run-bar-height, 0px) + 1rem)' }}
    >
      {shouldShowRetry && failedRun && (
        <div className="pointer-events-auto" data-testid="collection-cadence-retry">
          <FloatingAlert
            tone="warning"
            title={`${failedRun.failedPromptCount} Prompt${failedRun.failedPromptCount === 1 ? '' : 's'} failed to collect`}
            description="Only the failed Prompts will be re-run."
            confirmLabel="Retry failed Prompts"
            dismissLabel="Dismiss"
            onConfirm={() => !isRetrying && triggerRetry()}
            onClose={() => dismissRetry(failedRun.runId)}
          />
        </div>
      )}

      {cadenceState.kind === 'stale' && (
        <div className="pointer-events-auto" data-testid="collection-cadence-stale">
          <FloatingAlert
            tone="warning"
            title="Your data is out of date"
            description="It has been more than 7 days since your data was last updated."
            confirmLabel="Refresh data"
            onConfirm={() => !isRefreshing && triggerRefresh()}
          />
        </div>
      )}
    </div>
  );
}
