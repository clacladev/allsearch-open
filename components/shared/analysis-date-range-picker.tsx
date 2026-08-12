'use client';

import { CalendarDays, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getDefaultAnalysisDateRange } from '@/libs/utils/searchParamsHelpers';

export type AnalysisDateRange = { start: string; end: string };

function defaultAnalysisRange(): AnalysisDateRange {
  const { startDateISO: start, endDateISO: end } = getDefaultAnalysisDateRange();
  return { start, end };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

export function AnalysisDateRangePicker({ value, defaultValue = defaultAnalysisRange(), onApply }: { value: AnalysisDateRange; defaultValue?: AnalysisDateRange; onApply: (value: AnalysisDateRange) => void }) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  useEffect(() => setDraft(value), [value]);
  const isDefault = value.start === defaultValue.start && value.end === defaultValue.end;

  return <div className="flex flex-wrap items-center gap-2">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button type="button" variant="outline" size="sm" aria-label="Date range picker" />}><CalendarDays aria-hidden="true" />{formatDate(value.start)} – {formatDate(value.end)}</PopoverTrigger>
      <PopoverContent align="start" className="w-auto">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium">Start date<Input aria-label="Start date" type="date" value={draft.start} max={draft.end} onChange={(event) => setDraft((current) => ({ ...current, start: event.target.value }))} /></label>
          <label className="grid gap-1 text-sm font-medium">End date<Input aria-label="End date" type="date" value={draft.end} min={draft.start} onChange={(event) => setDraft((current) => ({ ...current, end: event.target.value }))} /></label>
        </div>
        <div className="flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => { setDraft(value); setOpen(false); }}>Cancel</Button><Button type="button" size="sm" disabled={!draft.start || !draft.end || draft.start > draft.end} onClick={() => { onApply(draft); setOpen(false); }}>Apply</Button></div>
      </PopoverContent>
    </Popover>
    {!isDefault && <Button type="button" variant="ghost" size="sm" onClick={() => onApply(defaultValue)}><RotateCcw aria-hidden="true" />Reset dates</Button>}
  </div>;
}
