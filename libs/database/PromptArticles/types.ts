export const TABLE_PROMPT_ARTICLES = 'prompt_articles';

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

export type PromptArticleRow = {
  id: string;
  project_id: string;
  organization_id: string;
  author_id: string;
  prompt_id: string;
  opportunity_id: string | null;
  opportunity_type: string;
  target_source_clean_url: string | null;
  /** Original AI-generated outline. Treat as immutable — restore-from-AI source. */
  outline: ArticleOutline;
  /** User-modified outline. Null when the user has accepted the AI version as-is
   * or has explicitly restored from the original. Mirrors `outline`'s shape. */
  user_edited_outline: ArticleOutline | null;
  /** AI-generated article in markdown. Set on every generate/regenerate by the
   * onFinish persistence path. Null until first successful generation. */
  article_markdown: string | null;
  /** User's edits to the article. Null when the user has accepted the AI version
   * or has restored. Display rule: `user_edited_article_markdown ?? article_markdown`. */
  user_edited_article_markdown: string | null;
  /** Snapshot of the sources passed to the LLM at generation time. Powers the
   * citations panel without re-deriving from current opportunity state. */
  sources_used: ArticleSourcesUsed | null;
  /** Snapshot of the outline (user_edited_outline ?? outline) used to drive
   * generation. Lets us audit later: was this article produced from the current
   * outline, or from an earlier version the user has since edited? */
  outline_used: ArticleOutline | null;
  /** AI Gateway model id used to generate `article_markdown`. Null until the
   * first successful article generation. */
  article_model_id: string | null;
  /** AI Gateway model id used to generate `outline`. Always set on insert. */
  outline_model_id: string;
  /** User-supplied target article length. Steers outline depth + article token
   * budget. NOT NULL with default 1500; range enforced by app + check constraint. */
  target_word_count: number;
  /** User-supplied free-form style/voice instructions. Passed verbatim into the
   * article system prompt. Null when the user hasn't entered anything. */
  style_guide: string | null;
  /** URL strings the article should link to internally where natural. Default []. */
  pages_to_link: string[];
  /** SEO keywords/phrases the outline + article should naturally cover. Default []. */
  target_keywords: string[];
  created_at: string;
  updated_at: string;
};
