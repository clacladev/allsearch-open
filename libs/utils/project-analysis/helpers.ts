import { PromptResponseSummaryRow } from '@/libs/database/PromptResponses/types';
import { SourceRow, SourceSummaryRow, SourceItem, sourceRowToSourceItem } from '@/libs/database/Sources/types';
import { ISODateString, getISODateString } from '@/libs/database/shared/ISODateString';
import { getUniqueId } from '@/libs/signature';

let lastOpportunityId = 0;
export const resetOpportunityId = () => (lastOpportunityId = 0);
export const getNewOpportunityId = () => getUniqueId(lastOpportunityId++);

export interface PromptResponseWorkRow extends PromptResponseSummaryRow {
  key: string;
  created_at_iso_date: ISODateString;
  sources: SourceItem[];
}

/** One collection group: the responses of a single Collection Run, or — for responses whose
 * `run_id` is NULL (backfill inserts, or a deleted Run that nulled it) — of a single ISO day. */
export type CollectionGroup = {
  runId: string | null;
  date: ISODateString;
  finishedAt: string;
  responses: PromptResponseWorkRow[];
};

/** The collection group containing the newest response in the given set. Deliberately does not
 * assume any input ordering: rows arrive DESC from the DB and are then re-emitted in Map
 * insertion order by `getPromptResponsesWorkRows`. `created_at` holds UTC ISO-8601 strings, so
 * comparing them lexicographically is chronological. Returns null for an empty input. */
export function getLatestCollectionGroup(
  promptResponses: PromptResponseWorkRow[]
): CollectionGroup | null {
  if (!promptResponses.length) return null;

  type WorkGroup = Omit<CollectionGroup, 'finishedAt'> & { newestCreatedAt: string };
  const groups = new Map<string, WorkGroup>();
  promptResponses.forEach((response) => {
    const key = response.run_id
      ? `run:${response.run_id}`
      : `date:${response.created_at_iso_date}`;
    const group = groups.get(key);
    if (!group) {
      groups.set(key, {
        runId: response.run_id,
        date: response.created_at_iso_date,
        newestCreatedAt: response.created_at,
        responses: [response],
      });
      return;
    }
    group.responses.push(response);
    // A Run can straddle midnight — date-stamp the group by its newest response.
    if (response.created_at > group.newestCreatedAt) {
      group.newestCreatedAt = response.created_at;
      group.date = response.created_at_iso_date;
    }
  });

  let latest: WorkGroup | undefined;
  groups
    .values()
    .toArray()
    .forEach((group) => {
      if (!latest || group.newestCreatedAt > latest.newestCreatedAt) latest = group;
    });
  if (!latest) return null;
  return { runId: latest.runId, date: latest.date, finishedAt: latest.newestCreatedAt, responses: latest.responses };
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
    // For each prompt and chatbot keep only the latest one of the day.
    // Rows may arrive in DESC order (newest first), so replace only when
    // strictly newer; created_at is UTC ISO-8601, so lexicographic compare
    // is chronological (same invariant as getLatestCollectionGroup above).
    .forEach((response) => {
      const existing = uniquesResponsesMap.get(response.key);
      if (!existing || response.created_at > existing.created_at) {
        uniquesResponsesMap.delete(response.key);
        uniquesResponsesMap.set(response.key, response); // Move to the end of insertion order
      }
    });

  return uniquesResponsesMap.values().toArray();
}
