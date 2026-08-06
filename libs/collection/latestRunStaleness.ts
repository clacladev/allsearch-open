// Client-safe: this file must not import `server-only`, `@/libs/database/client`, or any
// `queries.ts`. Client components import it directly, never via the `@/libs/collection` barrel
// (that barrel pulls in server-only modules).

import { COLLECTION_CADENCE_DAYS } from './constants';
import {
  countDaysBetween,
  getISODateString,
  ISODateString,
} from '@/libs/database/shared/ISODateString';

/** Whether the overview's in-context staleness notice should render (issue 14, criteria 9-10).
 * Pure and DOM-free, the pattern `deriveCollectionCadenceState` / `deriveCadenceSurfaces`
 * establish. */
export function getShouldShowLatestRunNotice(input: {
  /** `OverviewData.latestRun?.date ?? null` — the date of the latest collection group in range. */
  latestRunDate: ISODateString | null;
  /** The selected range's end date. */
  rangeEndDate: ISODateString;
  /** `lastCompletedRunFinishedAt` from `GET /api/collection-runs/cadence`; null/undefined when
   * unknown or when no Run has ever completed. */
  lastCompletedRunFinishedAt: string | null | undefined;
  now: number;
}): boolean {
  const { latestRunDate, rangeEndDate, lastCompletedRunFinishedAt, now } = input;
  if (!latestRunDate) return false;

  const todayISO = getISODateString(new Date(now));
  // A deliberate historical view must not nag — criterion 10. (Both are zero-padded YYYY-MM-DD,
  // so the string comparison is chronological.)
  if (rangeEndDate < todayISO) return false;

  // (a) the latest run in range finished 7+ days ago
  if (countDaysBetween(latestRunDate, todayISO) >= COLLECTION_CADENCE_DAYS) return true;

  // (b) a completed Collection Run exists that is newer than this Project's latest data
  if (!lastCompletedRunFinishedAt) return false;
  return getISODateString(lastCompletedRunFinishedAt) > latestRunDate;
}
