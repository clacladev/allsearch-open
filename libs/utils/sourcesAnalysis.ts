import { CompetitorRow } from '../database/Competitors/types';
import { ProjectRow } from '../database/Projects/types';
import { SourceItem } from '../database/Sources/types';
import { analysePromptResponseSources as analysePromptResponseSourcesImpl } from '../collection/analyseSources';

/** Thin `'use step'` wrapper around the plain implementation in `libs/collection/analyseSources.ts`
 *  — the same pattern `libs/workflows/fetchDailyPromptsForProject/steps.ts` applies to its own
 *  steps (issue 10). `withWorkflow` still compiles this file (`next.config.ts`), so it stays a step
 *  for the DevKit-driven callers that still use it (e.g.
 *  `libs/workflows/updateLastDayOfPromptResponsesAnalysis/steps.ts`); `libs/collection/executePrompt.ts`
 *  calls the plain implementation directly instead, since nothing under `libs/collection/` may
 *  carry a `'use step'`/`'use workflow'` directive. */
export async function analysePromptResponseSources(
  uniqueSources: SourceItem[],
  project: ProjectRow,
  competitors: CompetitorRow[]
): Promise<SourceItem[]> {
  'use step';
  return analysePromptResponseSourcesImpl(uniqueSources, project, competitors);
}
