'use client';

import type { ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { FilterLines, XClose } from '@untitledui/icons';
import { cx } from '@/utils/cx';
import { Dot } from '@/components/foundations/dot-icon';

interface FilterToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  hasActiveFilters: boolean;
}

export function FilterToggle({ isExpanded, onToggle, hasActiveFilters }: FilterToggleProps) {
  return (
    <div className="relative">
      <AriaButton
        onPress={onToggle}
        className={({ isFocusVisible }) =>
          cx(
            'bg-primary ring-primary flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold shadow-xs ring-1 outline-hidden transition duration-100 ring-inset',
            isFocusVisible && 'ring-brand ring-2',
            isExpanded ? 'text-primary' : 'text-secondary'
          )
        }
      >
        <FilterLines className="size-4" />
        Filters
      </AriaButton>
      {hasActiveFilters && (
        <Dot
          size="md"
          className="text-fg-warning-primary pointer-events-none absolute -top-1 -right-1"
        />
      )}
    </div>
  );
}

interface FilterBarProps {
  children: ReactNode;
  isExpanded: boolean;
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export function FilterBar({ children, isExpanded, hasActiveFilters, onClearAll }: FilterBarProps) {
  return (
    <div
      className={cx(
        'grid transition-[grid-template-rows,opacity,margin] duration-200 ease-in-out',
        isExpanded ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      )}
    >
      <div className="overflow-hidden">
        <div className="flex items-center gap-2 flex-wrap rounded-lg bg-secondary px-3 py-2.5">
          {children}
          {hasActiveFilters && (
            <AriaButton
              onPress={onClearAll}
              className="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-2 text-sm text-secondary hover:text-primary transition duration-100 outline-hidden"
            >
              <XClose className="size-3.5" />
              Clear filters
            </AriaButton>
          )}
        </div>
      </div>
    </div>
  );
}
