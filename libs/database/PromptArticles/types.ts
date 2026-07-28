import { promptArticles } from '../schema';

export const ARTICLE_OUTLINE_SCHEMA_VERSION = 1 as const;

export type ArticleOutlineHeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type ArticleOutlineHeading = {
  tag: ArticleOutlineHeadingTag;
  text: string;
  keyPoint: string;
};

export type ArticleOutline = {
  version: typeof ARTICLE_OUTLINE_SCHEMA_VERSION;
  headings: ArticleOutlineHeading[];
};

/** Snapshot of competitor sources passed to the LLM at article-generation time.
 * Persisted in `sources_used` so the citations panel can show the sources the
 * article was actually generated against, even if the underlying source ranks
 * have shifted by the time someone views it. */
export type ArticleSourceSnapshot = {
  title: string;
  cleanUrl: string;
  description?: string;
};

export type ArticleSourcesUsed = {
  sources: ArticleSourceSnapshot[];
};

/**
 * Column-level documentation for `prompt_articles` (see `schema.ts`), preserved
 * here because it explains the AI-vs-user-edit distinction that the plain
 * inferred type below can't carry:
 *
 * - `outline`: Original AI-generated outline. Treat as immutable — restore-from-AI source.
 * - `user_edited_outline`: User-modified outline. Null when the user has accepted the AI
 *   version as-is or has explicitly restored from the original. Mirrors `outline`'s shape.
 * - `article_markdown`: AI-generated article in markdown. Set on every generate/regenerate by
 *   the onFinish persistence path. Null until first successful generation.
 * - `user_edited_article_markdown`: User's edits to the article. Null when the user has
 *   accepted the AI version or has restored. Display rule:
 *   `user_edited_article_markdown ?? article_markdown`.
 * - `sources_used`: Snapshot of the sources passed to the LLM at generation time. Powers the
 *   citations panel without re-deriving from current opportunity state.
 * - `outline_used`: Snapshot of the outline (`user_edited_outline ?? outline`) used to drive
 *   generation. Lets us audit later: was this article produced from the current outline, or
 *   from an earlier version the user has since edited?
 * - `article_model_id`: AI Gateway model id used to generate `article_markdown`. Null until the
 *   first successful article generation.
 * - `outline_model_id`: AI Gateway model id used to generate `outline`. Always set on insert.
 * - `target_word_count`: User-supplied target article length. Steers outline depth + article
 *   token budget. NOT NULL with default 1500; range enforced by app + check constraint.
 * - `style_guide`: User-supplied free-form style/voice instructions. Passed verbatim into the
 *   article system prompt. Null when the user hasn't entered anything.
 * - `pages_to_link`: URL strings the article should link to internally where natural. Default [].
 * - `target_keywords`: SEO keywords/phrases the outline + article should naturally cover.
 *   Default [].
 */
export type PromptArticleRow = typeof promptArticles.$inferSelect;
