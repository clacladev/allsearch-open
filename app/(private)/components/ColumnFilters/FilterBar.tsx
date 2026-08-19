'use client';

import type { ReactNode } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { Filter, X } from 'lucide-react';
import { cn } from '@/libs/utils/cn';
import { Button } from '@/components/ui/button';

interface FilterToggleProps {
  isExpanded: boolean;
  onToggle: () => void;
  hasActiveFilters: boolean;
}

export function FilterToggle({ isExpanded, onToggle, hasActiveFilters }: FilterToggleProps) {
  return (
    <div className="relative">
      <Button variant="outline" size="sm" aria-expanded={isExpanded} onClick={onToggle}>
        <Filter className="size-4" />
        Filters
      </Button>
      {hasActiveFilters && (
        <span aria-hidden="true" className="absolute -top-1 -right-1 size-2 rounded-full bg-amber-500" />
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
      className={cn(
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
              <X className="size-3.5" />
              Clear filters
            </AriaButton>
          )}
        </div>
      </div>
    </div>
  );
}
