import { MAX_ALLOWED_DAYS_IN_DATE_RANGE } from '@/libs/utils/dateRange';
import { getSourceContentSummary } from '@/libs/utils/project-analysis/getSourceContentSummary';
import { getSourceDomainsSummary } from '@/libs/utils/project-analysis/getSourceDomainsSummary';
import { getPromptResponsesWorkRows } from '@/libs/utils/project-analysis/helpers';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getPromptRowsWithProjectId } from '@/libs/database/Prompts/queries';
import { getPromptResponseSummaryRowsWithProjectIdInDateRange } from '@/libs/database/PromptResponses/queries';
import {
  getSourceRowsWithProjectIdInDateRange,
  getSourceSummaryRowsWithProjectIdInDateRange,
} from '@/libs/database/Sources/queries';
import { ChatbotId } from '@/libs/database/shared/ChatbotId';
import { countDaysBetween, ISODateString } from '@/libs/database/shared/ISODateString';
import { PromptResponseSummaryRow } from '@/libs/database/PromptResponses/types';

function applyChatbotFilter(
  responses: PromptResponseSummaryRow[],
  chatbotIds?: ChatbotId[]
): PromptResponseSummaryRow[] {
  if (!chatbotIds?.length) return responses;
  const chatbotSet = new Set(chatbotIds);
  return responses.filter((r) => chatbotSet.has(r.chatbot_id));
}

export async function getSourcesContentData(
  projectId: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString,
  shouldAddDetails?: boolean,
  chatbotIds?: ChatbotId[]
) {
  if (countDaysBetween(startDateISO, endDateISO) > MAX_ALLOWED_DAYS_IN_DATE_RANGE) {
    throw new Error(`Date range too large (max ${MAX_ALLOWED_DAYS_IN_DATE_RANGE} days)`);
  }

  const [project, promptResponses, prompts, sourceRows] = await Promise.all([
    getProjectRowWithId(projectId),
    getPromptResponseSummaryRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
    getPromptRowsWithProjectId(projectId),
    shouldAddDetails
      ? getSourceRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO)
      : getSourceSummaryRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
  ]);
  if (!project) throw new Error('Failed to get project');
  if (!prompts.length) return { data: [], totalCount: 0 };

  const activePromptIds = new Set(prompts.map((prompt) => prompt.id));
  const filteredPromptResponses = promptResponses.filter((response) =>
    activePromptIds.has(response.prompt_id)
  );

  const chatbotFiltered = applyChatbotFilter(filteredPromptResponses, chatbotIds);

  const promptResponsesWorkRows = getPromptResponsesWorkRows(chatbotFiltered, sourceRows);
  const summary = getSourceContentSummary(project, promptResponsesWorkRows, undefined, shouldAddDetails);
  return { data: summary.data, totalCount: summary.totalCount };
}

export async function getSourcesDomainsData(
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
  const filteredPromptResponses = promptResponses.filter((response) =>
    activePromptIds.has(response.prompt_id)
  );

  const chatbotFiltered = applyChatbotFilter(filteredPromptResponses, chatbotIds);

  const promptResponsesWorkRows = getPromptResponsesWorkRows(chatbotFiltered, sourceRows);
  const summary = await getSourceDomainsSummary(project, promptResponsesWorkRows);
  return { data: summary.data, totalCount: summary.totalCount };
}
