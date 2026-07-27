import { fetchEntitiesForProcessing, processEntitiesAndSaveAnalysis } from './steps';

export async function updateLastDayOfPromptResponsesAnalysis(projectId: string, userId: string) {
  'use workflow';

  const { projectRow, competitorRows, promptResponseRows } = await fetchEntitiesForProcessing(
    projectId,
    userId
  );
  await processEntitiesAndSaveAnalysis(projectRow, competitorRows, promptResponseRows);
}
