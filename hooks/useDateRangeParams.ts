'use client';

import { isDefaultDateRange } from '@/libs/utils/searchParamsHelpers';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';

type DateRangePayload = {
  startDate: string;
  endDate: string;
};

// Module-level in-memory store shared across all hook consumers
let memorizedDateRange: DateRangePayload | undefined;

/**
 * Reads startDate/endDate from URL search params and keeps them in memory.
 *
 * - If URL has both startDate and endDate, they are stored in memory.
 * - If URL has no dates, falls back to the in-memory values.
 * - Returns `{ startDate, endDate }` only when they differ from the default range.
 */
export function useDateRangeParams() {
  const searchParams = useSearchParams();

  const urlStart = searchParams.get('startDate');
  const urlEnd = searchParams.get('endDate');

  // Store URL dates in memory whenever they change
  useEffect(() => {
    if (urlStart && urlEnd) {
      memorizedDateRange = { startDate: urlStart, endDate: urlEnd };
    }
  }, [urlStart, urlEnd]);

  return useMemo(() => {
    // URL params take priority
    if (urlStart && urlEnd) {
      if (isDefaultDateRange(urlStart, urlEnd)) return {};
      return { startDate: urlStart, endDate: urlEnd };
    }

    // Fall back to in-memory store
    if (memorizedDateRange) {
      if (isDefaultDateRange(memorizedDateRange.startDate, memorizedDateRange.endDate)) return {};
      return { startDate: memorizedDateRange.startDate, endDate: memorizedDateRange.endDate };
    }

    return {};
  }, [urlStart, urlEnd]);
}
