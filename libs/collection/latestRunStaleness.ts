// Client-safe: this file must not import `server-only`, `@/libs/database/client`, or any
// `queries.ts`. Client components import it directly, never via the `@/libs/collection` barrel
// (that barrel pulls in server-only modules).

import { COLLECTION_CADENCE_DAYS } from './constants';
import {
  countDaysBetween,
  getISODateString,
  getLocalISODateString,
  ISODateString,
} from '@/libs/database/shared/ISODateString';

/** Whether the overview's in-context staleness notice should render (issue 14, criteria 9-10;
 * findings 2, 3, 4, 5). Pure and DOM-free, the pattern `deriveCollectionCadenceState` /
 * `deriveCadenceSurfaces` establish. */
export function getShouldShowLatestRunNotice(input: {
  latestRunDate: ISODateString | null;
  latestRunFinishedAt: string | null;
  latestRunId: string | null;
  rangeEndDate: ISODateString;
  lastCompletedRunFinishedAt: string | null | undefined;
  lastCompletedRunId: string | null | undefined;
  appWideStale: boolean;
  now: number;
}): boolean {
  const {
    latestRunDate, latestRunFinishedAt, latestRunId, rangeEndDate,
    lastCompletedRunFinishedAt, lastCompletedRunId, appWideStale, now,
  } = input;
  if (!latestRunDate) return false;

  if (appWideStale) return false;

  const todayISO = getLocalISODateString(new Date(now));
  if (rangeEndDate < todayISO) return false;

  const latestLocalDate = latestRunFinishedAt
    ? getLocalISODateString(new Date(latestRunFinishedAt))
    : latestRunDate;
  if (countDaysBetween(latestLocalDate, todayISO) >= COLLECTION_CADENCE_DAYS) return true;

  if (!lastCompletedRunFinishedAt) return false;
  if (Number.isNaN(Date.parse(lastCompletedRunFinishedAt))) return false;

  if (latestRunId !== null && lastCompletedRunId) {
    return lastCompletedRunId !== latestRunId;
  }
  return getISODateString(lastCompletedRunFinishedAt) > latestRunDate;
}
