'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { showErrorAlertToast } from '@/components/Alerts';
import type { ActiveCollectionRunResponse } from '@/app/api/collection-runs/active/types';
import type { CollectionRunProgress } from '@/libs/collection/progress';

/** Pure state-machine core of the hook below, extracted so it can be unit-tested without a DOM or
 * React rendering. `hasDiscoveryResponse` is `activeRun !== undefined` at the call site — it
 * distinguishes "the `/active` SWR call has not resolved yet" from "it resolved and there is no
 * active Run" (`activeRunId` is then `null`/`undefined` either way). */
export function deriveIsRunInProgress(state: {
  runId: string | undefined;
  hasDiscoveryResponse: boolean;
  activeRunId: string | null | undefined;
  isStreamError: boolean;
  progress: CollectionRunProgress | undefined;
}): boolean | undefined {
  const { runId, hasDiscoveryResponse, activeRunId, isStreamError, progress } = state;
  const knownRunId = runId ?? activeRunId ?? undefined;

  if (!runId && !hasDiscoveryResponse) return undefined;
  if (isStreamError) return false;
  if (knownRunId && !progress) return undefined;
  if (!knownRunId || !progress) return false;
  return !progress.isTerminal;
}

export function useCollectionRunProgress(initialRunId?: string): {
  progress: CollectionRunProgress | undefined;
  /** undefined = not known yet (discovery or first frame still pending). */
  isRunInProgress: boolean | undefined;
  isReconnecting: boolean;
  /** The stream closed permanently (e.g. a 404 on reconnect) without ever reaching a terminal
   * frame. Callers should stop waiting on `progress` and fall through. */
  isStreamError: boolean;
  cancel: () => Promise<void>;
  isCancelling: boolean;
  clear: () => void;
} {
  const [runId, setRunId] = useState(initialRunId);
  const [dismissedRunId, setDismissedRunId] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState<CollectionRunProgress | undefined>(undefined);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isStreamError, setIsStreamError] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Kept live whenever the current Run is unknown, already finished, or its stream died without
  // ever reaching a terminal frame, so a new active Run is discovered after the previous one ends
  // — not just once, ever (issue 12 finding 3) — and so a permanently-closed stream doesn't strand
  // the caller on a `runId` that will never update again. Skipped entirely when the caller supplied
  // `initialRunId`: that caller already knows its own Run (e.g. the onboarding report) and has no
  // dismiss control, so re-discovery would swap the rendered report for an unrelated Run started
  // later in the same session (issue 12 finding 5).
  const { data: activeRun } = useSWR<ActiveCollectionRunResponse>(
    !initialRunId && (!runId || isStreamError || progress?.isTerminal)
      ? RouteHelper.Api.CollectionRuns.getActive()
      : null,
    (url: string) => appFetch<ActiveCollectionRunResponse>(url),
    { refreshInterval: 10_000 }
  );

  useEffect(() => {
    if (initialRunId) return;
    if (isStreamError && runId) {
      setRunId(undefined);
      setProgress(undefined);
      return;
    }
    if (activeRun?.runId && activeRun.runId !== runId) {
      // A dismissed Run id becoming active again means it was reopened (e.g. a retry after the
      // progress bar was dismissed) — clear the dismissal so the branch above re-attaches to it on
      // the next pass, instead of ignoring it for its whole lifetime.
      if (activeRun.runId === dismissedRunId) {
        setDismissedRunId(undefined);
      } else {
        setRunId(activeRun.runId);
        setProgress(undefined);
        setIsStreamError(false);
      }
    }
  }, [activeRun, runId, dismissedRunId, isStreamError, initialRunId]);

  useEffect(() => {
    if (!runId) return;

    setIsStreamError(false);
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
    source.onerror = () => {
      const isClosed = source.readyState === EventSource.CLOSED;
      setIsReconnecting(!isClosed);
      // EventSource never retries a non-200 / non-event-stream response on its own, so a closed
      // connection here means this stream is dead for good — surface that instead of leaving
      // callers waiting on a `progress` frame that will never arrive.
      if (isClosed) setIsStreamError(true);
    };

    return () => source.close();
  }, [runId]);

  const isRunInProgress = deriveIsRunInProgress({
    runId,
    hasDiscoveryResponse: activeRun !== undefined,
    activeRunId: activeRun?.runId,
    isStreamError,
    progress,
  });

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
    setDismissedRunId(runId);
    setRunId(undefined);
    setProgress(undefined);
    setIsStreamError(false);
  }

  return { progress, isRunInProgress, isReconnecting, isStreamError, cancel, isCancelling, clear };
}
