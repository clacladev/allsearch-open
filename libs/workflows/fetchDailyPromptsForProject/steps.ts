import { executePrompt } from '@/libs/collection/executePrompt';
import { selectPromptsToCollect } from '@/libs/collection/selectPrompts';
import { getProjectRowWithId, updateProjectRow } from '@/libs/database/Projects/queries';
import { ISODateString } from '@/libs/database/shared/ISODateString';

export async function getPromptRowsToProcess(
  projectId: string,
  targetDate: ISODateString,
  maxPrompts?: number,
  shouldForce?: boolean
) {
  'use step';
  return selectPromptsToCollect(projectId, targetDate, { maxPrompts, shouldForce });
}

export async function fetchDailyPrompt(
  promptName: string,
  promptId: string,
  projectId: string,
  workflowId: string
) {
  'use step';
  await executePrompt({ promptId, promptName, projectId, workflowId });
}

export async function isProjectPaused(projectId: string): Promise<boolean> {
  'use step';
  const project = await getProjectRowWithId(projectId);
  return project?.is_paused ?? true;
}

export async function updateProjectWithPromptsUpdatedAt(projectId: string, datetimeISO: string) {
  'use step';
  await updateProjectRow(projectId, { prompts_updated_at: datetimeISO });
}
