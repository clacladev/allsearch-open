'use client';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { RouteHelper } from '@/libs/routes';
import FormHeader from '../../components/FormHeader';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RouteLoading } from '@/components/shared/route-loading';
import { VisualContainer } from '@/app/(private)/project/[projectId]/overview/components/VisualContainer';
import BrandsRankingRadial, {
  getBrandsRankingRadialData,
} from '@/app/(private)/project/[projectId]/overview/components/BrandsRankingRadial';
import { NewProjectLayoutColumn } from '@/app/(new-project)/layout';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { OverviewData } from '@/libs/utils/project-analysis/getOverviewData';
import VisibilityScoresBarChart, {
  getVisibilityScoresBarChartData,
} from '../../../../(private)/project/[projectId]/overview/components/VisibilityScoresBarChart';
import { CollectionRunProgress } from '@/components/collection-run/CollectionRunProgress';
import { useCollectionRunProgress } from '@/components/collection-run/useCollectionRunProgress';
import { formatCollectionRunProgressSummary } from '@/libs/collection/progress';

dayjs.extend(LocalizedFormat);

function getMentionsTotal(data: OverviewData | undefined) {
  if (!data) return undefined;
  return data.topSourceContentSummary.data.reduce(
    (total, entry) => total + (entry.projectIdRank !== -1 ? 1 : 0),
    0
  );
}

export default function Report({
  projectId,
  runId,
  initialData,
}: {
  projectId: string;
  runId?: string;
  initialData: OverviewData | undefined;
}) {
  const router = useRouter();
  const { progress, isRunInProgress, isReconnecting, cancel, isCancelling } =
    useCollectionRunProgress(runId);

  // When the Run lands in a terminal state ask the server to recompute. The page's
  // async server component re-runs (router.refresh) and re-mounts this component
  // with fresh `initialData`. The hook keeps the streaming panel mounted across the
  // pass, so users see Collecting → Report without a flash.
  useEffect(() => {
    if (isRunInProgress === false) router.refresh();
  }, [isRunInProgress, router]);

  const data = initialData;

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
        <RouteLoading label="Loading your Brand AI Visibility Report..." />
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
        <div className="text-error-800 text-sm">
          Could not load the report. Check the project and run state, then retry.
        </div>
        <Button size="lg" variant="secondary" onClick={() => router.refresh()}>
          <RefreshCw />
          Retry
        </Button>
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
            <Card size="sm">
              <CardHeader>
                <h3 className="text-tertiary text-sm font-medium">Your Total Mentions</h3>
              </CardHeader>
              <CardContent>
                <p className="text-display-sm text-primary font-semibold">
                  {mentionsTotal} times
                </p>
              </CardContent>
            </Card>
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

      <Button size="lg" render={<Link href={RouteHelper.Project.getOverview(projectId)} />}>
        Start Improving Your Visibility
        <ArrowRight />
      </Button>
    </NewProjectLayoutColumn>
  );
}