import { Fragment } from 'react';
import { Badge } from '@/components/base/badges/badges';
import { OPPORTUNITY_TYPE_NAME } from '@/libs/utils/opportunities';
import type { OutlineOpportunityType } from '@/libs/utils/project-analysis/types';

type Props = {
  promptName: string;
  /**
   * Type of opportunity driving this generation flow. Surfaces as a badge
   * above the prompt name so the user can see whether they're creating new
   * content for the prompt or improving an existing source.
   */
  opportunityType?: OutlineOpportunityType;
  inspirationSourceCount?: number;
  /** Calendar date in `YYYY-MM-DD`. Parsed as a local date (no UTC shift). */
  startDate?: string;
  /** Calendar date in `YYYY-MM-DD`. Parsed as a local date (no UTC shift). */
  endDate?: string;
  /**
   * Optional trailing detail rendered as the last metadata chunk, e.g.
   * "1,588 words written" while streaming or "1,588 words · 7 min read" once
   * the article is editable.
   */
  trailingDetail?: string;
};

const OPPORTUNITY_TYPE_BADGE_COLOR: Record<
  OutlineOpportunityType,
  'brand' | 'success' | 'warning'
> = {
  ProjectSourceNotFoundOpportunity: 'brand',
  ProjectSourceNeedsImprovementOpportunity: 'warning',
  ProjectSourceNotCitedOpportunity: 'success',
};

const MONTH_DAY = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});
const MONTH_DAY_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

/**
 * Format an inclusive ISO date range (`YYYY-MM-DD` to `YYYY-MM-DD`) for
 * display. Drops the year on the start date when both endpoints share a year
 * to keep the strip compact, and uses an en dash as the range separator.
 */
function formatDateRange(start: string, end: string): string {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  // Construct via numeric ctor so the string isn't interpreted as UTC midnight,
  // which would shift the displayed day in negative-offset timezones.
  const startDate = new Date(sy, sm - 1, sd);
  const endDate = new Date(ey, em - 1, ed);
  const startLabel =
    sy === ey ? MONTH_DAY.format(startDate) : MONTH_DAY_YEAR.format(startDate);
  return `${startLabel} – ${MONTH_DAY_YEAR.format(endDate)}`;
}

/**
 * Header strip for the outline and article surfaces. Promotes the target
 * prompt as the visual anchor and demotes source count, date range, and word
 * count into a single muted caption underneath. Each metadata chunk is
 * `whitespace-nowrap` so the line can only break between chunks, never
 * mid-date or mid-phrase.
 */
export function OutlineContextHeader({
  promptName,
  opportunityType,
  inspirationSourceCount,
  startDate,
  endDate,
  trailingDetail,
}: Props) {
  const meta: string[] = [];
  if (inspirationSourceCount && inspirationSourceCount > 0) {
    meta.push(
      `${inspirationSourceCount.toLocaleString()} ${
        inspirationSourceCount === 1 ? 'source' : 'sources'
      }`
    );
  }
  if (startDate && endDate) {
    meta.push(formatDateRange(startDate, endDate));
  }
  if (trailingDetail) {
    meta.push(trailingDetail);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {opportunityType && (
        <div>
          <Badge color={OPPORTUNITY_TYPE_BADGE_COLOR[opportunityType]} size="sm">
            {OPPORTUNITY_TYPE_NAME[opportunityType]}
          </Badge>
        </div>
      )}
      <p className="text-primary text-md font-medium">&ldquo;{promptName}&rdquo;</p>
      {meta.length > 0 && (
        <p className="text-tertiary flex flex-wrap items-center gap-x-1.5 text-sm tabular-nums">
          {meta.map((item, index) => (
            <Fragment key={item}>
              {index > 0 && <span aria-hidden="true">·</span>}
              <span className="whitespace-nowrap">{item}</span>
            </Fragment>
          ))}
        </p>
      )}
    </div>
  );
}
