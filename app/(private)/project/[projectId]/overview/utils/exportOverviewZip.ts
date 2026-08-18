import { mkConfig, generateCsv, asString } from 'export-to-csv';
import { zipSync, strToU8 } from 'fflate';
import { sanitizeCsvRow } from '@/libs/utils/csvSanitize';
import { VisibilityScoresBarChartItem } from '@/app/(private)/project/[projectId]/overview/components/VisibilityScoresBarChart';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { SourceDomain } from '@/libs/utils/project-analysis/getSourceDomainsSummary';
import { Opportunity } from '@/libs/utils/project-analysis/types';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';
import { PromptRow } from '@/libs/database/Prompts/types';
import { RouteHelper } from '@/libs/routes';
import { OPPORTUNITY_TYPE_NAME } from '@/libs/utils/opportunities';
import { resolveBrandName } from '@/app/(private)/project/[projectId]/sources/utils/exportSourcesCsv';
import { getOpportunityDescription } from '@/app/(private)/project/[projectId]/opportunities/utils/exportOpportunitiesCsv';
import { DIFFICULTY_MAP, getPriorityLabel } from '../../opportunities/components/Badges';
import { SentimentScoresBarChartItem } from '@/app/(private)/project/[projectId]/overview/components/SentimentScoresBarChart';
import { getSentimentLabel } from '@/app/(private)/project/[projectId]/components/SentimentIcon';

// ─── Helpers ────────────────────────────────────────────────────────────────

type CsvRow = Record<string, string | number | boolean | null | undefined>;

function toCsvString(rows: CsvRow[], filename: string): string {
  const config = mkConfig({ useKeysAsHeaders: true, filename });
  return asString(generateCsv(config)(rows.map(sanitizeCsvRow)));
}

// ─── Individual CSV builders ─────────────────────────────────────────────────

function buildBrandVisibilityCsv(items: VisibilityScoresBarChartItem[], filename: string): string {
  const rows = items.map((item) => ({
    Brand: item.name,
    'Visibility %': item.percentage,
  }));
  return toCsvString(rows, filename);
}

function buildTopSourceContentsCsv(
  contents: SourceContent[],
  project: ProjectRow,
  competitors: CompetitorRow[],
  projectId: string,
  startDate: string,
  endDate: string,
  filename: string
): string {
  const origin = window.location.origin;
  const rows = contents.map((content) => {
    const brandNames = content.brandIdsRanking
      .map((id) => resolveBrandName(id, project, competitors))
      .join(', ');
    const mention = content.projectIdRank >= 0 ? `#${content.projectIdRank + 1}` : '';
    const detailsUrl =
      origin +
      RouteHelper.Project.getSourceDetails(
        projectId,
        content.id,
        startDate,
        endDate,
        content.title
      );
    return {
      URL: content.url,
      Title: content.title ?? '',
      Category: content.domainCategory,
      'Used %': content.usedPercentage,
      'Cited %': content.citedPercentage,
      Mention: mention,
      Brands: brandNames,
      'Details URL': detailsUrl,
    };
  });
  return toCsvString(rows, filename);
}

function buildTopSourceDomainsCsv(domains: SourceDomain[], filename: string): string {
  const rows = domains.map((domain) => ({
    Hostname: domain.hostname,
    Category: domain.domainCategory,
    'Used %': domain.usedPercentage,
    'Cited %': domain.citedPercentage,
    URL: `https://${domain.hostname}`,
  }));
  return toCsvString(rows, filename);
}

function buildTopOpportunitiesCsv(
  opportunities: Opportunity[],
  prompts: PromptRow[],
  projectId: string,
  startDate: string,
  endDate: string,
  filename: string
): string {
  const origin = window.location.origin;
  const rows = opportunities.map((opportunity) => ({
    Type: OPPORTUNITY_TYPE_NAME[opportunity.type],
    Description: getOpportunityDescription(opportunity, prompts),
    Priority: getPriorityLabel(opportunity.priorityScore).text,
    Difficulty: DIFFICULTY_MAP[opportunity.type],
    'Details URL':
      origin +
      RouteHelper.Project.getOpportunityDetails(projectId, opportunity.id, startDate, endDate),
  }));
  return toCsvString(rows, filename);
}

function buildBrandSentimentCsv(items: SentimentScoresBarChartItem[], filename: string): string {
  const rows = items.map((item) => ({
    Brand: item.name,
    'Average Sentiment': item.averageSentiment.toFixed(1),
    'Sentiment Label': getSentimentLabel(item.averageSentiment),
  }));
  return toCsvString(rows, filename);
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function exportOverviewZip({
  visibilityItems,
  sentimentItems,
  topSourceContents,
  topSourceDomains,
  topOpportunities,
  project,
  competitors,
  prompts,
  projectId,
  startDate,
  endDate,
}: {
  visibilityItems: VisibilityScoresBarChartItem[];
  sentimentItems: SentimentScoresBarChartItem[];
  topSourceContents: SourceContent[];
  topSourceDomains: SourceDomain[];
  topOpportunities: Opportunity[];
  project: ProjectRow;
  competitors: CompetitorRow[];
  prompts: PromptRow[];
  projectId: string;
  startDate: string;
  endDate: string;
}): void {
  const dateRange = `${startDate}_${endDate}`;

  const files: Record<string, Uint8Array> = {
    [`brand_visibility_${dateRange}.csv`]: strToU8(
      buildBrandVisibilityCsv(visibilityItems, `brand_visibility_${dateRange}`)
    ),
    ...(sentimentItems.length > 0 && {
      [`brand_sentiment_${dateRange}.csv`]: strToU8(
        buildBrandSentimentCsv(sentimentItems, `brand_sentiment_${dateRange}`)
      ),
    }),
    [`top_source_contents_${dateRange}.csv`]: strToU8(
      buildTopSourceContentsCsv(
        topSourceContents,
        project,
        competitors,
        projectId,
        startDate,
        endDate,
        `top_source_contents_${dateRange}`
      )
    ),
    [`top_source_domains_${dateRange}.csv`]: strToU8(
      buildTopSourceDomainsCsv(topSourceDomains, `top_source_domains_${dateRange}`)
    ),
    [`top_opportunities_${dateRange}.csv`]: strToU8(
      buildTopOpportunitiesCsv(
        topOpportunities,
        prompts,
        projectId,
        startDate,
        endDate,
        `top_opportunities_${dateRange}`
      )
    ),
  };

  const zipped = zipSync(files);
  const blob = new Blob([new Uint8Array(zipped)], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `overview_export_${dateRange}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
