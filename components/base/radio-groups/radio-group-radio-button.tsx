'use client';

import type { RadioGroupProps } from 'react-aria-components';
import {
  Label as AriaLabel,
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  Text as AriaText,
} from 'react-aria-components';
import { cx } from '@/utils/cx';

export type RadioGroupItemType = {
  value: string;
  title: string;
  disabled?: boolean;
  description?: string;
  secondaryTitle?: string;
};

interface RadioGroupRadioButtonProps extends RadioGroupProps {
  size?: 'sm' | 'md';
  items: RadioGroupItemType[];
}

export const RadioGroupRadioButton = ({
  items,
  size = 'sm',
  className,
  ...props
}: RadioGroupRadioButtonProps) => {
  return (
    <AriaRadioGroup
      {...props}
      className={(state) =>
        cx('flex flex-col gap-3', typeof className === 'function' ? className(state) : className)
      }
    >
      {items.map((plan) => (
        <AriaRadio
          isDisabled={plan.disabled}
          key={plan.value}
          value={plan.value}
          className={({ isDisabled, isSelected, isFocusVisible }) =>
            cx(
              'bg-primary outline-focus-ring relative flex cursor-pointer rounded-xl p-4 ring-inset',
              size === 'md' ? 'gap-3' : 'gap-2',
              isSelected ? 'ring-brand ring-2' : 'ring-secondary ring-1',
              isDisabled && 'opacity-50  cursor-not-allowed',
              isFocusVisible && 'outline-2 outline-offset-2'
            )
          }
        >
          {({ isSelected, isDisabled, isFocusVisible }) => (
            <>
              <div
                className={cx(
                  'relative mt-0.5 inline-flex shrink-0 items-center justify-center rounded-full ring-inset',
                  size === 'md' ? 'size-5' : 'size-4',
                  isSelected ? 'bg-brand-solid' : 'ring-primary ring-1',
                  isDisabled && 'opacity-50  ring-1',
                  isFocusVisible && 'outline-focus-ring outline-2 outline-offset-2'
                )}
              >
                <div
                  className={cx(
                    'bg-fg-white absolute rounded-full opacity-0',
                    size === 'md' ? 'size-2' : 'size-1.5',
                    isSelected ? 'opacity-100' : 'opacity-0',
                    isDisabled && 'bg-fg-disabled_subtle'
                  )}
                />
              </div>

              <div className={cx('flex flex-col', size === 'md' ? 'gap-0.5' : '')}>
                <AriaLabel
                  className={cx('pointer-events-none flex', size === 'md' ? 'gap-1.5' : 'gap-1')}
                >
                  <span
                    className={cx(
                      'text-secondary text-sm font-medium',
                      size === 'md' ? 'text-md font-medium' : 'text-sm font-medium'
                    )}
                  >
                    {plan.title}
                  </span>
                  <span className={cx('text-tertiary', size === 'md' ? 'text-md' : 'text-sm')}>
                    {plan.secondaryTitle}
                  </span>
                </AriaLabel>
                <AriaText
                  slot="description"
                  className={cx('text-tertiary text-sm', size === 'md' ? 'text-md' : 'text-sm')}
                >
                  {plan.description}
                </AriaText>
              </div>
            </>
          )}
        </AriaRadio>
      ))}
    </AriaRadioGroup>
  );
};
