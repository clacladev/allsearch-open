import type { SourceItemCounter } from './types';
import type { PromptResponseWorkRow } from './helpers';
import { MAX_INSPIRATION_SOURCES_PER_OPPORTUNITY } from './getOpportunitiesSummary';

/**
 * Aggregate the inspiration sources cited across every response for a prompt,
 * regardless of whether the project's own sources appear among them. This
 * powers the "Create content" default flow that lets a user generate an
 * article outline for any prompt — including prompts that already have
 * project-source citations, which `getProjectSourceNotFoundOpportunities`
 * intentionally excludes from the opportunity listing.
 */
export function getInspirationSourcesForPromptId(
  promptId: string,
  promptResponses: PromptResponseWorkRow[]
): SourceItemCounter[] {
  const sourcesMap = new Map<string, SourceItemCounter>();
  for (const response of promptResponses) {
    if (response.prompt_id !== promptId) continue;
    for (const source of response.sources) {
      let item = sourcesMap.get(source.cleanUrl);
      if (!item) {
        item = { ...source, citationCount: 0 };
        sourcesMap.set(source.cleanUrl, item);
      }
      item.citationCount += 1;
    }
  }
  return Array.from(sourcesMap.values())
    .sort((a, b) => b.citationCount - a.citationCount)
    .slice(0, MAX_INSPIRATION_SOURCES_PER_OPPORTUNITY);
}
