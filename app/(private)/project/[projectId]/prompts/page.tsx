import Header from '@/app/(private)/components/Header';
import { MainContainer } from '@/app/(private)/components/Containers';
import { MessageCircle01 } from '@untitledui/icons';
import { Metadata } from 'next';
import z from 'zod';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import PromptsTable from './components/PromptsTable';
import { getPromptsData } from './helpers';
import { PromptAndTopicJoinRow } from '@/libs/database/Prompts/types';
import { getTopicRowsWithProjectId } from '@/libs/database/Topics/queries';
import { ChatbotId, SUPPORTED_CHATBOTS_IDS } from '@/libs/database/shared/ChatbotId';
import { SortDirection } from '@/libs/utils/PaginatedResult';
import {
  parseTextFilter,
  parseMultiSelectFilter,
  applyTextFilter,
  applyMultiSelectFilter,
} from '@/app/(private)/components/ColumnFilters';

const PROMPTS_SORT_FIELDS = ['name', 'topic_name', 'created_at'] as const;
export type PromptsSortField = (typeof PROMPTS_SORT_FIELDS)[number];

type Props = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { startDate, endDate } = await searchParams;
  const dateString = startDate && endDate ? `| From ${startDate} to ${endDate}` : '';
  return {
    title: `Prompts ${dateString}`,
  };
}

export default async function ProjectPromptsPage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const rawParams = await searchParams;

  const {
    startDate,
    endDate,
    showArchived: shouldShowArchived,
    sortBy,
    sortDir,
  } = z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      showArchived: z
        .enum(['true', 'false'])
        .optional()
        .transform((value) => value === 'true'),
      sortBy: z.enum(PROMPTS_SORT_FIELDS).optional(),
      sortDir: z.enum(['asc', 'desc']).optional().default('asc'),
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

  const [{ prompts, analysis, archivedPromptsCount }, topics] = await Promise.all([
    getPromptsData(projectId, startDateISO, endDateISO, shouldShowArchived, validChatbotIds.length ? validChatbotIds : undefined),
    getTopicRowsWithProjectId(projectId, { includeArchived: true }),
  ]);

  // Compute topic counts from full dataset before filtering
  const topicCounts: Record<string, number> = {};
  for (const p of prompts) {
    if (p.topic_name) {
      topicCounts[p.topic_name] = (topicCounts[p.topic_name] ?? 0) + 1;
    }
  }

  // Parse filter params
  const nameFilter = parseTextFilter(rawParams, 'name');
  const topicFilter = parseMultiSelectFilter(rawParams, 'topic_name');

  // Apply filters then sort
  let filteredPrompts = prompts;
  filteredPrompts = applyTextFilter(filteredPrompts, 'name', nameFilter);
  filteredPrompts = applyMultiSelectFilter(filteredPrompts, 'topic_name', topicFilter);

  const sortedPrompts = sortBy
    ? [...filteredPrompts].sort((a, b) => {
        const aVal = a[sortBy as keyof PromptAndTopicJoinRow];
        const bVal = b[sortBy as keyof PromptAndTopicJoinRow];
        if (aVal === bVal) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const result = aVal < bVal ? -1 : 1;
        return (sortDir as SortDirection) === 'asc' ? result : -result;
      })
    : filteredPrompts;

  return (
    <MainContainer>
      <Header
        text="Prompts"
        icon={MessageCircle01}
        description="The questions you're monitoring to track how often and where your brand appears in AI responses."
      />
      <PromptsTable
        projectId={projectId}
        startDate={startDateISO}
        endDate={endDateISO}
        promptsData={sortedPrompts}
        analysisData={analysis}
        shouldShowArchived={shouldShowArchived}
        archivedPromptsCount={archivedPromptsCount}
        sortBy={sortBy}
        sortDir={sortDir as SortDirection}
        topics={topics}
        topicCounts={topicCounts}
        filters={{
          filter_name: nameFilter,
          filter_topic_name: topicFilter.length ? topicFilter.join(',') : undefined,
          filter_chatbot: validChatbotIds.length ? validChatbotIds.join(',') : undefined,
        }}
      />
    </MainContainer>
  );
}
