import { describe, expect, it } from 'bun:test';
import { isHeadingEdited } from '@/libs/utils/articleOutlineDiff';

const baseHeading = {
  tag: 'h2' as const,
  text: 'A heading',
  keyPoint: 'A key point worth covering.',
};

describe('isHeadingEdited', () => {
  it('returns false when text, tag, and keyPoint match', () => {
    expect(isHeadingEdited({ ...baseHeading }, { ...baseHeading })).toBe(false);
  });

  it('returns true when text differs', () => {
    expect(
      isHeadingEdited({ ...baseHeading, text: 'Different heading' }, baseHeading)
    ).toBe(true);
  });

  it('returns true when keyPoint differs', () => {
    expect(
      isHeadingEdited({ ...baseHeading, keyPoint: 'Different key point text.' }, baseHeading)
    ).toBe(true);
  });

  it('returns true when tag differs', () => {
    expect(isHeadingEdited({ ...baseHeading, tag: 'h3' }, baseHeading)).toBe(true);
  });

  it('returns true when there is no matching original (newly added row)', () => {
    expect(isHeadingEdited(baseHeading, undefined)).toBe(true);
  });
});
