'use client';

import { useMemo, useState } from 'react';
import {
  endOfMonth,
  endOfWeek,
  getLocalTimeZone,
  startOfMonth,
  startOfWeek,
  today,
} from '@internationalized/date';
import { useControlledState } from '@react-stately/utils';
import { Calendar as CalendarIcon } from '@untitledui/icons';
import { useDateFormatter } from 'react-aria';
import type {
  DateRangePickerProps as AriaDateRangePickerProps,
  DateValue,
} from 'react-aria-components';
import {
  DateRangePicker as AriaDateRangePicker,
  Dialog as AriaDialog,
  Group as AriaGroup,
  Popover as AriaPopover,
  useLocale,
} from 'react-aria-components';
import { Button } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';
import { DateInput } from './date-input';
import { DateRangePickerPresets, RangeCalendar } from './range-calendar';
import { RangePresetButton } from './range-preset';

const now = today(getLocalTimeZone());

const highlightedDates = [today(getLocalTimeZone())];

interface DateRangePickerProps extends AriaDateRangePickerProps<DateValue> {
  /** The presets to display in the date range picker. */
  presets?: DateRangePickerPresets;
  /** The maximum number of days allowed in a range. */
  maxDaysInRange?: number;
  /** The function to call when the apply button is clicked. */
  onApply?: () => void;
  /** The function to call when the cancel button is clicked. */
  onCancel?: () => void;
}

export const DateRangePicker = ({
  value: valueProp,
  defaultValue,
  presets: inputPresets,
  maxDaysInRange,
  onChange,
  onApply,
  onCancel,
  ...props
}: DateRangePickerProps) => {
  const { locale } = useLocale();
  const formatter = useDateFormatter({
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const [value, setValue] = useControlledState(valueProp, defaultValue || null, onChange);
  const [focusedValue, setFocusedValue] = useState<DateValue | null>(null);

  const isInvalid = useMemo(() => {
    if (!maxDaysInRange || !value || !value.start || !value.end) return false;

    // Check if the range exceeds maxDaysInRange
    try {
      return value.end.compare(value.start.add({ days: maxDaysInRange - 1 })) > 0;
    } catch (_) {
      return false;
    }
  }, [value, maxDaysInRange]);

  const formattedStartDate = value?.start
    ? formatter.format(value.start.toDate(getLocalTimeZone()))
    : 'Select date';
  const formattedEndDate = value?.end
    ? formatter.format(value.end.toDate(getLocalTimeZone()))
    : 'Select date';

  const presets = useMemo(
    () =>
      inputPresets ?? {
        today: { label: 'Today', value: { start: now, end: now } },
        yesterday: {
          label: 'Yesterday',
          value: { start: now.subtract({ days: 1 }), end: now.subtract({ days: 1 }) },
        },
        thisWeek: {
          label: 'This week',
          value: { start: startOfWeek(now, locale), end: endOfWeek(now, locale) },
        },
        lastWeek: {
          label: 'Last week',
          value: {
            start: startOfWeek(now, locale).subtract({ weeks: 1 }),
            end: endOfWeek(now, locale).subtract({ weeks: 1 }),
          },
        },
        thisMonth: {
          label: 'This month',
          value: { start: startOfMonth(now), end: endOfMonth(now) },
        },
        lastMonth: {
          label: 'Last month',
          value: {
            start: startOfMonth(now).subtract({ months: 1 }),
            end: endOfMonth(now).subtract({ months: 1 }),
          },
        },
        thisYear: {
          label: 'This year',
          value: {
            start: startOfMonth(now.set({ month: 1 })),
            end: endOfMonth(now.set({ month: 12 })),
          },
        },
        lastYear: {
          label: 'Last year',
          value: {
            start: startOfMonth(now.set({ month: 1 }).subtract({ years: 1 })),
            end: endOfMonth(now.set({ month: 12 }).subtract({ years: 1 })),
          },
        },
        allTime: {
          label: 'All time',
          value: {
            start: now.set({ year: 2000, month: 1, day: 1 }),
            end: now,
          },
        },
      },
    [locale]
  );

  return (
    <AriaDateRangePicker
      aria-label="Date range picker"
      shouldCloseOnSelect={false}
      {...props}
      value={value}
      onChange={setValue}
      isInvalid={isInvalid}
    >
      <AriaGroup>
        <Button size="sm" color="secondary" iconLeading={CalendarIcon}>
          {!value ? (
            <span className="text-placeholder">Select dates</span>
          ) : (
            `${formattedStartDate} – ${formattedEndDate}`
          )}
        </Button>
      </AriaGroup>
      <AriaPopover
        placement="bottom right"
        offset={8}
        className={({ isEntering, isExiting }) =>
          cx(
            'origin-(--trigger-anchor-point) will-change-transform',
            isEntering &&
              'animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5 duration-150 ease-out',
            isExiting &&
              'animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5 duration-100 ease-in'
          )
        }
      >
        <AriaDialog className="bg-primary ring-secondary_alt flex rounded-2xl shadow-xl ring focus:outline-hidden">
          {({ close }) => (
            <>
              <div className="border-secondary hidden w-38 flex-col gap-0.5 border-r border-solid p-3 lg:flex">
                {Object.values(presets).map((preset) => (
                  <RangePresetButton
                    key={preset.label}
                    value={preset.value}
                    onClick={() => {
                      setValue(preset.value);
                      setFocusedValue(preset.value.start);
                    }}
                  >
                    {preset.label}
                  </RangePresetButton>
                ))}
              </div>
              <div className="flex flex-col">
                <RangeCalendar
                  focusedValue={focusedValue}
                  onFocusChange={setFocusedValue}
                  highlightedDates={highlightedDates}
                  presets={presets}
                />
                <div className="border-secondary flex justify-between gap-3 border-t p-4">
                  <div className="hidden items-center gap-2 md:flex">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <DateInput slot="start" className="w-36" />
                        <div className="text-md text-quaternary">–</div>
                        <DateInput slot="end" className="w-36" />
                      </div>
                      {isInvalid && maxDaysInRange && (
                        <span className="text-error-primary text-xs font-medium">
                          Maximum range is {maxDaysInRange} days
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto">
                    <Button
                      size="md"
                      color="secondary"
                      onClick={() => {
                        onCancel?.();
                        close();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="md"
                      color="primary"
                      isDisabled={isInvalid}
                      onClick={() => {
                        onApply?.();
                        close();
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </AriaDialog>
      </AriaPopover>
    </AriaDateRangePicker>
  );
};
