import { CollectionGroup, PromptResponseWorkRow } from './helpers';
import { ISODateString } from '@/libs/database/shared/ISODateString';
import { COLLECTION_CADENCE_MS } from '@/libs/collection/constants';

/** Two collection cadences. Beyond this, consecutive points are not "the next weekly run" —
 * the app simply was not run, and the chart must break rather than draw a slope (ADR 0002). */
export const CHART_GAP_BREAK_MS = COLLECTION_CADENCE_MS * 2; // 14 days

/** Every Collection Run (or legacy no-run_id day group) contained in the given responses, filtered
 * to `[startDate, endDate]` and sorted ascending by `finishedAt`. Same grouping rule as
 * `getLatestCollectionGroup` — deliberately does not assume any input ordering: rows arrive DESC
 * from the DB and are then re-emitted in Map insertion order by `getPromptResponsesWorkRows`. */
export function getCollectionGroupsInRange(
  promptResponses: PromptResponseWorkRow[],
  startDate: ISODateString,
  endDate: ISODateString
): CollectionGroup[] {
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

  return groups
    .values()
    .toArray()
    .filter((group) => group.date >= startDate && group.date <= endDate)
    .map(
      (group): CollectionGroup => ({
        runId: group.runId,
        date: group.date,
        finishedAt: group.newestCreatedAt,
        responses: group.responses,
      })
    )
    .sort((a, b) => (a.finishedAt < b.finishedAt ? -1 : a.finishedAt > b.finishedAt ? 1 : 0));
}

/** Insert a synthetic all-null entry midway between two consecutive points more than
 * CHART_GAP_BREAK_MS apart. Recharts' Area defaults to connectNulls=false, so a null y-value
 * splits the curve into segments — that is what draws the gap as a gap. Verified:
 * recharts 3.8.1 es6/cartesian/Area.js sets connectNulls: false by default. */
export function insertGapBreakEntries<E extends { timestamp: number }>(
  entries: E[],
  brandLabels: string[]
): E[] {
  const result: E[] = [];
  entries.forEach((entry, index) => {
    const previous = entries[index - 1];
    if (previous && entry.timestamp - previous.timestamp > CHART_GAP_BREAK_MS) {
      const gap: Record<string, unknown> = {
        timestamp: Math.round((previous.timestamp + entry.timestamp) / 2),
        date: null,
        isGap: true,
      };
      brandLabels.forEach((label) => (gap[label] = null));
      result.push(gap as E);
    }
    result.push(entry);
  });
  return result;
}
