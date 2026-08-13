import { describe, expect, it } from 'bun:test';
import { cn } from '@/libs/utils/cn';

describe('cn', () => {
  it('preserves product display sizes when merging initials classes', () => {
    expect(cn('text-quaternary', 'text-display-xs font-semibold')).toBe(
      'text-quaternary text-display-xs font-semibold'
    );
  });

  it('treats product display sizes as text-size conflicts', () => {
    expect(cn('text-xs', 'text-display-xs')).toBe('text-display-xs');
  });
});
