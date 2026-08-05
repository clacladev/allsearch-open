'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { AlertFloating } from '@/components/application/alerts/alerts';
import { Button } from '@/components/base/buttons/button';
import { showErrorAlertToast } from '@/components/Alerts';
import { deriveCollectionCadenceState } from '@/libs/collection/cadence';
import { useCollectionRunContext } from './CollectionRunContext';
import type { CollectionCadenceResponse } from '@/app/api/collection-runs/cadence/types';

// Renders the three cadence surfaces (retry offer, staleness banner, quiet countdown) above the
// Collection Run progress bar, in every page under (private). Reuses the shared
// `CollectionRunContext` instead of opening a second SSE stream / discovery poll.
export function CollectionCadenceSurfaces({ hasProjects }: { hasProjects: boolean }) {
  const { isRunInProgress } = useCollectionRunContext();
  const { mutate: mutateGlobal } = useSWRConfig();
  const [dismissedRetryRunId, setDismissedRetryRunId] = useState<string>();
  const wasRunInProgressRef = useRef(isRunInProgress);
  // Lazily read once at mount (not during render, which must stay pure), then refreshed whenever
  // fresh cadence data arrives so the derived state stays in step with the 60s poll.
  const [now, setNow] = useState(() => Date.now());

  const { data, mutate } = useSWR<CollectionCadenceResponse>(
    RouteHelper.Api.CollectionRuns.getCadence(),
    (url: string) => appFetch<CollectionCadenceResponse>(url),
    { refreshInterval: 60_000 }
  );

  useEffect(() => {
    if (data) setNow(Date.now());
  }, [data]);

  // Re-check cadence as soon as a Run finishes, instead of waiting for the next 60s poll.
  useEffect(() => {
    if (wasRunInProgressRef.current === true && isRunInProgress === false) {
      mutate();
    }
    wasRunInProgressRef.current = isRunInProgress;
  }, [isRunInProgress, mutate]);

  const { trigger: triggerRefresh, isMutating: isRefreshing } = useSWRMutation(
    RouteHelper.Api.CollectionRuns.getProcessAllPrompts(),
    async (url: string) => {
      await appFetch<void>(url, { method: 'POST' }, 'Failed to start the Collection Run');
    },
    {
      onSuccess: () => {
        mutateGlobal(RouteHelper.Api.CollectionRuns.getActive());
        mutate();
      },
      onError: (error) =>
        showErrorAlertToast(
          'Failed to refresh',
          error instanceof Error ? error.message : 'Failed to start the Collection Run'
        ),
    }
  );

  const { trigger: triggerRetry, isMutating: isRetrying } = useSWRMutation(
    data?.failedRun ? RouteHelper.Api.CollectionRuns.getRetry(data.failedRun.runId) : null,
    async (url: string) => {
      await appFetch<void>(url, { method: 'POST' }, 'Failed to retry the failed Prompts');
    },
    {
      onSuccess: () => {
        mutateGlobal(RouteHelper.Api.CollectionRuns.getActive());
        mutate();
      },
      onError: (error) =>
        showErrorAlertToast(
          'Failed to retry',
          error instanceof Error ? error.message : 'Failed to retry the failed Prompts'
        ),
    }
  );

  if (!hasProjects) return null;
  // undefined = not known yet; prevents a flash before discovery resolves.
  if (isRunInProgress !== false) return null;
  if (!data) return null;

  const cadenceState = deriveCollectionCadenceState({
    lastCompletedRunFinishedAt: data.lastCompletedRunFinishedAt,
    now,
  });

  const failedRun = data.failedRun;
  const shouldShowRetry = !!failedRun && failedRun.runId !== dismissedRetryRunId;

  return (
    <div
      className="pointer-events-none fixed right-0 bottom-0 z-40 flex w-full max-w-sm flex-col gap-3 p-4"
      style={{ paddingBottom: 'calc(var(--collection-run-bar-height, 0px) + 1rem)' }}
    >
      {shouldShowRetry && failedRun && (
        <div className="pointer-events-auto" data-testid="collection-cadence-retry">
          <AlertFloating
            color="warning"
            title={`${failedRun.failedPromptCount} Prompt${failedRun.failedPromptCount === 1 ? '' : 's'} failed to collect`}
            description="Only the failed Prompts will be re-run."
            confirmLabel="Retry failed Prompts"
            dismissLabel="Dismiss"
            onConfirm={() => !isRetrying && triggerRetry()}
            onClose={() => setDismissedRetryRunId(failedRun.runId)}
          />
        </div>
      )}

      {cadenceState.kind === 'stale' && (
        <div className="pointer-events-auto" data-testid="collection-cadence-stale">
          <AlertFloating
            color="warning"
            title="Your data is out of date"
            description="It has been more than 7 days since your data was last updated."
            confirmLabel="Refresh data"
            onConfirm={() => !isRefreshing && triggerRefresh()}
          />
        </div>
      )}

      {cadenceState.kind === 'countdown' && (
        <div
          className="pointer-events-auto flex items-center gap-2"
          data-testid="collection-cadence-countdown"
        >
          <span className="text-tertiary text-sm">
            {`Next update in ${cadenceState.daysRemaining} day${cadenceState.daysRemaining === 1 ? '' : 's'}`}
          </span>
          <Button
            size="sm"
            color="link-color"
            isDisabled={isRefreshing}
            onClick={() => triggerRefresh()}
          >
            Refresh now
          </Button>
        </div>
      )}
    </div>
  );
}
