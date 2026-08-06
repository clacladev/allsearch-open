'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { appFetch } from '@/hooks/appFetch';
import { RouteHelper } from '@/libs/routes';
import { AlertFloating } from '@/components/application/alerts/alerts';
import { showErrorAlertToast } from '@/components/Alerts';
import { getShouldShowLatestRunNotice } from '@/libs/collection/latestRunStaleness';
import { deriveCollectionCadenceState } from '@/libs/collection/cadence';
import type { ISODateString } from '@/libs/database/shared/ISODateString';
import type { CollectionCadenceResponse } from '@/app/api/collection-runs/cadence/types';

dayjs.extend(LocalizedFormat);

/** In-context notice on the overview page telling the user the ranking they're looking at is
 * behind the app's latest collected data (issue 14, criteria 9, 11). */
export function LatestRunNotice({
  latestRunDate,
  latestRunFinishedAt,
  latestRunId,
  rangeEndDate,
}: {
  latestRunDate: ISODateString;
  latestRunFinishedAt: string;
  latestRunId: string | null;
  rangeEndDate: ISODateString;
}) {
  // Mount-time snapshot; the decision is day-granular so no interval is needed. Must be a lazy
  // initialiser, never `Date.now()` during render.
  const [now] = useState(() => Date.now());

  const { data, mutate } = useSWR<CollectionCadenceResponse>(
    RouteHelper.Api.CollectionRuns.getCadence(),
    (url: string) => appFetch<CollectionCadenceResponse>(url)
  );
  const { mutate: mutateGlobal } = useSWRConfig();

  const { trigger, isMutating } = useSWRMutation(
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
          'Failed to update data',
          error instanceof Error ? error.message : 'Failed to start the Collection Run'
        ),
    }
  );

  if (
    !getShouldShowLatestRunNotice({
      latestRunDate,
      latestRunFinishedAt,
      latestRunId,
      rangeEndDate,
      lastCompletedRunFinishedAt: data?.lastCompletedRunFinishedAt ?? null,
      lastCompletedRunId: data?.lastCompletedRunId ?? null,
      appWideStale:
        deriveCollectionCadenceState({
          lastCompletedRunFinishedAt: data?.lastCompletedRunFinishedAt ?? null,
          now,
        }).kind === 'stale',
      now,
    })
  ) {
    return null;
  }

  return (
    <div data-testid="overview-latest-run-stale">
      <AlertFloating
        color="warning"
        title={`Latest data is from ${dayjs(latestRunDate).format('ll')}`}
        description="Collect again to see current rankings."
        confirmLabel="Update data now"
        onConfirm={() => !isMutating && trigger()}
      />
    </div>
  );
}
