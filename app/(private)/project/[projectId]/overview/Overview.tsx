'use client';

import { BarChart3, Eye, Smile, TriangleAlert } from 'lucide-react';
import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LatestRunNotice } from './components/LatestRunNotice';
import { CollectionRunCoverageBanner } from './components/CollectionRunCoverageBanner';
import { VisualContainer } from './components/VisualContainer';
import VisibilityChart from './components/VisibilityChart';
import { AnalysisDateRangePicker } from '@/components/shared/analysis-date-range-picker';
import { RouteHelper } from '@/libs/routes';
import { OverviewData } from '@/libs/utils/project-analysis/getOverviewData';
import { useRouter } from 'next/navigation';
import { ISODateString } from '@/libs/database/shared/ISODateString';
import { useMemo, useState } from 'react';
import { ExportActionsButton } from '@/app/(private)/components/ExportActionsButton';
import { exportOverviewZip } from '@/app/(private)/project/[projectId]/overview/utils/exportOverviewZip';
import { TopSourceContentsTable } from './components/Tables/TopSourceContentsTable';
import { TopSourceDomainsTable } from './components/Tables/TopSourceDomainsTable';
import { usePrivateLayoutContext } from '@/app/(private)/components/PrivateLayoutContext';
import { TopOpportunitiesTable } from './components/Tables/TopOpportunitiesTable';
import { SourcesType } from '@/app/(private)/project/[projectId]/sources/components/types';
import VisibilityScoresBarChart, {
  getVisibilityScoresBarChartData,
} from '@/app/(private)/project/[projectId]/overview/components/VisibilityScoresBarChart';
import SentimentChart from './components/SentimentChart';
import SentimentScoresBarChart, {
  getSentimentScoresBarChartData,
} from './components/SentimentScoresBarChart';
import { getBrandColor, PROJECT_BRAND_COLOR } from '@/libs/utils/brandColor';
import OverviewChartTypeGroup, { OverviewChartType } from './components/OverviewChartTypeGroup';
import { ChatbotCoverageCaption } from '@/app/(private)/components/ChatbotCoverageCaption';
import type { ChatbotId } from '@/libs/database/shared/ChatbotId';

dayjs.extend(LocalizedFormat);

function getProjectVisibilityScore(overviewData: OverviewData) {
  const projectId = overviewData.brands.find((brand) => brand.isProject)?.brandId;
  if (!projectId) return 0;
  const score = overviewData.visibilityScores.find((score) => score.brandId === projectId);
  return score?.percentage ?? 0;
}

function getBrandColorMap(overviewData: OverviewData) {
  return Object.fromEntries(
    overviewData.brands.map((brand) => [
      brand.label,
      brand.isProject ? PROJECT_BRAND_COLOR : getBrandColor(brand.brandId),
    ])
  );
}

export default function ProjectOverview({
  projectId,
  startDate,
  endDate,
  overviewData,
  enabledChatbotIds,
}: {
  projectId: string;
  startDate: ISODateString;
  endDate: ISODateString;
  overviewData: OverviewData;
  enabledChatbotIds: ChatbotId[];
}) {
  const router = useRouter();
  const { currentProject, currentCompetitors, currentPrompts } = usePrivateLayoutContext();
  const [sourcesType, setSourcesType] = useState<SourcesType>('contents');
  const [chartType, setChartType] = useState<OverviewChartType>('visibility');
  const selectedDateRange = { start: startDate, end: endDate };

  const [
    projectVisibilityScore,
    visibilityScoreBarListData,
    sentimentScoreBarListData,
    brandColorMap,
  ] = useMemo(
    () => [
      getProjectVisibilityScore(overviewData),
      getVisibilityScoresBarChartData(overviewData),
      getSentimentScoresBarChartData(overviewData),
      getBrandColorMap(overviewData),
    ],
    [overviewData]
  );

  const onDateRangeChange = (dateRange: { start: string; end: string }) =>
    router.push(
      RouteHelper.Project.getOverview(
        projectId,
        dateRange.start,
        dateRange.end
      )
    );

  const hasManyDaysOfVisibility = overviewData.visibilityDataset.length > 1;
  const hasSentimentData = sentimentScoreBarListData.length > 0;
  const hasManyDaysOfSentiment = overviewData.sentimentDataset.length > 1;

  const chartToggle = hasSentimentData ? (
    <OverviewChartTypeGroup chartType={chartType} onChartTypeChangeAction={setChartType} />
  ) : undefined;

  const onExportCsv = () => {
    if (!currentProject) return;
    exportOverviewZip({
      visibilityItems: visibilityScoreBarListData,
      sentimentItems: sentimentScoreBarListData,
      topSourceContents: overviewData.topSourceContentSummary.data,
      topSourceDomains: overviewData.topSourceDomainsSummary.data,
      topOpportunities: overviewData.topOpportunitiesSummary.data,
      project: currentProject,
      competitors: currentCompetitors,
      prompts: currentPrompts,
      projectId,
      startDate,
      endDate,
    });
  };

  if (!currentProject) return null;

  return (
    <div className="flex flex-col gap-4">
      {currentProject.is_paused && (
        <Alert>
          <TriangleAlert aria-hidden="true" />
          <AlertTitle>This project is paused</AlertTitle>
          <AlertDescription>Prompt tracking is currently disabled for this project.</AlertDescription>
        </Alert>
      )}

      {overviewData.latestRun && (
        <LatestRunNotice
          latestRunDate={overviewData.latestRun.date}
          latestRunFinishedAt={overviewData.latestRun.finishedAt}
          latestRunId={overviewData.latestRun.runId}
          rangeEndDate={endDate}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <AnalysisDateRangePicker value={selectedDateRange} onApply={onDateRangeChange} />
        <ExportActionsButton onExportCsvAction={onExportCsv} />
        {overviewData.latestRun && (
          <span className="text-tertiary text-sm" data-testid="overview-latest-run-provenance">
            {`Latest data from ${dayjs(overviewData.latestRun.date).format('ll')}`}
          </span>
        )}
      </div>

      <CollectionRunCoverageBanner runCount={overviewData.collectionRunCount} />

      <div className="flex flex-col gap-2 md:flex-row">
        {chartType === 'sentiment' && hasSentimentData ? (
          <>
            {hasManyDaysOfSentiment && (
              <VisualContainer
                title="Sentiment over time"
                info="Average sentiment expressed about each brand across AI responses over time."
                icon={Smile}
                className="grow"
                contentClassName="h-70"
                headerTrailing={chartToggle}
              >
                <SentimentChart
                  data={overviewData.sentimentDataset}
                  displayKeys={overviewData.brands.map((brand) => brand.label)}
                  highlightKey={overviewData.brands.find((brand) => brand.isProject)?.label}
                  colorMap={brandColorMap}
                />
              </VisualContainer>
            )}

            <VisualContainer
              title="Brand sentiment"
              info="Average sentiment expressed about each brand across all prompt responses in the selected period."
              icon={Smile}
              className={hasManyDaysOfSentiment ? 'md:w-1/3 md:min-w-60 xl:max-w-80' : 'grow'}
              contentClassName="h-70 overflow-auto"
              headerTrailing={hasManyDaysOfSentiment ? undefined : chartToggle}
            >
              <SentimentScoresBarChart items={sentimentScoreBarListData} highlightId={projectId} />
            </VisualContainer>
          </>
        ) : (
          <>
            {hasManyDaysOfVisibility && (
              <VisualContainer
                title={`Visibility score: ${projectVisibilityScore}%`}
                info="How often you appear in the tracked prompts' responses."
                caption={<ChatbotCoverageCaption enabledChatbotIds={enabledChatbotIds} />}
                icon={Eye}
                className="grow"
                contentClassName="h-70"
                headerTrailing={chartToggle}
              >
                <VisibilityChart
                  data={overviewData.visibilityDataset}
                  displayKeys={overviewData.brands.map((brand) => brand.label)}
                  highlightKey={overviewData.brands.find((brand) => brand.isProject)?.label}
                  colorMap={brandColorMap}
                />
              </VisualContainer>
            )}

            <VisualContainer
              title="Brand visibility"
              info="How often each brand appears across all prompt responses in the selected period."
              icon={BarChart3}
              className={hasManyDaysOfVisibility ? 'md:w-1/3 md:min-w-60 xl:max-w-80' : 'grow'}
              contentClassName="h-70 overflow-auto"
              headerTrailing={hasManyDaysOfVisibility ? undefined : chartToggle}
            >
              <VisibilityScoresBarChart
                items={visibilityScoreBarListData}
                highlightId={projectId}
              />
            </VisualContainer>
          </>
        )}
      </div>

      {sourcesType === 'domains' ? (
        <TopSourceDomainsTable
          projectId={projectId}
          totalCount={overviewData.topSourceDomainsSummary.totalCount}
          sources={overviewData.topSourceDomainsSummary.data}
          startDate={startDate}
          endDate={endDate}
          onSourceTypeChange={setSourcesType}
        />
      ) : (
        <TopSourceContentsTable
          project={currentProject}
          competitors={currentCompetitors}
          totalCount={overviewData.topSourceContentSummary.totalCount}
          sources={overviewData.topSourceContentSummary.data}
          startDate={startDate}
          endDate={endDate}
          onSourceTypeChange={setSourcesType}
        />
      )}

      <TopOpportunitiesTable
        projectId={projectId}
        totalCount={overviewData.topOpportunitiesSummary.totalCount}
        opportunities={overviewData.topOpportunitiesSummary.data}
        prompts={currentPrompts}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
