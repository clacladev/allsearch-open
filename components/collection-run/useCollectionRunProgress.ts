'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { showErrorAlertToast } from '@/components/Alerts';
import type { ActiveCollectionRunResponse } from '@/app/api/collection-runs/active/types';
import type { CollectionRunProgress } from '@/libs/collection/progress';

export function useCollectionRunProgress(initialRunId?: string): {
  runId: string | undefined;
  progress: CollectionRunProgress | undefined;
  /** undefined = not known yet (discovery or first frame still pending). */
  isRunInProgress: boolean | undefined;
  isReconnecting: boolean;
  cancel: () => Promise<void>;
  isCancelling: boolean;
  clear: () => void;
} {
  const [runId, setRunId] = useState(initialRunId);
  const [isCleared, setIsCleared] = useState(false);
  const [progress, setProgress] = useState<CollectionRunProgress | undefined>(undefined);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: activeRun } = useSWR<ActiveCollectionRunResponse>(
    runId || isCleared ? null : RouteHelper.Api.CollectionRuns.getActive(),
    (url: string) => appFetch<ActiveCollectionRunResponse>(url),
    { refreshInterval: 10_000 }
  );

  useEffect(() => {
    if (activeRun?.runId && activeRun.runId !== runId) setRunId(activeRun.runId);
  }, [activeRun, runId]);

  useEffect(() => {
    if (!runId) return;

    const source = new EventSource(RouteHelper.Api.CollectionRuns.getStream(runId));

    source.addEventListener('progress', (event) => {
      setProgress(JSON.parse((event as MessageEvent).data));
      setIsReconnecting(false);
    });
    source.addEventListener('done', (event) => {
      setProgress(JSON.parse((event as MessageEvent).data));
      source.close();
      setIsReconnecting(false);
    });
    source.onopen = () => setIsReconnecting(false);
    source.onerror = () => setIsReconnecting(source.readyState !== EventSource.CLOSED);

    return () => source.close();
  }, [runId]);

  let isRunInProgress: boolean | undefined;
  if ((!runId && !activeRun) || (runId && !progress)) {
    isRunInProgress = undefined;
  } else if ((!runId && activeRun?.runId === null && !progress) || progress?.isTerminal) {
    isRunInProgress = false;
  } else {
    isRunInProgress = true;
  }

  async function cancel() {
    if (!runId) return;
    setIsCancelling(true);
    try {
      await appFetch(
        RouteHelper.Api.CollectionRuns.getCancel(runId),
        { method: 'POST' },
        'Failed to cancel the Collection Run'
      );
    } catch (error) {
      showErrorAlertToast(
        'Failed to cancel',
        error instanceof Error ? error.message : 'Failed to cancel the Collection Run'
      );
    } finally {
      setIsCancelling(false);
    }
  }

  function clear() {
    setIsCleared(true);
    setRunId(undefined);
    setProgress(undefined);
  }

  return { runId, progress, isRunInProgress, isReconnecting, cancel, isCancelling, clear };
}
