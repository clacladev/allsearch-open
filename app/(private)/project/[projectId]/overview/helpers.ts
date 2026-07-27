import { MAX_ALLOWED_DAYS_IN_DATE_RANGE } from '@/libs/utils/dateRange';
import { getActiveCompetitorRowsWithProjectId } from '@/libs/database/Competitors/queries';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getPromptRowsWithProjectId } from '@/libs/database/Prompts/queries';
import { getPromptResponseSummaryRowsWithProjectIdInDateRange } from '@/libs/database/PromptResponses/queries';
import { getSourceSummaryRowsWithProjectIdInDateRange } from '@/libs/database/Sources/queries';
import { countDaysBetween, ISODateString } from '@/libs/database/shared/ISODateString';
import { getOverviewData } from '@/libs/utils/project-analysis/getOverviewData';

export async function getOverviewPageData(
  projectId: string,
  startDateISO: ISODateString,
  endDateISO: ISODateString
) {
  if (countDaysBetween(startDateISO, endDateISO) > MAX_ALLOWED_DAYS_IN_DATE_RANGE) {
    throw new Error(`Date range too large (max ${MAX_ALLOWED_DAYS_IN_DATE_RANGE} days)`);
  }

  const [project, competitors, promptResponses, prompts, sourceRows] = await Promise.all([
    getProjectRowWithId(projectId),
    getActiveCompetitorRowsWithProjectId(projectId),
    getPromptResponseSummaryRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
    getPromptRowsWithProjectId(projectId),
    getSourceSummaryRowsWithProjectIdInDateRange(projectId, startDateISO, endDateISO),
  ]);
  if (!project) throw new Error('Failed to get project');

  const activePromptIds = new Set(prompts.map((prompt) => prompt.id));
  const filteredPromptResponses = promptResponses.filter((response) =>
    activePromptIds.has(response.prompt_id)
  );

  return getOverviewData(startDateISO, endDateISO, project, competitors, filteredPromptResponses, sourceRows);
}
