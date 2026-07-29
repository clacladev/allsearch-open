import { hasInspirationHeadings, type SourceItem } from '@/libs/database/Sources/types';
import type { Opportunity, OutlineOpportunityType } from './types';

/** Resolution from a chosen opportunity to the inputs the LLM needs. */
export type ResolvedOpportunity = {
  ourSource?: { cleanUrl: string; title?: string; headings?: SourceItem['headings'] };
  sourcesToInspireFrom: SourceItem[];
};

/**
 * Locate the opportunity that matches a (promptId, type, targetSourceCleanUrl)
 * tuple inside a list returned by getOpportunitiesSummary. Same matching rules
 * the article-outline POST route uses; hoisted so the article generator can
 * reuse it without duplicating the logic.
 */
export function findOpportunity(
  opportunities: Opportunity[],
  promptId: string,
  opportunityType: OutlineOpportunityType,
  targetSourceCleanUrl: string | null
): Opportunity | undefined {
  return opportunities.find((opportunity) => {
    if (opportunity.type !== opportunityType) return false;

    if (opportunity.type === 'ProjectSourceNotFoundOpportunity') {
      return opportunity.promptId === promptId;
    }

    const matchesPrompt = !!opportunity.promptsBasedInspiration[promptId];
    const matchesSource =
      targetSourceCleanUrl === null
        ? !opportunity.projectSource
        : opportunity.projectSource?.cleanUrl === targetSourceCleanUrl;
    return matchesPrompt && matchesSource;
  });
}

/**
 * Reduce an opportunity into the (ourSource, sourcesToInspireFrom) shape the
 * outline + article generators consume. Returns null for opportunity types
 * that don't support generation (defensive; callers should already restrict).
 */
export function normalizeOpportunityForGeneration(
  opportunity: Opportunity,
  promptId: string
): ResolvedOpportunity | null {
  switch (opportunity.type) {
    case 'ProjectSourceNotFoundOpportunity':
      return {
        ourSource: undefined,
        sourcesToInspireFrom: opportunity.inspirationSources,
      };

    case 'ProjectSourceNeedsImprovementOpportunity':
    case 'ProjectSourceNotCitedOpportunity': {
      const inspiration = opportunity.promptsBasedInspiration[promptId];
      const sources = inspiration?.sources ?? [];
      return {
        ourSource: opportunity.projectSource
          ? {
              cleanUrl: opportunity.projectSource.cleanUrl,
              title: opportunity.projectSource.title,
              headings: opportunity.projectSource.headings,
            }
          : undefined,
        sourcesToInspireFrom: sources,
      };
    }

    default:
      return null;
  }
}

/** Filter to sources that have inspiration-quality headings for the LLM. */
export function filterEligibleSources(sources: SourceItem[]): SourceItem[] {
  return sources.filter(hasInspirationHeadings);
}
