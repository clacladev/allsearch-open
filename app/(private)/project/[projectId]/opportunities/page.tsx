import Header from '@/app/(private)/components/Header';
import { MainContainer } from '@/app/(private)/components/Containers';
import { ActivityHeart } from '@untitledui/icons';
import { Metadata } from 'next';
import { Opportunities } from './components/Opportunities';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { getPaginatedResult, SortParams } from '@/libs/utils/PaginatedResult';
import { DIFFICULTY_ORDER, Opportunity } from '@/libs/utils/project-analysis/types';
import z from 'zod';
import { getOpportunitiesData } from './helpers';
import { getEffectiveEnabledChatbotIds } from '@/libs/database/Settings/queries';
import { ChatbotId, SUPPORTED_CHATBOTS_IDS } from '@/libs/database/shared/ChatbotId';
import {
  parseMultiSelectFilter,
} from '@/app/(private)/components/ColumnFilters';
import { DIFFICULTY_MAP, getPriorityLabel } from './components/Badges';
import { OPPORTUNITY_TYPE_NAME, OPPORTUNITY_TYPE_TITLE } from '@/libs/utils/opportunities';
import type { OpportunityType } from '@/libs/utils/project-analysis/types';

const OPPORTUNITIES_SORT_FIELDS = ['type', 'priorityScore', 'difficulty'] as const;
export type OpportunitiesSortField = (typeof OPPORTUNITIES_SORT_FIELDS)[number];

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { startDate, endDate, pageNo } = await searchParams;

  const dateString = startDate && endDate ? `| From ${startDate} to ${endDate}` : '';
  const pageString = pageNo ? `| Page ${pageNo}` : '';

  return {
    title: `Opportunities ${dateString} ${pageString}`,
  };
}

export default async function ProjectOpportunitiesPage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const rawParams = await searchParams;

  const { startDate, endDate, pageNo, sortBy, sortDir } = z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      pageNo: z.coerce.number().min(0).optional().default(0),
      sortBy: z.enum(OPPORTUNITIES_SORT_FIELDS).optional(),
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

  const [opportunitiesSummary, enabledChatbotIds] = await Promise.all([
    getOpportunitiesData(projectId, startDateISO, endDateISO, validChatbotIds.length ? validChatbotIds : undefined),
    getEffectiveEnabledChatbotIds(),
  ]);

  // Compute type counts from full dataset
  const typeCounts: Record<string, number> = {};
  for (const o of opportunitiesSummary.data) {
    const typeLabel = OPPORTUNITY_TYPE_NAME[o.type] + ' \u00B7 ' + OPPORTUNITY_TYPE_TITLE[o.type];
    typeCounts[typeLabel] = (typeCounts[typeLabel] ?? 0) + 1;
  }

  // Compute priority counts from full dataset
  const priorityCounts: Record<string, number> = { High: 0, Medium: 0, Low: 0 };
  for (const o of opportunitiesSummary.data) {
    const label = getPriorityLabel(o.priorityScore).text;
    priorityCounts[label] = (priorityCounts[label] ?? 0) + 1;
  }

  // Compute difficulty counts from full dataset
  const difficultyCounts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 };
  for (const o of opportunitiesSummary.data) {
    const label = DIFFICULTY_MAP[o.type];
    difficultyCounts[label] = (difficultyCounts[label] ?? 0) + 1;
  }

  // Parse filter params
  const typeFilter = parseMultiSelectFilter(rawParams, 'type');
  const difficultyFilter = parseMultiSelectFilter(rawParams, 'difficulty');
  const priorityFilter = parseMultiSelectFilter(rawParams, 'priority');

  // Apply filters
  let filteredData = opportunitiesSummary.data;

  // Type filter: compare "name · title" format against selected values
  if (typeFilter.length > 0) {
    filteredData = filteredData.filter((o) => {
      const typeLabel = OPPORTUNITY_TYPE_NAME[o.type] + ' \u00B7 ' + OPPORTUNITY_TYPE_TITLE[o.type];
      return typeFilter.includes(typeLabel);
    });
  }

  // Difficulty filter: compare DIFFICULTY_MAP[opportunity.type] against selected values
  if (difficultyFilter.length > 0) {
    filteredData = filteredData.filter((o) => difficultyFilter.includes(DIFFICULTY_MAP[o.type]));
  }

  // Priority filter: compare getPriorityLabel against selected values
  if (priorityFilter.length > 0) {
    filteredData = filteredData.filter((o) =>
      priorityFilter.includes(getPriorityLabel(o.priorityScore).text)
    );
  }

  const sortedData =
    sortBy === 'difficulty'
      ? [...filteredData].sort((a, b) => {
          const diff = DIFFICULTY_ORDER[a.type] - DIFFICULTY_ORDER[b.type];
          return sortDir === 'asc' ? diff : -diff;
        })
      : filteredData;

  const sortParams =
    sortBy && sortBy !== 'difficulty'
      ? ({ sortBy, sortDir } as SortParams<Opportunity>)
      : undefined;

  const opportunitiesData = getPaginatedResult<Opportunity>(
    { data: sortedData, totalCount: sortedData.length },
    pageNo,
    undefined,
    sortParams
  );

  // Build type options with "name · title" format
  const typeOptions = (
    Object.entries(OPPORTUNITY_TYPE_TITLE) as [OpportunityType, string][]
  ).map(([type, title]) => {
    const label = OPPORTUNITY_TYPE_NAME[type] + ' \u00B7 ' + title;
    return { id: label, label, count: typeCounts[label] ?? 0 };
  });

  return (
    <MainContainer>
      <Header
        text="Opportunities"
        icon={ActivityHeart}
        description="Actionable steps to improve your brand's presence in AI-generated answers, ranked by impact."
      />
      <Opportunities
        projectId={projectId}
        startDate={startDateISO}
        endDate={endDateISO}
        opportunitiesData={opportunitiesData}
        sortBy={sortBy}
        sortDir={sortDir}
        typeOptions={typeOptions}
        priorityCounts={priorityCounts}
        difficultyCounts={difficultyCounts}
        enabledChatbotIds={enabledChatbotIds}
        filters={{
          filter_type: typeFilter.length ? typeFilter.join(',') : undefined,
          filter_difficulty: difficultyFilter.length ? difficultyFilter.join(',') : undefined,
          filter_priority: priorityFilter.length ? priorityFilter.join(',') : undefined,
          filter_chatbot: validChatbotIds.length ? validChatbotIds.join(',') : undefined,
        }}
      />
    </MainContainer>
  );
}
