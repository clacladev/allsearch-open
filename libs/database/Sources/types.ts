import { sources } from '../schema';

import type { PageHeading } from '@/libs/utils/urlAnalysis';

export type SourceRow = typeof sources.$inferSelect;

export type SourceSummaryRow = Omit<SourceRow, 'raw_url' | 'description' | 'headings'>;

/** Application-level source type with camelCase fields, used by analysis code and UI components. */
export interface SourceItem {
  isCited: boolean;
  url: string;
  cleanUrl: string;
  hostname: string;
  rawUrl?: string;
  title?: string;
  description?: string;
  headings?: PageHeading[];
  brandIdsRanking?: string[];
}

type SourceRowInput = SourceSummaryRow & Partial<Pick<SourceRow, 'raw_url' | 'description' | 'headings'>>;

/** True when a source has at least one page heading we can use as inspiration. */
export function hasInspirationHeadings(source: Pick<SourceItem, 'headings'>): boolean {
  return !!source.headings && source.headings.length > 0;
}

/** Convert a SourceRow (or SourceSummaryRow) into a SourceItem. */
export function sourceRowToSourceItem(row: SourceRowInput): SourceItem {
  return {
    isCited: row.is_cited,
    url: row.url,
    cleanUrl: row.clean_url,
    hostname: row.hostname,
    rawUrl: row.raw_url ?? undefined,
    title: row.title ?? undefined,
    description: row.description ?? undefined,
    headings: row.headings ?? undefined,
    brandIdsRanking: row.brand_ids_ranking.length ? row.brand_ids_ranking : undefined,
  };
}
