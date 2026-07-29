import {
  getPromptsAnalysis,
  PromptAnalysis,
} from '@/app/api/project/[projectId]/prompts/getPromptsAnalysis';
import { getActiveCompetitorRowsWithProjectId } from '@/libs/database/Competitors/queries';
import {
  getPromptAndTopicJoinWithProjectId,
  getPromptRowsWithProjectId,
} from '@/libs/database/Prompts/queries';
import { getPromptResponseSummaryRowsWithProjectIdInDateRange } from '@/libs/database/PromptResponses/queries';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import { countDaysBetween, ISODateString } from '@/libs/database/shared/ISODateString';
import { MAX_ALLOWED_DAYS_IN_DATE_RANGE } from '@/libs/utils/dateRange';
import { PromptAndTopicJoinRow } from '@/libs/database/Prompts/types';

export async function getPromptsData(
  projectId: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString,
  includeArchived = false,
  chatbotIds?: ChatbotId[]
): Promise<{
  prompts: PromptAndTopicJoinRow[];
  analysis: Record<string, PromptAnalysis>;
  archivedPromptsCount: number;
}> {
  if (countDaysBetween(startDateISO, endDateISO) > MAX_ALLOWED_DAYS_IN_DATE_RANGE) {
    throw new Error(`Date range too large (max ${MAX_ALLOWED_DAYS_IN_DATE_RANGE} days)`);
  }

  const [prompts, allPrompts] = await Promise.all([
    getPromptAndTopicJoinWithProjectId(projectId, includeArchived),
    getPromptRowsWithProjectId(projectId, true),
  ]);
  const archivedPromptsCount = allPrompts.filter((prompt) => prompt.is_archived).length;
  if (!prompts.length) return { prompts, analysis: {}, archivedPromptsCount };

  const [promptResponses, competitors] = await Promise.all([
    getPromptResponseSummaryRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
    getActiveCompetitorRowsWithProjectId(projectId),
  ]);

  const promptIds = prompts.map((prompt) => prompt.id);
  const promptIdsSet = new Set(promptIds);
  let filteredPromptResponses = promptResponses.filter((response) =>
    promptIdsSet.has(response.prompt_id)
  );

  // Apply chatbot filter
  if (chatbotIds?.length) {
    const chatbotSet = new Set(chatbotIds);
    filteredPromptResponses = filteredPromptResponses.filter((r) =>
      chatbotSet.has(r.chatbot_id)
    );
  }

  const analysis = getPromptsAnalysis(promptIds, filteredPromptResponses, projectId, competitors);

  return { prompts, analysis, archivedPromptsCount };
}
