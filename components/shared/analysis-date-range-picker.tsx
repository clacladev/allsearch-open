'use client';

import { CalendarDays, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MAX_ALLOWED_DAYS_IN_DATE_RANGE } from '@/libs/utils/dateRange';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';

export type AnalysisDateRange = { start: string; end: string };

function defaultAnalysisRange(): AnalysisDateRange {
  const { startDateISO: start, endDateISO: end } = getDefaultAnalysisDateRange();
  return { start, end };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function getRangeError({ start, end }: AnalysisDateRange): string | undefined {
  if (!start || !end) return 'Select both a start and end date.';
  if (start > end) return 'The start date must be on or before the end date.';

  const rangeInDays = Math.floor((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
  if (rangeInDays > MAX_ALLOWED_DAYS_IN_DATE_RANGE) {
    return `Select a date range of ${MAX_ALLOWED_DAYS_IN_DATE_RANGE} days or fewer.`;
  }
}

export function AnalysisDateRangePicker({
  value,
  defaultValue = defaultAnalysisRange(),
  onApply,
}: {
  value: AnalysisDateRange;
  defaultValue?: AnalysisDateRange;
  onApply: (value: AnalysisDateRange) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  useEffect(() => setDraft(value), [value]);
  const isDefault = value.start === defaultValue.start && value.end === defaultValue.end;
  const rangeError = getRangeError(draft);
  const onCancelClick = () => {
    setDraft(value);
    setOpen(false);
  };
  const onApplyClick = () => {
    onApply(draft);
    setOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="px-3" aria-label="Date range picker" />
          }
        >
          <CalendarDays aria-hidden="true" />
          {formatDate(value.start)} – {formatDate(value.end)}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium">
              Start date
              <Input
                aria-label="Start date"
                aria-describedby={rangeError ? 'analysis-date-range-error' : undefined}
                type="date"
                value={draft.start}
                max={draft.end}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, start: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              End date
              <Input
                aria-label="End date"
                aria-describedby={rangeError ? 'analysis-date-range-error' : undefined}
                type="date"
                value={draft.end}
                min={draft.start}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, end: event.target.value }))
                }
              />
            </label>
          </div>
          {rangeError && (
            <p id="analysis-date-range-error" role="alert" className="text-sm text-destructive">
              {rangeError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancelClick}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={Boolean(rangeError)} onClick={onApplyClick}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      {!isDefault && (
        <Button type="button" variant="outline" size="sm" className="px-3" onClick={() => onApply(defaultValue)}>
          <RotateCcw aria-hidden="true" />
          Reset dates
        </Button>
      )}
    </div>
  );
}
