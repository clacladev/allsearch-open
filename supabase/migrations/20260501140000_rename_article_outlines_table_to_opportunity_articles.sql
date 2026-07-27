-- Rename article_outlines → opportunity_articles. The original name
-- emphasized one early stage of a row's lifecycle (the outline). Each row now
-- carries the outline + the generated article markdown + user edits, all
-- scoped to a single opportunity. opportunity_articles describes the entity.
--
-- Postgres does not auto-rename indexes / FK constraints / the implicit pkey
-- when a table is renamed, so we rename them explicitly to keep the schema
-- consistent (otherwise psql \d still shows article_outlines_pkey, etc).

alter table public.article_outlines
  rename to opportunity_articles;

alter index if exists public.article_outlines_pkey
  rename to opportunity_articles_pkey;
alter index if exists public.idx_article_outlines_author_id
  rename to idx_opportunity_articles_author_id;
alter index if exists public.idx_article_outlines_project_id
  rename to idx_opportunity_articles_project_id;
alter index if exists public.idx_article_outlines_prompt_id
  rename to idx_opportunity_articles_prompt_id;
alter index if exists public.idx_article_outlines_lookup
  rename to idx_opportunity_articles_lookup;

alter table public.opportunity_articles
  rename constraint article_outlines_author_id_fkey to opportunity_articles_author_id_fkey;
alter table public.opportunity_articles
  rename constraint article_outlines_organization_id_fkey to opportunity_articles_organization_id_fkey;
alter table public.opportunity_articles
  rename constraint article_outlines_project_id_fkey to opportunity_articles_project_id_fkey;
alter table public.opportunity_articles
  rename constraint article_outlines_prompt_id_fkey to opportunity_articles_prompt_id_fkey;

alter trigger update_article_outlines_updated_at on public.opportunity_articles
  rename to update_opportunity_articles_updated_at;

alter policy "Users can create article outlines for their projects"
  on public.opportunity_articles
  rename to "Users can create opportunity articles for their projects";
alter policy "Users can delete their own article outlines"
  on public.opportunity_articles
  rename to "Users can delete their own opportunity articles";
alter policy "Users can read their own article outlines"
  on public.opportunity_articles
  rename to "Users can read their own opportunity articles";
alter policy "Users can update their own article outlines"
  on public.opportunity_articles
  rename to "Users can update their own opportunity articles";
