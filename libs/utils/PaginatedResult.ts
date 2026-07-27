import { Summary } from './Summary';

export const DEFAULT_PAGE_SIZE = 20;

export type SortDirection = 'asc' | 'desc';

export type SortParams<T> = {
  sortBy: keyof T;
  sortDir: SortDirection;
};

export type PaginatedResult<T> = {
  data: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
};

export function sortSummaryData<T>(
  summary: Summary<T>,
  sortParams?: SortParams<T>
): Summary<T> {
  if (!sortParams) return summary;
  const { sortBy, sortDir } = sortParams;
  const sorted = [...summary.data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    const result = aVal < bVal ? -1 : 1;
    return sortDir === 'asc' ? result : -result;
  });
  return { data: sorted, totalCount: summary.totalCount };
}

export function getPaginatedResult<T>(
  summary: Summary<T>,
  pageNo: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
  sortParams?: SortParams<T>
): PaginatedResult<T> {
  const sortedSummary = sortParams ? sortSummaryData(summary, sortParams) : summary;
  return {
    data: sortedSummary.data.slice(pageNo * pageSize, (pageNo + 1) * pageSize),
    totalItems: sortedSummary.totalCount,
    currentPage: pageNo,
    totalPages: Math.ceil(sortedSummary.totalCount / pageSize),
  };
}
