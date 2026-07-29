import { PromptResponseSummaryRow } from '@/libs/database/PromptResponses/types';
import { SourceRow, SourceSummaryRow, SourceItem, sourceRowToSourceItem } from '@/libs/database/Sources/types';
import { getISODateString } from '@/libs/database/shared/ISODateString';
import { getUniqueId } from '@/libs/signature';

let lastOpportunityId = 0;
export const resetOpportunityId = () => (lastOpportunityId = 0);
export const getNewOpportunityId = () => getUniqueId(lastOpportunityId++);

export interface PromptResponseWorkRow extends PromptResponseSummaryRow {
  key: string;
  created_at_iso_date: string;
  sources: SourceItem[];
}

type SourceRowInput = SourceSummaryRow & Partial<Pick<SourceRow, 'raw_url' | 'description' | 'headings'>>;

/** Convert SourceRows into a sorted SourceItem array. */
export function sourceRowsToSourceItems(sourceRows: SourceRowInput[]): SourceItem[] {
  return sourceRows
    .sort((a, b) => a.position - b.position)
    .map(sourceRowToSourceItem);
}

export function getPromptResponsesWorkRows(
  promptResponses: PromptResponseSummaryRow[],
  sourceRows: SourceRowInput[]
): PromptResponseWorkRow[] {
  if (!promptResponses.length) return [];

  // Group source rows by prompt_response_id
  const sourcesByResponseId = new Map<string, SourceRowInput[]>();
  sourceRows.forEach((row) => {
    let group = sourcesByResponseId.get(row.prompt_response_id);
    if (!group) {
      group = [];
      sourcesByResponseId.set(row.prompt_response_id, group);
    }
    group.push(row);
  });

  const uniquesResponsesMap = new Map<string, PromptResponseWorkRow>();
  promptResponses
    .map((response): PromptResponseWorkRow => {
      const createdAtIsoDate = getISODateString(response.created_at);
      const responseSources = sourcesByResponseId.get(response.id) ?? [];
      return {
        ...response,
        key: `${createdAtIsoDate}-${response.prompt_id}-${response.chatbot_id}`,
        created_at_iso_date: createdAtIsoDate,
        sources: sourceRowsToSourceItems(responseSources),
      };
    })
    // For each prompt and chatbot keep only the latest one of the day (assuming responses are sorted by created_at)
    .forEach((response) => {
      uniquesResponsesMap.delete(response.key);
      uniquesResponsesMap.set(response.key, response); // Move to the end of insertion order
    });

  return uniquesResponsesMap.values().toArray();
}
