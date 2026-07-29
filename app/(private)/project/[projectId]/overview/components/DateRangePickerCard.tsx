'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  endOfMonth,
  endOfWeek,
  getLocalTimeZone,
  startOfMonth,
  startOfWeek,
  today,
} from '@internationalized/date';
import { useLocale } from 'react-aria-components';
import { DateRangePicker } from '@/components/application/date-picker/date-range-picker';
import {
  DateRangePickerPresets,
  DateRangePickerValue,
} from '@/components/application/date-picker/range-calendar';
import { MAX_ALLOWED_DAYS_IN_DATE_RANGE } from '@/libs/utils/dateRange';
import { XClose } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { Dot } from '@/components/foundations/dot-icon';

const now = today(getLocalTimeZone());

export const useDateRangePickerPresets = () => {
  const { locale } = useLocale();

  const presets: DateRangePickerPresets = useMemo(
    () => ({
      today: { label: 'Today', value: { start: now, end: now } },
      yesterday: {
        label: 'Yesterday',
        value: { start: now.subtract({ days: 1 }), end: now.subtract({ days: 1 }) },
      },
      thisWeek: {
        label: 'This week',
        value: { start: startOfWeek(now, locale), end: endOfWeek(now, locale) },
      },
      last7Days: {
        label: 'Last 7 days',
        value: { start: now.subtract({ days: 7 }), end: now },
      },
      thisMonth: { label: 'This month', value: { start: startOfMonth(now), end: endOfMonth(now) } },
      last30Days: {
        label: 'Last 30 days',
        value: { start: now.subtract({ days: 30 }), end: now },
      },
    }),
    [locale]
  );

  return {
    presets,
    defaultPreset: presets.last30Days,
  };
};

const isDefaultDateRange = (range: DateRangePickerValue, defaultRange: DateRangePickerValue) =>
  range.start.compare(defaultRange.start) === 0 && range.end.compare(defaultRange.end) === 0;

export const DateRangePickerCard = ({
  selectedDateRange,
  onApplyAction,
}: {
  selectedDateRange: DateRangePickerValue;
  onApplyAction: (value: DateRangePickerValue) => void;
}) => {
  const { presets, defaultPreset } = useDateRangePickerPresets();
  const [newDateRange, setNewDateRange] = useState<DateRangePickerValue | null>(selectedDateRange);
  const isDefault = isDefaultDateRange(selectedDateRange, defaultPreset.value);

  // Sync selectedDateRange with newDateRange
  useEffect(() => {
    setNewDateRange(selectedDateRange);
  }, [selectedDateRange]);

  const onReset = useCallback(() => {
    setNewDateRange(defaultPreset.value);
    onApplyAction(defaultPreset.value);
  }, [defaultPreset.value, onApplyAction]);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <DateRangePicker
          aria-label="Date range picker"
          shouldCloseOnSelect={false}
          value={newDateRange}
          presets={presets}
          maxDaysInRange={MAX_ALLOWED_DAYS_IN_DATE_RANGE}
          onChange={setNewDateRange}
          onApply={() => onApplyAction(newDateRange ?? defaultPreset.value)}
          onCancel={() => setNewDateRange(selectedDateRange)}
        />
        {!isDefault && (
          <Dot
            size="md"
            className="text-fg-warning-primary pointer-events-none absolute -top-1 -right-1"
          />
        )}
      </div>
      {!isDefault && (
        <Button size="sm" color="secondary" iconLeading={XClose} onClick={onReset}>
          Reset dates
        </Button>
      )}
    </div>
  );
};
