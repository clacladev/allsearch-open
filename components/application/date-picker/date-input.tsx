'use client';

import type { DateInputProps as AriaDateInputProps } from 'react-aria-components';
import { DateInput as AriaDateInput, DateSegment as AriaDateSegment } from 'react-aria-components';
import { cx } from '@/utils/cx';

interface DateInputProps extends Omit<AriaDateInputProps, 'children'> {}

export const DateInput = (props: DateInputProps) => {
  return (
    <AriaDateInput
      {...props}
      className={cx(
        'bg-primary text-md ring-primary focus-within:ring-brand flex rounded-lg px-2.5 py-2 shadow-xs ring-1 ring-inset focus-within:ring-2',
        typeof props.className === 'string' && props.className
      )}
    >
      {(segment) => (
        <AriaDateSegment
          segment={segment}
          className={cx(
            'text-primary focus:bg-brand-solid rounded px-0.5 tabular-nums caret-transparent focus:font-medium focus:text-white focus:outline-hidden',
            // The placeholder segment.
            segment.isPlaceholder && 'text-placeholder uppercase',
            // The separator "/" segment.
            segment.type === 'literal' && 'text-fg-quaternary'
          )}
        />
      )}
    </AriaDateInput>
  );
};
