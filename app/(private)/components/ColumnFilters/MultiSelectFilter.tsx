'use client';

import type { Selection } from 'react-aria-components';
import {
  DialogTrigger,
  Button as AriaButton,
  Popover as AriaPopover,
  ListBox,
  ListBoxItem,
} from 'react-aria-components';
import { Check, ChevronDown } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Dot } from '@/components/foundations/dot-icon';

export type FilterOption = {
  id: string;
  label: string;
  count?: number;
};

interface MultiSelectFilterProps {
  label: string;
  options: FilterOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function MultiSelectFilter({
  label,
  options,
  selectedIds,
  onChange,
}: MultiSelectFilterProps) {
  const isActive = selectedIds.length > 0;
  const firstSelected = options.find((o) => selectedIds.includes(o.id));
  const additionalCount = selectedIds.length - 1;

  const handleSelectionChange = (keys: Selection) => {
    if (keys === 'all') return;
    onChange(Array.from(keys as Set<string>));
  };

  const displayLabel = isActive
    ? `${firstSelected?.label ?? ''}${additionalCount > 0 ? ` +${additionalCount}` : ''}`
    : 'All';

  return (
    <DialogTrigger>
      <div className="relative">
        <AriaButton
          className={({ isFocusVisible }) =>
            cx(
              'bg-primary ring-primary flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm shadow-xs ring-1 outline-hidden transition duration-100 ring-inset',
              isFocusVisible && 'ring-brand ring-2',
              isActive ? 'text-primary' : 'text-secondary'
            )
          }
        >
          <span className={isActive ? 'text-secondary' : ''}>{label}:</span>
          <span className={isActive ? 'text-primary font-medium' : 'text-placeholder'}>
            {displayLabel}
          </span>
          <ChevronDown className="text-fg-quaternary size-4 shrink-0" />
        </AriaButton>
        {isActive && (
          <Dot
            size="md"
            className="text-fg-warning-primary pointer-events-none absolute -top-1 -right-1"
          />
        )}
      </div>

      <AriaPopover
        placement="bottom start"
        offset={4}
        className={({ isEntering, isExiting }) =>
          cx(
            'min-w-40 max-h-64 overflow-y-auto rounded-lg bg-primary py-1 shadow-lg ring-1 ring-secondary_alt outline-hidden will-change-transform',
            isEntering &&
              'duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5',
            isExiting &&
              'duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5'
          )
        }
      >
        <ListBox
          selectionMode="multiple"
          selectedKeys={new Set(selectedIds)}
          onSelectionChange={handleSelectionChange}
          items={options}
          className="outline-hidden"
          aria-label={`Filter by ${label}`}
        >
          {(item) => (
            <ListBoxItem
              id={item.id}
              textValue={item.label}
              className={({ isFocused, isHovered }) =>
                cx(
                  'flex cursor-pointer items-center gap-2.5 px-3.5 py-2.5 outline-hidden',
                  (isFocused || isHovered) && 'bg-primary_hover'
                )
              }
            >
              {({ isSelected }) => (
                <>
                  <span className="text-primary flex-1 truncate text-sm">
                    {item.label}
                  </span>
                  {item.count !== undefined && (
                    <span className="text-tertiary shrink-0 text-xs tabular-nums">{item.count}</span>
                  )}
                  <div
                    className={cx(
                      'flex size-4 shrink-0 items-center justify-center rounded ring-1',
                      isSelected ? 'bg-brand-solid ring-brand-solid' : 'ring-secondary'
                    )}
                  >
                    {isSelected && <Check className="size-3 text-white" />}
                  </div>
                </>
              )}
            </ListBoxItem>
          )}
        </ListBox>
      </AriaPopover>
    </DialogTrigger>
  );
}
