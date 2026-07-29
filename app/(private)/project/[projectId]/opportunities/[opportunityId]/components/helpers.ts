import { Opportunity } from '@/libs/utils/project-analysis/types';
import { PromptResponseRow } from '@/libs/database/PromptResponses/types';
import { SourceRow } from '@/libs/database/Sources/types';
import { sourceRowsToSourceItems } from '@/libs/utils/project-analysis/helpers';
import { PromptResponseContent } from '../../../prompts/[promptId]/types';

export type SourceIdMap = Record<string, string>;
export type RecentResponsesMap = Record<string, PromptResponseContent[]>;

const RECENT_RESPONSES_LIMIT = 3;

/**
 * Extracts the target prompt IDs from an opportunity and returns the latest
 * prompt responses for each prompt, formatted as a map of promptId → PromptResponseContent[].
 */
export function getRecentResponsesForOpportunity(
  opportunity: Opportunity,
  projectId: string,
  allPromptResponses: PromptResponseRow[],
  sourceRows: SourceRow[]
): RecentResponsesMap {
  let targetPromptIds: string[] = [];

  if (
    opportunity.type === 'ProjectSourceNeedsImprovementOpportunity' ||
    opportunity.type === 'ProjectSourceNotCitedOpportunity'
  ) {
    targetPromptIds = Object.keys(opportunity.promptsBasedInspiration);
  } else if (
    opportunity.type === 'ProjectSourceNotFoundOpportunity' ||
    opportunity.type === 'ProjectSourceNotConsistentlyFoundOpportunity' ||
    opportunity.type === 'UgcSourceNeedsImprovementOpportunity'
  ) {
    if (opportunity.promptId) targetPromptIds = [opportunity.promptId];
  }

  if (!targetPromptIds.length) return {};

  // Group source rows by prompt_response_id
  const sourcesByResponseId = new Map<string, SourceRow[]>();
  sourceRows.forEach((row) => {
    let group = sourcesByResponseId.get(row.prompt_response_id);
    if (!group) {
      group = [];
      sourcesByResponseId.set(row.prompt_response_id, group);
    }
    group.push(row);
  });

  const result: RecentResponsesMap = {};

  for (const promptId of targetPromptIds) {
    result[promptId] = allPromptResponses
      .filter((r) => r.prompt_id === promptId)
      .slice(0, RECENT_RESPONSES_LIMIT)
      .map((response) => ({
        id: response.id,
        text: response.text,
        chatbotId: response.chatbot_id,
        projectIdRank: response.brand_ids_ranking.indexOf(projectId),
        brandIdsRanking: response.brand_ids_ranking,
        sources: sourceRowsToSourceItems(sourcesByResponseId.get(response.id) ?? []),
        sentiment: response.sentiment ?? undefined,
        createdAt: response.created_at,
      }));
  }

  return result;
}

/**
 * Builds a map of cleanUrl → sourceId for all sources in an opportunity.
 * This allows the client component to link to source detail pages without
 * needing access to Node.js crypto (getUniqueId uses SHA-256).
 */
export function buildSourceIdMap(
  opportunity: Opportunity,
  getUniqueId: (data: string) => string
): SourceIdMap {
  const map: SourceIdMap = {};

  if (
    opportunity.type === 'ProjectSourceNeedsImprovementOpportunity' ||
    opportunity.type === 'ProjectSourceNotCitedOpportunity'
  ) {
    if (opportunity.projectSource) {
      map[opportunity.projectSource.cleanUrl] = getUniqueId(opportunity.projectSource.cleanUrl);
    }
    Object.values(opportunity.promptsBasedInspiration).forEach(({ sources }) => {
      sources.forEach((source) => {
        if (!map[source.cleanUrl]) {
          map[source.cleanUrl] = getUniqueId(source.cleanUrl);
        }
      });
    });
  }

  if (
    opportunity.type === 'ProjectSourceNotFoundOpportunity' ||
    opportunity.type === 'ProjectSourceNotConsistentlyFoundOpportunity'
  ) {
    opportunity.inspirationSources.forEach((source) => {
      if (!map[source.cleanUrl]) {
        map[source.cleanUrl] = getUniqueId(source.cleanUrl);
      }
    });
  }

  if (opportunity.type === 'UgcSourceNeedsImprovementOpportunity') {
    map[opportunity.source.cleanUrl] = getUniqueId(opportunity.source.cleanUrl);
  }

  return map;
}
