import { describe, expect, it } from 'bun:test';
import {
  articleSettingsSchema,
  articleSettingsPartialSchema,
  ARTICLE_TARGET_WORD_COUNT_MIN,
  ARTICLE_TARGET_WORD_COUNT_MAX,
  ARTICLE_STYLE_GUIDE_MAX,
  ARTICLE_PAGES_TO_LINK_MAX,
  ARTICLE_TARGET_KEYWORDS_MAX,
  ARTICLE_KEYWORD_MAX,
} from '@/libs/ai/promptArticles/schema';

const validSettings = {
  targetWordCount: 1500,
  styleGuide: 'Write in a friendly, conversational tone.',
  pagesToLink: ['https://example.com/a', 'https://example.com/b'],
  targetKeywords: ['seo', 'content marketing'],
};

describe('articleSettingsPartialSchema regression: field-presence must not clobber omitted fields', () => {
  it('parsing only targetWordCount yields an object with exactly that one key', () => {
    const parsed = articleSettingsPartialSchema.parse({ targetWordCount: 900 });
    expect(Object.keys(parsed)).toEqual(['targetWordCount']);
    expect(parsed.styleGuide).toBeUndefined();
    expect(parsed.pagesToLink).toBeUndefined();
    expect(parsed.targetKeywords).toBeUndefined();
  });

  it('rejects an empty object', () => {
    const parsed = articleSettingsPartialSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });

  it('the full schema still applies its defaults when keys are absent', () => {
    const parsed = articleSettingsSchema.parse({ targetWordCount: 900 });
    expect(parsed.styleGuide).toBe('');
    expect(parsed.pagesToLink).toEqual([]);
    expect(parsed.targetKeywords).toEqual([]);
  });
});

describe('articleSettingsSchema / articleSettingsPartialSchema parity', () => {
  it('both accept the same fully-valid settings', () => {
    expect(articleSettingsSchema.safeParse(validSettings).success).toBe(true);
    expect(articleSettingsPartialSchema.safeParse(validSettings).success).toBe(true);
  });

  const invalidCases: Array<[string, Partial<typeof validSettings>]> = [
    [
      'targetWordCount below min',
      { targetWordCount: ARTICLE_TARGET_WORD_COUNT_MIN - 1 },
    ],
    [
      'targetWordCount above max',
      { targetWordCount: ARTICLE_TARGET_WORD_COUNT_MAX + 1 },
    ],
    [
      'targetWordCount non-integer',
      { targetWordCount: ARTICLE_TARGET_WORD_COUNT_MIN + 0.5 },
    ],
    [
      'styleGuide over max length',
      { styleGuide: 'a'.repeat(ARTICLE_STYLE_GUIDE_MAX + 1) },
    ],
    [
      'pagesToLink with a non-URL entry',
      { pagesToLink: ['not-a-url'] },
    ],
    [
      'pagesToLink over max length',
      {
        pagesToLink: Array.from(
          { length: ARTICLE_PAGES_TO_LINK_MAX + 1 },
          (_, i) => `https://example.com/${i}`
        ),
      },
    ],
    [
      'targetKeywords with an empty string',
      { targetKeywords: [''] },
    ],
    [
      'targetKeywords with an over-long keyword',
      { targetKeywords: ['a'.repeat(ARTICLE_KEYWORD_MAX + 1)] },
    ],
    [
      'targetKeywords over max length',
      {
        targetKeywords: Array.from(
          { length: ARTICLE_TARGET_KEYWORDS_MAX + 1 },
          (_, i) => `keyword-${i}`
        ),
      },
    ],
  ];

  for (const [description, override] of invalidCases) {
    it(`both reject ${description}`, () => {
      const candidate = { ...validSettings, ...override };
      expect(articleSettingsSchema.safeParse(candidate).success).toBe(false);
      expect(articleSettingsPartialSchema.safeParse(candidate).success).toBe(false);
    });
  }
});
