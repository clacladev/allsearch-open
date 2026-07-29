import {
  fetchDailyPrompt,
  getPromptRowsToProcess,
  isProjectPaused,
  updateProjectWithPromptsUpdatedAt,
} from './steps';
import { ISODateString } from '@/libs/database/shared/ISODateString';

export async function fetchDailyPromptsForProjectWorkflow(
  projectId: string,
  today: ISODateString,
  maxPrompts?: number,
  shouldForce?: boolean
) {
  'use workflow';
  if (await isProjectPaused(projectId)) return;
  const prompts = await getPromptRowsToProcess(projectId, today, maxPrompts, shouldForce);
  const workflowId = `fetchDailyPromptsWorkflow-${projectId}-${today}`;
  await Promise.allSettled(
    prompts.map((prompt) => fetchDailyPrompt(prompt.name, prompt.id, projectId, workflowId))
  );
  await updateProjectWithPromptsUpdatedAt(projectId, new Date().toISOString());
}
