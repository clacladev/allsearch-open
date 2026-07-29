import { getISODateString, getTodayISODateString } from '@/libs/database/shared/ISODateString';
import { DEFAULT_ANALYSIS_DATE_RANGE_DAYS } from '@/libs/utils/dateRange';
import z from 'zod';

export const DateRangePaginatedSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  page: z.coerce.number().min(0).optional().default(0),
});

export function getDateRangePaginatedInputs(searchParams: URLSearchParams) {
  const { startDate, endDate, page } = DateRangePaginatedSchema.parse({
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    page: searchParams.get('page'),
  });
  return {
    startDateISO: getISODateString(startDate),
    endDateISO: getISODateString(endDate),
    pageNo: page,
  };
}

export const getDefaultAnalysisDateRange = () => ({
  startDateISO: getISODateString(new Date(), -DEFAULT_ANALYSIS_DATE_RANGE_DAYS),
  endDateISO: getTodayISODateString(),
});

export function isDefaultDateRange(startDate: string, endDate: string) {
  const defaults = getDefaultAnalysisDateRange();
  return (
    getISODateString(startDate) === defaults.startDateISO &&
    getISODateString(endDate) === defaults.endDateISO
  );
}
