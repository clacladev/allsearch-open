import { CompetitorRow } from '../database/Competitors/types';
import { ProjectRow } from '../database/Projects/types';
import { SourceItem } from '../database/Sources/types';
import { getUrlAnalysis } from './urlAnalysis';
import { getUrlCleanComponents } from './urls';

export async function analysePromptResponseSources(
  uniqueSources: SourceItem[],
  project: ProjectRow,
  competitors: CompetitorRow[]
): Promise<SourceItem[]> {
  'use step';
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
