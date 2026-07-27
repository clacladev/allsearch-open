-- Add article-settings columns to prompt_articles. These are user-supplied
-- inputs that steer outline + article generation:
--   target_word_count: rough length target. Drives outline depth (heading count)
--     and the article's maxOutputTokens budget.
--   style_guide: free-form prose describing voice, vocabulary, structure
--     preferences. Passed verbatim into the article system prompt.
--   pages_to_link: list of URL strings the article should link to internally
--     where natural. Empty array when not provided.
--   target_keywords: list of SEO keywords/phrases the outline + article should
--     naturally cover. Empty array when not provided.
-- All columns are NOT NULL with sensible defaults so existing rows continue to
-- behave (target_word_count defaults to 1500, the soft default in the form).

alter table public.prompt_articles
  add column if not exists target_word_count integer not null default 1500,
  add column if not exists style_guide text,
  add column if not exists pages_to_link jsonb not null default '[]'::jsonb,
  add column if not exists target_keywords jsonb not null default '[]'::jsonb;

alter table public.prompt_articles
  add constraint prompt_articles_target_word_count_range
    check (target_word_count between 300 and 5000);
