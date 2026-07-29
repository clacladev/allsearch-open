'use client';

import { Button } from '@/components/base/buttons/button';
import { RouteHelper } from '@/libs/routes';
import FormHeader from '../../components/FormHeader';
import { REPORT_TRY_AGAIN_LATER_ERROR_CODE } from '@/app/api/new-project/report/types';
import useSWR from 'swr';
import { useEffect, useMemo, useState } from 'react';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { VisualContainer } from '@/app/(private)/project/[projectId]/overview/components/VisualContainer';
import BrandsRankingTodayRadial, {
  getBrandsRankingTodayRadialData,
} from '@/app/(private)/project/[projectId]/overview/components/BrandsRankingTodayRadial';
import { NewProjectLayoutColumn } from '@/app/(new-project)/layout';
import { ArrowRight, RefreshCcw01 } from '@untitledui/icons';
import { OverviewData } from '@/libs/utils/project-analysis/getOverviewData';
import VisibilityScoresBarChart, {
  getVisibilityScoresBarChartData,
} from '../../../../(private)/project/[projectId]/overview/components/VisibilityScoresBarChart';
import { MetricsSimple } from '@/components/application/metrics/metrics';

const useReportBrandRankings = (
  projectId: string,
  shouldPoll: boolean,
  onSuccess: (brands: OverviewData | undefined) => void
) =>
  useSWR(
    projectId ? ['new-project-report', projectId] : null,
    async (): Promise<OverviewData | undefined> => {
      if (!projectId) return;
      const endpointUrl = RouteHelper.Api.NewProject.getReport(projectId);
      const response = await fetch(endpointUrl);

      if (!response.ok) {
        try {
          const json = await response.json();
          if (json.code === REPORT_TRY_AGAIN_LATER_ERROR_CODE) return undefined;
          throw new Error(json.error);
        } catch (error) {
          throw error;
        }
      }

      return await response.json();
    },
    { onSuccess, refreshInterval: shouldPoll ? 5_000 : 0 }
  );

function getMentionsTotal(data: OverviewData | undefined) {
  if (!data) return undefined;
  return data.topSourceContentSummary.data.reduce(
    (total, entry) => total + (entry.projectIdRank !== -1 ? 1 : 0),
    0
  );
}

export default function Report({ projectId }: { projectId: string }) {
  const [shouldPoll, setShouldPoll] = useState(true);
  const [shouldShowRetry, setShouldShowRetry] = useState(false);

  const { data, error: reportError } = useReportBrandRankings(
    projectId,
    shouldPoll,
    (brandsRanking) => setShouldPoll(!brandsRanking)
  );

  const [rankingsSummaryRadialData, visibilityScoreBarListData, mentionsTotal] = useMemo(
    () => [
      getBrandsRankingTodayRadialData(data),
      getVisibilityScoresBarChartData(data),
      getMentionsTotal(data),
    ],
    [data]
  );

  useEffect(() => {
    const timeout = setTimeout(() => setShouldShowRetry(true), 60_000);
    return () => clearTimeout(timeout);
  }, []);

  if (!data) {
    return (
      <NewProjectLayoutColumn size="lg">
        <LoadingIndicator label="Loading your Brand AI Visibility Report..." />

        {shouldShowRetry && (
          <Button
            color="secondary"
            onClick={() => window.location.reload()}
            isDisabled={reportError}
            iconLeading={RefreshCcw01}
          >
            Retry
          </Button>
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

      {reportError && (
        <div className="text-error-800 -mt-4 ml-0.5 text-xs">{reportError?.message}</div>
      )}

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex flex-col gap-4">
          <VisualContainer
            title="Average position"
            info="How your brand ranks against your competitors today."
            className="min-w-60"
          >
            <BrandsRankingTodayRadial data={rankingsSummaryRadialData} highlightId={projectId} />
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
