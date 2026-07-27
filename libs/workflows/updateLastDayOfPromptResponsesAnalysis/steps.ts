import { getISODateString, getTodayISODateString } from '@/libs/database/shared/ISODateString';
import { getProjectRowWithId } from '@/libs/database/Projects/queries';
import { getActiveCompetitorRowsWithProjectId } from '@/libs/database/Competitors/queries';
import {
  getPromptResponseRowsWithProjectIdInDateRange,
  updatePromptResponseRowWithId,
} from '@/libs/database/PromptResponses/queries';
import { PromptResponseRow } from '@/libs/database/PromptResponses/types';
import {
  deleteSourceRowsWithPromptResponseIds,
  getSourceRowsWithPromptResponseIds,
  insertSourceRows,
} from '@/libs/database/Sources/queries';
import { SourceItem, sourceRowToSourceItem } from '@/libs/database/Sources/types';
import { getBrandIdsRankingsInText } from '@/libs/utils/brandIdsRanking';
import { analysePromptResponseSources } from '@/libs/utils/sourcesAnalysis';
import { ProjectRow } from '@/libs/database/Projects/types';
import { CompetitorRow } from '@/libs/database/Competitors/types';

type AnalysisWorkRow = {
  id: string;
  brand_ids_ranking: string[];
  sources: SourceItem[];
};

export async function fetchEntitiesForProcessing(projectId: string, userId: string) {
  'use step';

  const endDate = getTodayISODateString();
  const startDate = getISODateString(endDate, -1);

  const [projectRow, competitorRows, allPromptResponseRows] = await Promise.all([
    getProjectRowWithId(projectId, userId, { asAdmin: true }),
    getActiveCompetitorRowsWithProjectId(projectId, { asAdmin: true }),
    getPromptResponseRowsWithProjectIdInDateRange(projectId, startDate, endDate, { asAdmin: true }),
  ]);
  if (!projectRow || !competitorRows || !allPromptResponseRows) {
    throw new Error('Failed to fetch entities for processing');
  }

  // Get prompt responses for the last day available
  let promptResponseRows = allPromptResponseRows.filter((row) =>
    row.created_at.startsWith(endDate)
  );
  if (!promptResponseRows.length) {
    promptResponseRows = allPromptResponseRows.filter((row) =>
      row.created_at.startsWith(startDate)
    );
  }
  if (!promptResponseRows.length) {
    throw new Error('No prompt responses found for the given date range');
  }

  return { projectRow, competitorRows, promptResponseRows };
}

export async function processEntitiesAndSaveAnalysis(
  projectRow: ProjectRow,
  competitorRows: CompetitorRow[],
  promptResponseRows: PromptResponseRow[]
) {
  'use step';

  const workRows = await processEntities(projectRow, competitorRows, promptResponseRows);

  await Promise.allSettled(
    workRows.map((row) =>
      updatePromptResponseRowWithId(
        row.id,
        { brand_ids_ranking: row.brand_ids_ranking },
        { asAdmin: true }
      )
    )
  );

  // Replace sources in the normalized sources table.
  // Only update rows for responses where analysis produced non-empty sources,
  // so we don't erase existing source data when analysis fails.
  const workRowsWithSources = workRows.filter((row) => row.sources.length > 0);
  const responseIdsWithSources = workRowsWithSources.map((row) => row.id);

  if (responseIdsWithSources.length) {
    await deleteSourceRowsWithPromptResponseIds(responseIdsWithSources, { asAdmin: true });

    const sourceRowInputs = workRowsWithSources.flatMap((row) => {
      const originalRow = promptResponseRows.find((pr) => pr.id === row.id);
      return row.sources.map((source, position) => ({
        project_id: originalRow!.project_id,
        prompt_id: originalRow!.prompt_id,
        prompt_response_id: row.id,
        is_cited: source.isCited,
        position,
        clean_url: source.cleanUrl,
        url: source.url,
        hostname: source.hostname,
        raw_url: source.rawUrl,
        title: source.title,
        description: source.description,
        headings: source.headings,
        brand_ids_ranking: source.brandIdsRanking ?? [],
      }));
    });
    await insertSourceRows(sourceRowInputs, { asAdmin: true });
  }
}

async function processEntities(
  projectRow: ProjectRow,
  competitorRows: CompetitorRow[],
  promptResponseRows: PromptResponseRow[]
): Promise<AnalysisWorkRow[]> {
  // Fetch source rows from the sources table
  const responseIds = promptResponseRows.map((row) => row.id);
  const sourceRows = await getSourceRowsWithPromptResponseIds(responseIds, { asAdmin: true });

  // Group source items by prompt_response_id
  const sourcesByResponseId = new Map<string, SourceItem[]>();
  sourceRows.forEach((row) => {
    let group = sourcesByResponseId.get(row.prompt_response_id);
    if (!group) {
      group = [];
      sourcesByResponseId.set(row.prompt_response_id, group);
    }
    group.push(sourceRowToSourceItem(row));
  });

  const workRowBrandIdsRanking = await Promise.all(
    promptResponseRows.map((row) => getBrandIdsRankingsInText(row.text, projectRow, competitorRows))
  );
  const workRowSources = await Promise.allSettled(
    promptResponseRows.map(async (row) => {
      const items = sourcesByResponseId.get(row.id) ?? [];
      return analysePromptResponseSources(items, projectRow, competitorRows);
    })
  );
  return promptResponseRows.map((row, index) => ({
    id: row.id,
    brand_ids_ranking: workRowBrandIdsRanking[index],
    sources: workRowSources[index].status === 'fulfilled' ? workRowSources[index].value : [],
  }));
}
