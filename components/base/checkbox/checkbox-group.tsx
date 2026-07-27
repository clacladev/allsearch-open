'use client';

import type { CheckboxGroupProps as AriaCheckboxGroupProps } from 'react-aria-components';
import {
  Label as AriaLabel,
  Checkbox as AriaCheckbox,
  CheckboxGroup as AriaCheckboxGroup,
  Text as AriaText,
} from 'react-aria-components';
import { CheckboxBase } from '@/components/base/checkbox/checkbox';
import { cx } from '@/utils/cx';
import { RadioGroupItemType } from '../radio-groups/radio-group-radio-button';

interface CheckboxGroupProps extends Omit<AriaCheckboxGroupProps, 'children'> {
  size?: 'sm' | 'md';
  items: RadioGroupItemType[];
}

export const CheckboxGroup = ({ items, size = 'sm', className, ...props }: CheckboxGroupProps) => {
  return (
    <AriaCheckboxGroup
      {...props}
      className={(state) =>
        cx('flex flex-col gap-3', typeof className === 'function' ? className(state) : className)
      }
    >
      {items.map((plan) => (
        <AriaCheckbox
          isDisabled={plan.disabled}
          key={plan.value}
          value={plan.value}
          className={({ isDisabled, isFocusVisible, isSelected }) =>
            cx(
              'bg-primary outline-focus-ring relative flex cursor-pointer items-start gap-1 rounded-xl p-4 ring-inset',
              size === 'md' ? 'gap-3' : 'gap-2',
              isSelected ? 'ring-brand ring-2' : 'ring-secondary ring-1',
              isDisabled && 'opacity-50  cursor-not-allowed',
              isFocusVisible && 'outline-2 outline-offset-2'
            )
          }
        >
          {({ isDisabled, isSelected, isFocusVisible }) => (
            <>
              <CheckboxBase
                size={size === 'md' ? 'md' : 'sm'}
                isDisabled={isDisabled}
                isSelected={isSelected}
                isFocusVisible={isFocusVisible}
                className="mt-0.5"
              />

              <div className={cx('flex flex-col', size === 'md' ? 'gap-0.5' : '')}>
                <AriaLabel
                  className={cx('pointer-events-none flex', size === 'md' ? 'gap-1.5' : 'gap-1')}
                >
                  <span
                    className={cx(
                      'text-secondary',
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
                  className={cx('text-tertiary', size === 'md' ? 'text-md' : 'text-sm')}
                >
                  {plan.description}
                </AriaText>
              </div>
            </>
          )}
        </AriaCheckbox>
      ))}
    </AriaCheckboxGroup>
  );
};
