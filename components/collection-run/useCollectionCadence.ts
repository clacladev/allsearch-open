'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { showErrorAlertToast } from '@/components/Alerts';
import { useCollectionRunContext } from './CollectionRunContext';
import { deriveCadenceSurfaces } from './CollectionCadenceSurfaces';
import type { CollectionCadenceResponse } from '@/app/api/collection-runs/cadence/types';

// Shared data/mutation logic behind the cadence surfaces (retry offer, staleness banner, quiet
// countdown), reused by both the floating overlay (`CollectionCadenceSurfaces`) and the sidebar
// countdown card. Both callers share the same SWR cache key, so mounting the hook twice dedupes
// to a single fetch.
export function useCollectionCadence(hasProjects: boolean) {
  const { isRunInProgress } = useCollectionRunContext();
  const { mutate: mutateGlobal } = useSWRConfig();
  const [dismissedRetryRunId, setDismissedRetryRunId] = useState<string>();
  const wasRunInProgressRef = useRef(isRunInProgress);
  // Lazily read once at mount (not during render, which must stay pure), then kept live by a 60s
  // timer so the countdown/staleness boundary is re-evaluated even while the cadence poll keeps
  // returning a deep-equal (same-reference) SWR payload.
  const [now, setNow] = useState(() => Date.now());

  const { data, mutate } = useSWR<CollectionCadenceResponse>(
    RouteHelper.Api.CollectionRuns.getCadence(),
    (url: string) => appFetch<CollectionCadenceResponse>(url),
    { refreshInterval: 60_000 }
  );

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Re-check cadence as soon as a Run finishes, instead of waiting for the next 60s poll. Compares
  // against "not false" rather than "true" so a retry that reopens a dismissed Run — whose progress
  // stays undefined for its whole lifetime (see useCollectionRunProgress.ts) — still counts as a
  // completion when it lands on false.
  useEffect(() => {
    if (wasRunInProgressRef.current !== false && isRunInProgress === false) {
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

  const { shouldShowRetry, failedRun, cadenceState } = deriveCadenceSurfaces({
    hasProjects,
    isRunInProgress,
    cadenceData: data,
    dismissedRetryRunId,
    now,
  });

  return {
    shouldShowRetry,
    failedRun,
    cadenceState,
    triggerRefresh,
    isRefreshing,
    triggerRetry,
    isRetrying,
    dismissRetry: (runId: string) => setDismissedRetryRunId(runId),
  };
}
