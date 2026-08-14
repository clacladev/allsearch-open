import Header from '@/app/(private)/components/Header';
import { MainContainer } from '@/app/(private)/components/Containers';
import { Globe } from 'lucide-react';
import { Metadata } from 'next';
import Sources from '../components/Sources';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { getPaginatedResult, SortParams } from '@/libs/utils/PaginatedResult';
import z from 'zod';
import { getSourcesContentData } from '../helpers';
import { getEffectiveEnabledChatbotIds } from '@/libs/database/Settings/queries';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';
import { SourceContent } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { ChatbotId, SUPPORTED_CHATBOTS_IDS } from '@/libs/database/shared/ChatbotId';
import {
  parseTextFilter,
  parseMultiSelectFilter,
  parseNumberRangeFilter,
  applyTextFilter,
  applyMultiSelectFilter,
  applyNumberRangeFilter,
} from '@/app/(private)/components/ColumnFilters';

const SOURCE_CONTENTS_SORT_FIELDS = [
  'title',
  'domainCategory',
  'usedPercentage',
  'citedPercentage',
  'projectIdRank',
] as const;

export type SourceContentsSortField = (typeof SOURCE_CONTENTS_SORT_FIELDS)[number];

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { startDate, endDate, pageNo } = await searchParams;
  const dateString = startDate && endDate ? `| From ${startDate} to ${endDate}` : '';
  const pageString = pageNo ? `| Page ${pageNo}` : '';
  return {
    title: `Sources Contents ${dateString} ${pageString}`,
  };
}

export default async function ProjectSourcesContentsPage({ params, searchParams }: Props) {
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

  const [sourceContentsSummary, enabledChatbotIds] = await Promise.all([
    getSourcesContentData(projectId, startDateISO, endDateISO, undefined, validChatbotIds.length ? validChatbotIds : undefined),
    getEffectiveEnabledChatbotIds(),
  ]);

  // Compute category counts from full dataset before filtering
  const categoryCounts: Record<string, number> = {};
  for (const item of sourceContentsSummary.data) {
    categoryCounts[item.domainCategory] = (categoryCounts[item.domainCategory] ?? 0) + 1;
  }

  // Compute mentioned counts from full dataset
  const mentionedCounts = {
    mentioned: sourceContentsSummary.data.filter((item) => item.projectIdRank !== -1).length,
    notMentioned: sourceContentsSummary.data.filter((item) => item.projectIdRank === -1).length,
  };

  // Parse filter params
  const titleFilter = parseTextFilter(rawParams, 'title');
  const domainCategoryFilter = parseMultiSelectFilter(rawParams, 'domainCategory');
  const usedPercentageFilter = parseNumberRangeFilter(rawParams, 'usedPercentage');
  const citedPercentageFilter = parseNumberRangeFilter(rawParams, 'citedPercentage');
  const mentionedFilter = parseMultiSelectFilter(rawParams, 'mentioned');

  // Apply filters
  let filteredData = sourceContentsSummary.data;
  filteredData = applyTextFilter(filteredData, 'title', titleFilter);
  filteredData = applyMultiSelectFilter(filteredData, 'domainCategory', domainCategoryFilter);
  filteredData = applyNumberRangeFilter(filteredData, 'usedPercentage', usedPercentageFilter.min, usedPercentageFilter.max);
  filteredData = applyNumberRangeFilter(filteredData, 'citedPercentage', citedPercentageFilter.min, citedPercentageFilter.max);

  // Apply mentioned filter
  if (mentionedFilter.length > 0) {
    const wantMentioned = mentionedFilter.includes('Mentioned');
    const wantNotMentioned = mentionedFilter.includes('Not mentioned');
    if (wantMentioned && !wantNotMentioned) {
      filteredData = filteredData.filter((item) => item.projectIdRank !== -1);
    } else if (!wantMentioned && wantNotMentioned) {
      filteredData = filteredData.filter((item) => item.projectIdRank === -1);
    }
  }

  const contentsSortParams =
    sortBy && SOURCE_CONTENTS_SORT_FIELDS.includes(sortBy as SourceContentsSortField)
      ? ({ sortBy: sortBy as keyof SourceContent, sortDir } as SortParams<SourceContent>)
      : undefined;

  const sourceContentsData = getPaginatedResult(
    { data: filteredData, totalCount: filteredData.length },
    pageNo,
    undefined,
    contentsSortParams
  );

  return (
    <MainContainer>
      <Header
        text="Sources Contents"
        icon={Globe}
        description="Individual pages and articles that AI models cite when responding to your tracked prompts."
      />
      <Sources
        projectId={projectId}
        sourceType="contents"
        startDate={startDateISO}
        endDate={endDateISO}
        sourceContentsData={sourceContentsData}
        sortBy={sortBy}
        sortDir={sortDir}
        categoryCounts={categoryCounts}
        mentionedCounts={mentionedCounts}
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
          filter_mentioned: mentionedFilter.length ? mentionedFilter.join(',') : undefined,
          filter_chatbot: validChatbotIds.length ? validChatbotIds.join(',') : undefined,
        }}
      />
    </MainContainer>
  );
}
