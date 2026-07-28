import { getSourceContentSummary } from '@/libs/utils/project-analysis/getSourceContentSummary';
import {
  getPromptResponsesWorkRows,
  sourceRowsToSourceItems,
} from '@/libs/utils/project-analysis/helpers';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getPromptResponseRowsWithPromptIdInDateRange } from '@/libs/database/PromptResponses/queries';
import { getSourceRowsWithPromptResponseIds } from '@/libs/database/Sources/queries';
import { SourceRow } from '@/libs/database/Sources/types';
import { PromptResponseRow } from '@/libs/database/PromptResponses/types';
import { countDaysBetween, ISODateString } from '@/libs/database/shared/ISODateString';
import { MAX_ALLOWED_DAYS_IN_DATE_RANGE } from '@/libs/utils/dateRange';
import { PromptResponseContent } from './types';

export async function getPromptResponsesData(
  projectId: string,
  promptId: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString
) {
  if (countDaysBetween(startDateISO, endDateISO) > MAX_ALLOWED_DAYS_IN_DATE_RANGE) {
    throw new Error(`Date range too large (max ${MAX_ALLOWED_DAYS_IN_DATE_RANGE} days)`);
  }

  const [project, promptResponses] = await Promise.all([
    getProjectRowWithId(projectId),
    getPromptResponseRowsWithPromptIdInDateRange(promptId, startDateISO, endDateISO),
  ]);
  if (!project) throw new Error('Failed to get project');

  const responseIds = promptResponses.map((r) => r.id);
  const sourceRows = await getSourceRowsWithPromptResponseIds(responseIds);

  const promptResponsesWorkRows = getPromptResponsesWorkRows(promptResponses, sourceRows);
  return {
    sourceContentsSummary: getSourceContentSummary(project, promptResponsesWorkRows),
    promptResponsesContents: getPromptResponsesContent(projectId, promptResponses, sourceRows),
  };
}

function getPromptResponsesContent(
  projectId: string,
  promptResponsesRows: PromptResponseRow[],
  sourceRows: SourceRow[]
): PromptResponseContent[] {
  // Group source rows by prompt_response_id
  const sourcesByResponseId = new Map<string, SourceRow[]>();
  sourceRows.forEach((row) => {
    let group = sourcesByResponseId.get(row.prompt_response_id);
    if (!group) {
      group = [];
      sourcesByResponseId.set(row.prompt_response_id, group);
    }
    group.push(row);
  });

  return promptResponsesRows.map((response) => ({
    id: response.id,
    text: response.text,
    chatbotId: response.chatbot_id,
    projectIdRank: response.brand_ids_ranking.indexOf(projectId),
    brandIdsRanking: response.brand_ids_ranking,
    sources: sourceRowsToSourceItems(sourcesByResponseId.get(response.id) ?? []),
    sentiment: response.sentiment ?? undefined,
    createdAt: response.created_at,
  }));
}
