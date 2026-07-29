import z from 'zod';
import { ARTICLE_OUTLINE_SCHEMA_VERSION } from '@/libs/database/PromptArticles/types';

export const HEADING_TEXT_MIN = 3;
export const HEADING_TEXT_MAX = 120;
export const HEADING_KEY_POINT_MIN = 10;
export const HEADING_KEY_POINT_MAX = 300;
export const OUTLINE_HEADINGS_MIN = 3;
export const OUTLINE_HEADINGS_MAX = 20;

export const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

const HeadingTagSchema = z
  .enum(HEADING_TAGS)
  .describe('The HTML heading level (h1-h6) that represents the structural depth.');

export const HeadingSchema = z.object({
  tag: HeadingTagSchema,
  text: z
    .string()
    .min(HEADING_TEXT_MIN)
    .max(HEADING_TEXT_MAX)
    .describe('The heading text. 3-120 characters, title-cased or sentence-cased as appropriate.'),
  keyPoint: z
    .string()
    .min(HEADING_KEY_POINT_MIN)
    .max(HEADING_KEY_POINT_MAX)
    .describe(
      'One sentence (10-300 chars) describing what the writer should cover under this heading. Action-oriented. No fluff.'
    ),
});

const HeadingsArraySchema = z
  .array(HeadingSchema)
  .min(OUTLINE_HEADINGS_MIN)
  .max(OUTLINE_HEADINGS_MAX)
  .refine((headings) => headings.filter((h) => h.tag === 'h1').length <= 1, {
    message: 'At most one h1 heading is allowed in the outline.',
  });

export const OutlineGenerationSchema = z.object({
  headings: HeadingsArraySchema.describe('Ordered list of 3-20 headings forming the article outline.'),
});

export type OutlineGenerationResult = z.infer<typeof OutlineGenerationSchema>;

/**
 * Schema for outlines as persisted in the `outline` / `user_edited_outline`
 * columns of the `prompt_articles` table. Used by both the PATCH route's
 * body parser and the client-side validity gate for autosave. Wraps the
 * heading list with an explicit version literal so future schema migrations
 * can fork on `version`.
 */
export const PersistedOutlineSchema = z.object({
  version: z.literal(ARTICLE_OUTLINE_SCHEMA_VERSION),
  headings: HeadingsArraySchema,
});

export type PersistedOutline = z.infer<typeof PersistedOutlineSchema>;

export function toPersistedOutline(
  result: OutlineGenerationResult
): { version: typeof ARTICLE_OUTLINE_SCHEMA_VERSION; headings: OutlineGenerationResult['headings'] } {
  return {
    version: ARTICLE_OUTLINE_SCHEMA_VERSION,
    headings: result.headings,
  };
}

// User-controlled article settings. Persisted on the prompt_articles row and
// passed into both the outline and article LLM prompts so the user steers
// quality on the first try. Keep range checks in sync with the DB check
// constraint on prompt_articles.target_word_count.
export const ARTICLE_TARGET_WORD_COUNT_MIN = 300;
export const ARTICLE_TARGET_WORD_COUNT_MAX = 5000;
export const ARTICLE_TARGET_WORD_COUNT_DEFAULT = 1500;
export const ARTICLE_STYLE_GUIDE_MAX = 2000;
export const ARTICLE_PAGES_TO_LINK_MAX = 20;
export const ARTICLE_TARGET_KEYWORDS_MAX = 30;
export const ARTICLE_KEYWORD_MAX = 100;

export const ARTICLE_SETTINGS_DEFAULTS = {
  targetWordCount: ARTICLE_TARGET_WORD_COUNT_DEFAULT,
  styleGuide: '',
  pagesToLink: [] as string[],
  targetKeywords: [] as string[],
};

export const articleSettingsSchema = z.object({
  targetWordCount: z
    .number()
    .int()
    .min(ARTICLE_TARGET_WORD_COUNT_MIN)
    .max(ARTICLE_TARGET_WORD_COUNT_MAX),
  // Empty string normalizes to null on persistence. We accept '' from the form
  // so the field is always controlled.
  styleGuide: z.string().max(ARTICLE_STYLE_GUIDE_MAX).default(''),
  pagesToLink: z.array(z.url()).max(ARTICLE_PAGES_TO_LINK_MAX).default([]),
  targetKeywords: z
    .array(z.string().min(1).max(ARTICLE_KEYWORD_MAX))
    .max(ARTICLE_TARGET_KEYWORDS_MAX)
    .default([]),
});

export type ArticleSettings = z.infer<typeof articleSettingsSchema>;

// Not derived from `articleSettingsSchema.partial()`: zod applies `.default()` to a field even
// when its key is absent from the input, regardless of `.partial()`, so that approach silently
// fills in styleGuide/pagesToLink/targetKeywords for every patch that omits them, clobbering the
// existing row's values instead of leaving them untouched. Redeclaring without `.default()` keeps
// genuinely-omitted fields `undefined`, which is what the route's field-presence checks require.
export const articleSettingsPartialSchema = z
  .object({
    targetWordCount: z
      .number()
      .int()
      .min(ARTICLE_TARGET_WORD_COUNT_MIN)
      .max(ARTICLE_TARGET_WORD_COUNT_MAX)
      .optional(),
    styleGuide: z.string().max(ARTICLE_STYLE_GUIDE_MAX).optional(),
    pagesToLink: z.array(z.url()).max(ARTICLE_PAGES_TO_LINK_MAX).optional(),
    targetKeywords: z
      .array(z.string().min(1).max(ARTICLE_KEYWORD_MAX))
      .max(ARTICLE_TARGET_KEYWORDS_MAX)
      .optional(),
  })
  .refine((settings) => Object.keys(settings).length > 0, {
    message: 'settings must include at least one field to update',
  });
export type ArticleSettingsPartial = z.infer<typeof articleSettingsPartialSchema>;
