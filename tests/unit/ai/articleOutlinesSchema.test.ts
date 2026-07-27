import { describe, expect, it } from 'bun:test';
import {
  PersistedOutlineSchema,
  HEADING_TEXT_MIN,
  HEADING_KEY_POINT_MIN,
  OUTLINE_HEADINGS_MIN,
  OUTLINE_HEADINGS_MAX,
} from '@/libs/ai/promptArticles/schema';
import { ARTICLE_OUTLINE_SCHEMA_VERSION } from '@/libs/database/PromptArticles/types';

const validHeadings = [
  { tag: 'h1' as const, text: 'A Real Title', keyPoint: 'Introduce the topic clearly.' },
  { tag: 'h2' as const, text: 'Section One', keyPoint: 'Cover the basic ideas in detail.' },
  { tag: 'h2' as const, text: 'Wrap Up', keyPoint: 'Summarize the takeaways for the reader.' },
];

describe('PersistedOutlineSchema', () => {
  it('accepts a valid outline', () => {
    const parsed = PersistedOutlineSchema.safeParse({
      version: ARTICLE_OUTLINE_SCHEMA_VERSION,
      headings: validHeadings,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a missing version', () => {
    const parsed = PersistedOutlineSchema.safeParse({ headings: validHeadings });
    expect(parsed.success).toBe(false);
  });

  it('rejects a wrong version literal', () => {
    const parsed = PersistedOutlineSchema.safeParse({ version: 2, headings: validHeadings });
    expect(parsed.success).toBe(false);
  });

  it(`rejects fewer than ${OUTLINE_HEADINGS_MIN} headings`, () => {
    const parsed = PersistedOutlineSchema.safeParse({
      version: ARTICLE_OUTLINE_SCHEMA_VERSION,
      headings: validHeadings.slice(0, 2),
    });
    expect(parsed.success).toBe(false);
  });

  it(`rejects more than ${OUTLINE_HEADINGS_MAX} headings`, () => {
    const tooMany = Array.from({ length: OUTLINE_HEADINGS_MAX + 1 }, () => validHeadings[1]);
    const parsed = PersistedOutlineSchema.safeParse({
      version: ARTICLE_OUTLINE_SCHEMA_VERSION,
      headings: tooMany,
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects two h1 headings', () => {
    const parsed = PersistedOutlineSchema.safeParse({
      version: ARTICLE_OUTLINE_SCHEMA_VERSION,
      headings: [
        { tag: 'h1' as const, text: 'Title A', keyPoint: 'Introduce A clearly here.' },
        { tag: 'h1' as const, text: 'Title B', keyPoint: 'Introduce B clearly here.' },
        { tag: 'h2' as const, text: 'Section', keyPoint: 'Cover the basic ideas.' },
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts a single h1', () => {
    const parsed = PersistedOutlineSchema.safeParse({
      version: ARTICLE_OUTLINE_SCHEMA_VERSION,
      headings: validHeadings,
    });
    expect(parsed.success).toBe(true);
  });

  it(`rejects heading text shorter than ${HEADING_TEXT_MIN}`, () => {
    const parsed = PersistedOutlineSchema.safeParse({
      version: ARTICLE_OUTLINE_SCHEMA_VERSION,
      headings: [
        { ...validHeadings[0], text: 'A' },
        validHeadings[1],
        validHeadings[2],
      ],
    });
    expect(parsed.success).toBe(false);
  });

  it(`rejects keyPoint shorter than ${HEADING_KEY_POINT_MIN}`, () => {
    const parsed = PersistedOutlineSchema.safeParse({
      version: ARTICLE_OUTLINE_SCHEMA_VERSION,
      headings: [
        { ...validHeadings[0], keyPoint: 'short' },
        validHeadings[1],
        validHeadings[2],
      ],
    });
    expect(parsed.success).toBe(false);
  });
});
