import { MAX_ALLOWED_DAYS_IN_DATE_RANGE } from '@/libs/utils/dateRange';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getPromptRowsWithProjectId } from '@/libs/database/Prompts/queries';
import { getPromptResponseSummaryRowsWithProjectIdInDateRange } from '@/libs/database/PromptResponses/queries';
import { getSourceSummaryRowsWithProjectIdInDateRange } from '@/libs/database/Sources/queries';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import { countDaysBetween, ISODateString } from '@/libs/database/shared/ISODateString';
import { getPromptResponsesWorkRows } from '@/libs/utils/project-analysis/helpers';
import { getOpportunitiesSummary } from '@/libs/utils/project-analysis/getOpportunitiesSummary';

export async function getOpportunitiesData(
  projectId: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString,
  chatbotIds?: ChatbotId[]
) {
  if (countDaysBetween(startDateISO, endDateISO) > MAX_ALLOWED_DAYS_IN_DATE_RANGE) {
    throw new Error(`Date range too large (max ${MAX_ALLOWED_DAYS_IN_DATE_RANGE} days)`);
  }

  const [project, promptResponses, prompts, sourceRows] = await Promise.all([
    getProjectRowWithId(projectId),
    getPromptResponseSummaryRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
    getPromptRowsWithProjectId(projectId),
    getSourceSummaryRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
  ]);
  if (!project) throw new Error('Failed to get project');
  if (!prompts.length) return { data: [], totalCount: 0 };

  const activePromptIds = new Set(prompts.map((prompt) => prompt.id));
  let filteredPromptResponses = promptResponses.filter((response) =>
    activePromptIds.has(response.prompt_id)
  );

  // Apply chatbot filter
  if (chatbotIds?.length) {
    const chatbotSet = new Set(chatbotIds);
    filteredPromptResponses = filteredPromptResponses.filter((r) =>
      chatbotSet.has(r.chatbot_id)
    );
  }

  const promptResponsesWorkRows = getPromptResponsesWorkRows(filteredPromptResponses, sourceRows);
  const summary = await getOpportunitiesSummary(project, promptResponsesWorkRows);
  return { data: summary.data, totalCount: summary.totalCount };
}
