import Header from '@/app/(private)/components/Header';
import { MainContainer } from '@/app/(private)/components/Containers';
import { Globe } from 'lucide-react';
import { Metadata } from 'next';
import Sources from '../components/Sources';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { getPaginatedResult, SortParams } from '@/libs/utils/PaginatedResult';
import z from 'zod';
import { getSourcesDomainsData } from '../helpers';
import { getEffectiveEnabledChatbotIds } from '@/libs/database/Settings/queries';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';
import { SourceDomain } from '@/libs/utils/project-analysis/getSourceDomainsSummary';
import { ChatbotId, SUPPORTED_CHATBOTS_IDS } from '@/libs/database/shared/ChatbotId';
import {
  parseTextFilter,
  parseMultiSelectFilter,
  parseNumberRangeFilter,
  applyTextFilter,
  applyMultiSelectFilter,
  applyNumberRangeFilter,
} from '@/app/(private)/components/ColumnFilters';

const SOURCE_DOMAINS_SORT_FIELDS = [
  'hostname',
  'domainCategory',
  'usedPercentage',
  'citedPercentage',
] as const;

export type SourceDomainsSortField = (typeof SOURCE_DOMAINS_SORT_FIELDS)[number];

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { startDate, endDate, pageNo } = await searchParams;
  const dateString = startDate && endDate ? `| From ${startDate} to ${endDate}` : '';
  const pageString = pageNo ? `| Page ${pageNo}` : '';
  return {
    title: `Sources Domains ${dateString} ${pageString}`,
  };
}

export default async function ProjectSourcesDomainsPage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const rawParams = await searchParams;

  const { startDate, endDate, pageNo, sortBy, sortDir } = z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      pageNo: z.coerce.number().min(0).optional().default(0),
      sortBy: z.string().optional(),
      sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
    })
    .parse(rawParams);

  const defaultDateRange = getDefaultAnalysisDateRange();
  const startDateISO = startDate ? getISODateString(startDate) : defaultDateRange.startDateISO;
  const endDateISO = endDate ? getISODateString(endDate) : defaultDateRange.endDateISO;

  // Parse chatbot filter
  const chatbotFilter = parseMultiSelectFilter(rawParams, 'chatbot');
  const validChatbotIds = chatbotFilter.filter((id): id is ChatbotId =>
    SUPPORTED_CHATBOTS_IDS.includes(id as ChatbotId)
  );

  const [sourceDomainsSummary, enabledChatbotIds] = await Promise.all([
    getSourcesDomainsData(projectId, startDateISO, endDateISO, validChatbotIds.length ? validChatbotIds : undefined),
    getEffectiveEnabledChatbotIds(),
  ]);

  // Compute category counts from full dataset before filtering
  const categoryCounts: Record<string, number> = {};
  for (const item of sourceDomainsSummary.data) {
    categoryCounts[item.domainCategory] = (categoryCounts[item.domainCategory] ?? 0) + 1;
  }

  // Parse filter params
  const hostnameFilter = parseTextFilter(rawParams, 'hostname');
  const domainCategoryFilter = parseMultiSelectFilter(rawParams, 'domainCategory');
  const usedPercentageFilter = parseNumberRangeFilter(rawParams, 'usedPercentage');
  const citedPercentageFilter = parseNumberRangeFilter(rawParams, 'citedPercentage');

  // Apply filters
  let filteredData = sourceDomainsSummary.data;
  filteredData = applyTextFilter(filteredData, 'hostname', hostnameFilter);
  filteredData = applyMultiSelectFilter(filteredData, 'domainCategory', domainCategoryFilter);
  filteredData = applyNumberRangeFilter(filteredData, 'usedPercentage', usedPercentageFilter.min, usedPercentageFilter.max);
  filteredData = applyNumberRangeFilter(filteredData, 'citedPercentage', citedPercentageFilter.min, citedPercentageFilter.max);

  const domainsSortParams =
    sortBy && SOURCE_DOMAINS_SORT_FIELDS.includes(sortBy as SourceDomainsSortField)
      ? ({ sortBy: sortBy as keyof SourceDomain, sortDir } as SortParams<SourceDomain>)
      : undefined;

  const sourceDomainsData = getPaginatedResult(
    { data: filteredData, totalCount: filteredData.length },
    pageNo,
    undefined,
    domainsSortParams
  );

  return (
    <MainContainer>
      <Header
        text="Sources Domains"
        icon={Globe}
        description="Websites and domains that AI models most frequently cite in responses to your tracked prompts."
      />
      <Sources
        projectId={projectId}
        sourceType="domains"
        startDate={startDateISO}
        endDate={endDateISO}
        sourceDomainsData={sourceDomainsData}
        sortBy={sortBy}
        sortDir={sortDir}
        categoryCounts={categoryCounts}
        enabledChatbotIds={enabledChatbotIds}
        filters={{
          filter_hostname: hostnameFilter,
          filter_domainCategory: domainCategoryFilter.length ? domainCategoryFilter.join(',') : undefined,
          filter_usedPercentage: usedPercentageFilter.min !== undefined || usedPercentageFilter.max !== undefined
            ? `${usedPercentageFilter.min ?? ''},${usedPercentageFilter.max ?? ''}`
            : undefined,
          filter_citedPercentage: citedPercentageFilter.min !== undefined || citedPercentageFilter.max !== undefined
            ? `${citedPercentageFilter.min ?? ''},${citedPercentageFilter.max ?? ''}`
            : undefined,
          filter_chatbot: validChatbotIds.length ? validChatbotIds.join(',') : undefined,
        }}
      />
    </MainContainer>
  );
}
