'use client';

import { useState } from 'react';
import {
  DialogTrigger,
  Button as AriaButton,
  Popover as AriaPopover,
} from 'react-aria-components';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/libs/utils/cn';

interface TextFilterProps {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

export function TextFilter({ label, value, onChange, placeholder }: TextFilterProps) {
  const [inputValue, setInputValue] = useState(value ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const isActive = !!value;

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setInputValue(value ?? '');
    }
  };

  const apply = () => {
    onChange(inputValue.trim() || undefined);
    setIsOpen(false);
  };

  const clear = () => {
    setInputValue('');
    onChange(undefined);
    setIsOpen(false);
  };

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <div className="relative">
        <AriaButton
          className={({ isFocusVisible }) =>
            cn(
              'bg-primary ring-primary flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-sm shadow-xs ring-1 outline-hidden transition duration-100 ring-inset',
              isFocusVisible && 'ring-brand ring-2',
              isActive ? 'text-primary' : 'text-secondary'
            )
          }
        >
          <span>{label}</span>
          {isActive && <span className="text-brand-secondary truncate max-w-24 text-xs">{value}</span>}
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
          cn(
            'w-64 rounded-lg bg-primary p-3 shadow-lg ring-1 ring-secondary_alt outline-hidden will-change-transform',
            isEntering &&
              'duration-150 ease-out animate-in fade-in data-[placement=bottom]:slide-in-from-top-0.5',
            isExiting &&
              'duration-100 ease-in animate-out fade-out data-[placement=bottom]:slide-out-to-top-0.5'
          )
        }
      >
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') apply();
            }}
            placeholder={placeholder ?? `Filter by ${label.toLowerCase()}...`}
            autoFocus
            className="ring-primary w-full rounded-md px-3 py-1.5 text-sm ring-1 outline-hidden focus:ring-brand ring-inset bg-primary text-primary placeholder:text-placeholder"
          />
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
