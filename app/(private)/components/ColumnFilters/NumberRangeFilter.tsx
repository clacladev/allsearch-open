'use client';

import { useState } from 'react';
import {
  DialogTrigger,
  Button as AriaButton,
  Popover as AriaPopover,
} from 'react-aria-components';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/utils/cx';

interface NumberRangeFilterProps {
  label: string;
  min: number | undefined;
  max: number | undefined;
  onChange: (min: number | undefined, max: number | undefined) => void;
  unit?: string;
}

export function NumberRangeFilter({ label, min, max, onChange, unit }: NumberRangeFilterProps) {
  const [minInput, setMinInput] = useState(min !== undefined ? String(min) : '');
  const [maxInput, setMaxInput] = useState(max !== undefined ? String(max) : '');
  const [isOpen, setIsOpen] = useState(false);
  const isActive = min !== undefined || max !== undefined;

  const displayValue = isActive
    ? [
        min !== undefined ? `${min}${unit ?? ''}` : '',
        max !== undefined ? `${max}${unit ?? ''}` : '',
      ]
        .filter(Boolean)
        .join(' – ')
    : 'All';

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setMinInput(min !== undefined ? String(min) : '');
      setMaxInput(max !== undefined ? String(max) : '');
    }
  };

  const apply = () => {
    const newMin = minInput.trim() ? Number(minInput.trim()) : undefined;
    const newMax = maxInput.trim() ? Number(maxInput.trim()) : undefined;
    onChange(
      newMin !== undefined && !isNaN(newMin) ? newMin : undefined,
      newMax !== undefined && !isNaN(newMax) ? newMax : undefined
    );
    setIsOpen(false);
  };

  const clear = () => {
    setMinInput('');
    setMaxInput('');
    onChange(undefined, undefined);
    setIsOpen(false);
  };

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
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
            {displayValue}
          </span>
          <ChevronDown className="text-fg-quaternary size-4 shrink-0" />
        </AriaButton>
        {isActive && (
          <span aria-hidden="true" className="absolute -top-1 -right-1 size-2 rounded-full bg-amber-500" />
        )}
      </div>

      <AriaPopover
        placement="bottom start"
        offset={4}
        className={({ isEntering, isExiting }) =>
          cx(
            'w-56 rounded-lg bg-primary p-3 shadow-lg ring-1 ring-secondary_alt outline-hidden will-change-transform',
            isEntering &&
              'duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5',
            isExiting &&
              'duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5'
          )
        }
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-tertiary mb-1 block text-xs">Min{unit ? ` (${unit})` : ''}</label>
              <input
                type="number"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && apply()}
                placeholder="Min"
                className="ring-primary w-full rounded-md px-2 py-1.5 text-sm ring-1 outline-hidden focus:ring-brand ring-inset bg-primary text-primary placeholder:text-placeholder"
              />
            </div>
            <div className="text-tertiary mt-5 text-xs">–</div>
            <div className="flex-1">
              <label className="text-tertiary mb-1 block text-xs">Max{unit ? ` (${unit})` : ''}</label>
              <input
                type="number"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && apply()}
                placeholder="Max"
                className="ring-primary w-full rounded-md px-2 py-1.5 text-sm ring-1 outline-hidden focus:ring-brand ring-inset bg-primary text-primary placeholder:text-placeholder"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <AriaButton
              onPress={apply}
              className="bg-brand-solid text-white flex-1 rounded-md px-3 py-1.5 text-sm font-medium cursor-pointer outline-hidden hover:bg-brand-solid_hover transition duration-100"
            >
              Apply
            </AriaButton>
            {isActive && (
              <AriaButton
                onPress={clear}
                className="ring-secondary text-secondary flex-1 rounded-md px-3 py-1.5 text-sm cursor-pointer ring-1 ring-inset outline-hidden hover:bg-primary_hover transition duration-100"
              >
                Clear
              </AriaButton>
            )}
          </div>
        </div>
      </AriaPopover>
    </DialogTrigger>
  );
}
