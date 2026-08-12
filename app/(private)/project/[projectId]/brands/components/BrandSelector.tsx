'use client';

import { useState } from 'react';
import type { Selection } from 'react-aria-components';
import {
  DialogTrigger,
  Button as AriaButton,
  Popover as AriaPopover,
  ListBox,
  ListBoxItem,
} from 'react-aria-components';
import { Favicon } from '@/app/(private)/components/Favicon';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { cx } from '@/utils/cx';

export type BrandOption = {
  id: string;
  label: string;
  iconUrl?: string;
  sourcesCount?: number;
};

interface BrandSelectorProps {
  availableBrands: BrandOption[];
  selectedBrandIds: string[];
  onSelectionChange: (brandIds: string[]) => void;
  placeholder?: string;
}

export function BrandSelector({
  availableBrands,
  selectedBrandIds,
  onSelectionChange,
  placeholder = 'Select brands...',
}: BrandSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const firstSelected = availableBrands.find((b) => selectedBrandIds.includes(b.id));
  const additionalCount = selectedBrandIds.length - 1;

  const handleSelectionChange = (keys: Selection) => {
    if (keys === 'all') return;
    setIsOpen(false);
    onSelectionChange(Array.from(keys as Set<string>));
  };

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setIsOpen}>
      <AriaButton
        className={({ isFocusVisible }) =>
          cx(
            'bg-primary ring-primary relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 shadow-xs ring-1 outline-hidden transition duration-100 ring-inset',
            isFocusVisible && 'ring-brand ring-2'
          )
        }
      >
        {firstSelected ? (
          <Favicon
            url={firstSelected.iconUrl}
            alt={firstSelected.label}
            brandId={firstSelected.id}
            className="size-5 shrink-0 rounded-md"
          />
        ) : (
          <Building2 className="text-fg-quaternary size-4 shrink-0" />
        )}
        <span
          className={cx(
            'flex-1 truncate text-left text-sm',
            firstSelected ? 'text-primary' : 'text-placeholder'
          )}
        >
          {firstSelected
            ? `${firstSelected.label}${additionalCount > 0 ? ` +${additionalCount}` : ''}`
            : placeholder}
        </span>
        <ChevronDown className="text-fg-quaternary size-4 shrink-0" />
      </AriaButton>

      <AriaPopover
        placement="bottom start"
        offset={4}
        className={({ isEntering, isExiting }) =>
          cx(
            'w-(--trigger-width) max-h-64 overflow-y-auto rounded-lg bg-primary py-1 shadow-lg ring-1 ring-secondary_alt outline-hidden will-change-transform',
            isEntering &&
              'duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5',
            isExiting &&
              'duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5'
          )
        }
      >
        <ListBox
          selectionMode="multiple"
          selectedKeys={new Set(selectedBrandIds)}
          onSelectionChange={handleSelectionChange}
          items={availableBrands}
          className="outline-hidden"
          aria-label="Select brands"
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
                  <Favicon
                    url={item.iconUrl}
                    alt={item.label}
                    brandId={item.id}
                    className="size-6 shrink-0 rounded-md"
                  />
                  <span className="text-primary flex-1 truncate text-sm">{item.label}</span>
                  {item.sourcesCount !== undefined && (
                    <span className="text-tertiary shrink-0 text-xs">{item.sourcesCount}</span>
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
