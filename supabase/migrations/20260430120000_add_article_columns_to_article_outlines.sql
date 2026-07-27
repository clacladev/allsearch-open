-- Add article-generation columns to article_outlines:
--   user_edited_article_markdown: user's edits to the AI-generated article (NULL when accepting AI version)
--   sources_used: snapshot of competitor sources passed to the LLM at generation time
--   outline_used: snapshot of the outline (user-edited or AI) that drove the article
--   article_model_id: AI Gateway model id used to generate article_markdown
--     (counterpart to model_id, renamed to outline_model_id in a follow-up migration)
-- All four columns are populated atomically by setArticleGeneratedFromStream() during onFinish.
-- Snapshots make articles auditable forever, even if the underlying outline, sources, or model change later.

alter table public.article_outlines
  add column if not exists user_edited_article_markdown text,
  add column if not exists sources_used jsonb,
  add column if not exists outline_used jsonb,
  add column if not exists article_model_id text;
