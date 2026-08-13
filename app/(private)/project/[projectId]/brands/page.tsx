import Header from '@/app/(private)/components/Header';
import { MainContainer } from '@/app/(private)/components/Containers';
import { Building2 } from 'lucide-react';
import { Metadata } from 'next';
import Brands from './components/Brands';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { getPaginatedResult, SortParams } from '@/libs/utils/PaginatedResult';
import z from 'zod';
import { getAvailableBrandsData, getBrandsSourcesData } from './helpers';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getActiveCompetitorRowsWithProjectId } from '@/libs/database/Competitors/queries';
import { getSourcesContentData } from '../sources/helpers';
import { getEffectiveEnabledChatbotIds } from '@/libs/database/Settings/queries';
import { ChatbotId, SUPPORTED_CHATBOTS_IDS } from '@/libs/database/shared/ChatbotId';
import {
  parseTextFilter,
  parseMultiSelectFilter,
  parseNumberRangeFilter,
  applyTextFilter,
  applyMultiSelectFilter,
  applyNumberRangeFilter,
} from '@/app/(private)/components/ColumnFilters';

const BRANDS_SORT_FIELDS = [
  'title',
  'domainCategory',
  'usedPercentage',
  'citedPercentage',
] as const;

type BrandsSortField = (typeof BRANDS_SORT_FIELDS)[number];

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { startDate, endDate, pageNo } = await searchParams;
  const dateString = startDate && endDate ? `| From ${startDate} to ${endDate}` : '';
  const pageString = pageNo ? `| Page ${pageNo}` : '';
  return {
    title: `Brands ${dateString} ${pageString}`,
  };
}

export default async function ProjectBrandsPage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const rawParams = await searchParams;

  const { startDate, endDate, pageNo, sortBy, sortDir, brandIds } = z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      pageNo: z.coerce.number().min(0).optional().default(0),
      sortBy: z.string().optional(),
      sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
      brandIds: z.string().optional(),
    })
    .parse(rawParams);

  const defaultDateRange = getDefaultAnalysisDateRange();
  const startDateISO = startDate ? getISODateString(startDate) : defaultDateRange.startDateISO;
  const endDateISO = endDate ? getISODateString(endDate) : defaultDateRange.endDateISO;

  const selectedBrandIds = brandIds ? brandIds.split(',').filter(Boolean) : [];

  // Parse chatbot filter
  const chatbotFilter = parseMultiSelectFilter(rawParams, 'chatbot');
  const validChatbotIds = chatbotFilter.filter((id): id is ChatbotId =>
    SUPPORTED_CHATBOTS_IDS.includes(id as ChatbotId)
  );

  const [project, competitors, sourceContentSummary, enabledChatbotIds] = await Promise.all([
    getProjectRowWithId(projectId),
    getActiveCompetitorRowsWithProjectId(projectId),
    getSourcesContentData(projectId, startDateISO, endDateISO, undefined, validChatbotIds.length ? validChatbotIds : undefined),
    getEffectiveEnabledChatbotIds(),
  ]);

  if (!project) return null;
  const availableBrands = getAvailableBrandsData(project, competitors);

  const sourcesResult = getBrandsSourcesData(
    project,
    competitors,
    sourceContentSummary.data,
    selectedBrandIds
  );

  const availableBrandsWithCounts = availableBrands.map((brand) => ({
    ...brand,
    sourcesCount: sourcesResult.brandSourceCounts[brand.id] ?? 0,
  }));

  // Compute category counts from full dataset before filtering
  const categoryCounts: Record<string, number> = {};
  for (const item of sourcesResult.sources) {
    categoryCounts[item.domainCategory] = (categoryCounts[item.domainCategory] ?? 0) + 1;
  }

  // Parse filter params
  const titleFilter = parseTextFilter(rawParams, 'title');
  const domainCategoryFilter = parseMultiSelectFilter(rawParams, 'domainCategory');
  const usedPercentageFilter = parseNumberRangeFilter(rawParams, 'usedPercentage');
  const citedPercentageFilter = parseNumberRangeFilter(rawParams, 'citedPercentage');

  // Apply filters
  let filteredSources = sourcesResult.sources;
  filteredSources = applyTextFilter(filteredSources, 'title', titleFilter);
  filteredSources = applyMultiSelectFilter(filteredSources, 'domainCategory', domainCategoryFilter);
  filteredSources = applyNumberRangeFilter(filteredSources, 'usedPercentage', usedPercentageFilter.min, usedPercentageFilter.max);
  filteredSources = applyNumberRangeFilter(filteredSources, 'citedPercentage', citedPercentageFilter.min, citedPercentageFilter.max);

  const sortParams =
    sortBy && BRANDS_SORT_FIELDS.includes(sortBy as BrandsSortField)
      ? ({ sortBy: sortBy as keyof SourceContent, sortDir } as SortParams<SourceContent>)
      : undefined;

  const sourcesData = getPaginatedResult(
    { data: filteredSources, totalCount: filteredSources.length },
    pageNo,
    undefined,
    sortParams
  );

  return (
    <MainContainer>
      <Header
        text="Brands"
        icon={Building2}
        description="See which sources your brand and competitors have created that are being cited by AI models."
      />
      <Brands
        projectId={projectId}
        startDate={startDateISO}
        endDate={endDateISO}
        sourcesData={sourcesData}
        selectedBrandIds={selectedBrandIds}
        availableBrands={availableBrandsWithCounts}
        sortBy={sortBy}
        sortDir={sortDir}
        categoryCounts={categoryCounts}
        enabledChatbotIds={enabledChatbotIds}
        filters={{
          filter_title: titleFilter,
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
