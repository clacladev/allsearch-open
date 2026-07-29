import { fetchEntitiesForProcessing, processEntitiesAndSaveAnalysis } from './steps';

export async function updateLastDayOfPromptResponsesAnalysis(projectId: string) {
  'use workflow';

  const { projectRow, competitorRows, promptResponseRows } =
    await fetchEntitiesForProcessing(projectId);
  await processEntitiesAndSaveAnalysis(projectRow, competitorRows, promptResponseRows);
}
