import { getPromptResponseRowsWithProjectIdInDateRange } from '@/libs/database/PromptResponses/queries';
import { getPromptRowsWithProjectId } from '@/libs/database/Prompts/queries';
import { getISODateString, ISODateString } from '@/libs/database/shared/ISODateString';

export type PromptToCollect = { id: string; name: string };

/** Today's `getPromptRowsToProcess` membership rule, unchanged: non-archived Prompts of a
 *  non-paused Project, skipping Prompts that already have a Prompt Response on `targetDate`
 *  unless forced. Weekly cadence is issue 13. */
export async function selectPromptsToCollect(
  projectId: string,
  targetDate: ISODateString,
  options?: { shouldForce?: boolean }
): Promise<PromptToCollect[]> {
  const prompts = await getPromptRowsWithProjectId(projectId, false);

  let filteredPrompts = prompts;
  if (!options?.shouldForce) {
    const targetDateISO = getISODateString(targetDate);
    const responses = await getPromptResponseRowsWithProjectIdInDateRange(
      projectId,
      targetDateISO,
      targetDateISO
    );
    filteredPrompts = prompts.filter(
      (prompt) => !responses.some((response) => response.prompt_id === prompt.id)
    );
  }

  return filteredPrompts.map((prompt) => ({
    name: prompt.name,
    id: prompt.id,
  }));
}
