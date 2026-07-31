import { CompetitorRow } from '../database/Competitors/types';
import { ProjectRow } from '../database/Projects/types';
import { SourceItem } from '../database/Sources/types';
import { getUrlAnalysis } from '../utils/urlAnalysis';
import { getUrlCleanComponents } from '../utils/urls';

/** The plain implementation `libs/utils/sourcesAnalysis.ts` delegates to (issue 10 risk 1's stated
 *  fallback) — moved here so `libs/collection/executePrompt.ts` can call it directly without
 *  going through a `'use step'` directive outside any workflow context. Nothing under
 *  `libs/collection/` carries a DevKit directive; `libs/utils/sourcesAnalysis.ts` keeps the
 *  directive as a thin wrapper for its other, still-DevKit-driven callers. */
export async function analysePromptResponseSources(
  uniqueSources: SourceItem[],
  project: ProjectRow,
  competitors: CompetitorRow[]
): Promise<SourceItem[]> {
  // Analyse sources and enrich them
  const results = await Promise.allSettled(
    uniqueSources.map(async (source) => {
      try {
        const analysis = await getUrlAnalysis(source.url, project, competitors);
        const cleanUrlComponents = getUrlCleanComponents(analysis.resolvedUrl ?? analysis.inputUrl);
        return {
          ...source,
          url: analysis.resolvedUrl ?? analysis.inputUrl,
          cleanUrl: cleanUrlComponents.url,
          hostname: cleanUrlComponents.hostname,
          rawUrl: analysis.resolvedUrl !== analysis.inputUrl ? analysis.inputUrl : undefined,
          title: analysis.title,
          description: analysis.description,
          headings: analysis.headings,
          brandIdsRanking: analysis.brandIdsRanking,
        };
      } catch (_) {
        return source;
      }
    })
  );

  // Filter out undefined results
  return results
    .filter((s) => s.status === 'fulfilled')
    .map((s) => s.value)
    .filter((value) => value !== undefined);
}
