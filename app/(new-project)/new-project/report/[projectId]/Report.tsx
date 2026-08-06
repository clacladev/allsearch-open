'use client';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { Button } from '@/components/base/buttons/button';
import { RouteHelper } from '@/libs/routes';
import FormHeader from '../../components/FormHeader';
import useSWRImmutable from 'swr/immutable';
import { useMemo } from 'react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { VisualContainer } from '@/app/(private)/project/[projectId]/overview/components/VisualContainer';
import BrandsRankingRadial, {
  getBrandsRankingRadialData,
} from '@/app/(private)/project/[projectId]/overview/components/BrandsRankingRadial';
import { NewProjectLayoutColumn } from '@/app/(new-project)/layout';
import { ArrowRight, RefreshCcw01 } from '@untitledui/icons';
import { OverviewData } from '@/libs/utils/project-analysis/getOverviewData';
import VisibilityScoresBarChart, {
  getVisibilityScoresBarChartData,
} from '../../../../(private)/project/[projectId]/overview/components/VisibilityScoresBarChart';
import { MetricsSimple } from '@/components/application/metrics/metrics';
import { CollectionRunProgress } from '@/components/collection-run/CollectionRunProgress';
import { useCollectionRunProgress } from '@/components/collection-run/useCollectionRunProgress';
import { appFetch } from '@/hooks/appFetch';
import { formatCollectionRunProgressSummary } from '@/libs/collection/progress';

dayjs.extend(LocalizedFormat);

function getMentionsTotal(data: OverviewData | undefined) {
  if (!data) return undefined;
  return data.topSourceContentSummary.data.reduce(
    (total, entry) => total + (entry.projectIdRank !== -1 ? 1 : 0),
    0
  );
}

export default function Report({ projectId, runId }: { projectId: string; runId?: string }) {
  const { progress, isRunInProgress, isReconnecting, cancel, isCancelling } =
    useCollectionRunProgress(runId);

  // Request the report only once the stream says the Run is done (or that there is no Run).
  const {
    data,
    error: reportError,
    mutate: retryReport,
  } = useSWRImmutable(isRunInProgress === false ? ['new-project-report', projectId] : null, () =>
    appFetch<OverviewData>(RouteHelper.Api.NewProject.getReport(projectId))
  );

  const [rankingsSummaryRadialData, visibilityScoreBarListData, mentionsTotal] = useMemo(
    () => [
      getBrandsRankingRadialData(data),
      getVisibilityScoresBarChartData(data),
      getMentionsTotal(data),
    ],
    [data]
  );

  if (isRunInProgress === undefined) {
    return (
      <NewProjectLayoutColumn size="lg">
        <LoadingIndicator label="Loading your Brand AI Visibility Report..." />
      </NewProjectLayoutColumn>
    );
  }

  // `progress` can still be undefined here for a render or two (the `isRunInProgress` flip and the
  // frame that backs it land in separate state updates) — fall through to the loading state below
  // rather than asserting it is present.
  if (isRunInProgress === true && progress) {
    return (
      <NewProjectLayoutColumn size="lg">
        <FormHeader title="Collecting your AI visibility data…" description="" />
        <CollectionRunProgress
          progress={progress}
          variant="panel"
          isReconnecting={isReconnecting}
          onCancel={cancel}
          isCancelling={isCancelling}
        />
      </NewProjectLayoutColumn>
    );
  }

  if (!data) {
    return (
      <NewProjectLayoutColumn size="lg">
        {reportError ? (
          <>
            <div className="text-error-800 text-sm">{reportError.message}</div>
            <Button
              size="lg"
              color="secondary"
              iconLeading={RefreshCcw01}
              onClick={() => retryReport()}
            >
              Retry
            </Button>
          </>
        ) : (
          <LoadingIndicator label="Loading your Brand AI Visibility Report..." />
        )}
      </NewProjectLayoutColumn>
    );
  }

  return (
    <NewProjectLayoutColumn size="lg">
      <FormHeader
        title="Your Brand AI Visibility Report"
        description="Rankings are based on your selected prompts only. Add more prompts to uncover new opportunities."
      />

      {data.latestRun && (
        <div
          className="text-tertiary -mt-4 ml-0.5 text-xs"
          data-testid="report-latest-run-provenance"
        >
          {`Ranking from the collection on ${dayjs(data.latestRun.date).format('ll')}`}
        </div>
      )}

      {progress?.isTerminal && (progress.status !== 'completed' || progress.promptsFailed > 0) && (
        <div className="text-tertiary -mt-4 ml-0.5 text-xs">
          {formatCollectionRunProgressSummary(progress)}
        </div>
      )}

      {reportError && (
        <div className="text-error-800 -mt-4 ml-0.5 text-xs">{reportError?.message}</div>
      )}

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-col gap-4">
          <VisualContainer
            title="Average position"
            info="How your brand ranks against your competitors."
            className="min-w-60"
          >
            <BrandsRankingRadial data={rankingsSummaryRadialData} highlightId={projectId} />
          </VisualContainer>

          {!!mentionsTotal && (
            <MetricsSimple
              title={`${mentionsTotal} times`}
              trend="positive"
              type="modern"
              subtitle="Your Total Mentions"
            />
          )}
        </div>

        <VisualContainer
          title="Visibility score"
          info="How often each brand appears across all prompt responses in the selected period."
          className="grow"
        >
          <VisibilityScoresBarChart items={visibilityScoreBarListData} highlightId={projectId} />
        </VisualContainer>
      </div>

      <Button
        size="lg"
        href={RouteHelper.Project.getOverview(projectId)}
        isDisabled={reportError}
        iconTrailing={ArrowRight}
      >
        Start Improving Your Visibility
      </Button>
    </NewProjectLayoutColumn>
  );
}
