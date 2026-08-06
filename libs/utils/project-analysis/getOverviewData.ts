import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { PromptResponseSummaryRow } from '@/libs/database/PromptResponses/types';
import { SourceSummaryRow } from '@/libs/database/Sources/types';
import { ISODateString } from '@/libs/database/shared/ISODateString';
import { getVisibilityDataset, VisibilityDataset } from './getVisibilityDataset';
import { getVisibilityScore as getVisibilityScores, VisibilityScores } from './getVisibilityScore';
import { getSourceDomainsSummary, SourceDomain } from './getSourceDomainsSummary';
import { getSourceContentSummary, SourceContent } from './getSourceContentSummary';
import { getOpportunitiesSummary } from './getOpportunitiesSummary';
import { getRankingsSummary } from './getRankingsSummary';
import { getSentimentDataset, SentimentDataset } from './getSentimentDataset';
import { getSentimentScores, SentimentScores } from './getSentimentScores';
import { BrandInfo, Opportunity } from './types';
import { getPromptResponsesWorkRows, getLatestCollectionGroup } from './helpers';
import { Summary } from '@/libs/utils/Summary';

export const MAX_TOP_SOURCE_DOMAINS = 6;
export const MAX_TOP_SOURCE_CONTENTS = 6;
export const MAX_TOP_OPPORTUNITIES = 6;

export type LatestRunInfo = {
  runId: string | null;
  date: ISODateString;
  finishedAt: string;
};

export type OverviewData = {
  startDate: string;
  endDate: string;
  brands: BrandInfo[];
  visibilityDataset: VisibilityDataset;
  visibilityScores: VisibilityScores;
  rankingsSummary: BrandInfo[];
  latestRun: LatestRunInfo | null;
  topSourceDomainsSummary: Summary<SourceDomain>;
  topSourceContentSummary: Summary<SourceContent>;
  topOpportunitiesSummary: Summary<Opportunity>;
  sentimentDataset: SentimentDataset;
  sentimentScores: SentimentScores;
};

export async function getOverviewData(
  startDate: ISODateString,
  endDate: ISODateString,
  project: ProjectRow,
  competitors: CompetitorRow[],
  promptResponses: PromptResponseSummaryRow[],
  sourceRows: SourceSummaryRow[]
): Promise<OverviewData> {
  // Create a list of brands
  const brands: BrandInfo[] = [];
  brands.push({
    brandId: project.id,
    label: project.name,
    iconUrl: project.icon_url || undefined,
    isProject: true,
  });
  competitors
    .filter((competitor) => !competitor.is_archived)
    .forEach((competitor) => {
      brands.push({
        brandId: competitor.id,
        label: competitor.name ?? competitor.hostname,
        iconUrl: competitor.icon_url || undefined,
        isProject: false,
      });
    });

  // Create a map of brand_id to brand_info
  const brandsIdInfoMap = new Map<string, BrandInfo>();
  brands.forEach((brand) => brandsIdInfoMap.set(brand.brandId, brand));

  // Cleanup prompt responses before processing
  const promptResponsesWorkRows = getPromptResponsesWorkRows(promptResponses, sourceRows);

  // The collection the headline latest-run figures describe; null when the range holds no responses.
  const latestCollectionGroup = getLatestCollectionGroup(promptResponsesWorkRows);

  // Get the different analyses
  const [
    visibilityDataset,
    visibilityScores,
    rankingsSummary,
    topSourceDomainsSummary,
    topSourceContentSummary,
    topOpportunitiesSummary,
    sentimentDataset,
    sentimentScores,
  ] = await Promise.all([
    getVisibilityDataset(startDate, endDate, brandsIdInfoMap, promptResponsesWorkRows),
    getVisibilityScores(brandsIdInfoMap, promptResponsesWorkRows),
    getRankingsSummary(brandsIdInfoMap, promptResponsesWorkRows),
    getSourceDomainsSummary(project, promptResponsesWorkRows, MAX_TOP_SOURCE_DOMAINS),
    getSourceContentSummary(project, promptResponsesWorkRows, MAX_TOP_SOURCE_CONTENTS),
    getOpportunitiesSummary(project, promptResponsesWorkRows, MAX_TOP_OPPORTUNITIES),
    getSentimentDataset(startDate, endDate, brandsIdInfoMap, promptResponsesWorkRows),
    getSentimentScores(brandsIdInfoMap, promptResponsesWorkRows),
  ]);

  return {
    startDate,
    endDate,
    brands,
    visibilityDataset,
    visibilityScores,
    rankingsSummary,
    latestRun: latestCollectionGroup
      ? { runId: latestCollectionGroup.runId, date: latestCollectionGroup.date, finishedAt: latestCollectionGroup.finishedAt }
      : null,
    topSourceDomainsSummary,
    topSourceContentSummary,
    topOpportunitiesSummary,
    sentimentDataset,
    sentimentScores,
  };
}
