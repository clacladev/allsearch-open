-- Rename opportunity_articles → prompt_articles. Each row is always tied to a
-- prompt_id, while opportunity_id is optional (nullable provenance hash).
-- "prompt article" reflects the only invariant relation; the row's link to an
-- opportunity is captured by the existing opportunity_id / opportunity_type /
-- target_source_clean_url columns, which stay as-is.
--
-- Postgres does not auto-rename indexes / FK constraints / the implicit pkey
-- when a table is renamed, so we rename them explicitly to keep the schema
-- consistent (otherwise psql \d still shows opportunity_articles_pkey, etc).

alter table public.opportunity_articles
  rename to prompt_articles;

alter index if exists public.opportunity_articles_pkey
  rename to prompt_articles_pkey;
alter index if exists public.idx_opportunity_articles_author_id
  rename to idx_prompt_articles_author_id;
alter index if exists public.idx_opportunity_articles_project_id
  rename to idx_prompt_articles_project_id;
alter index if exists public.idx_opportunity_articles_prompt_id
  rename to idx_prompt_articles_prompt_id;
alter index if exists public.idx_opportunity_articles_lookup
  rename to idx_prompt_articles_lookup;

alter table public.prompt_articles
  rename constraint opportunity_articles_author_id_fkey to prompt_articles_author_id_fkey;
alter table public.prompt_articles
  rename constraint opportunity_articles_organization_id_fkey to prompt_articles_organization_id_fkey;
alter table public.prompt_articles
  rename constraint opportunity_articles_project_id_fkey to prompt_articles_project_id_fkey;
alter table public.prompt_articles
  rename constraint opportunity_articles_prompt_id_fkey to prompt_articles_prompt_id_fkey;

alter trigger update_opportunity_articles_updated_at on public.prompt_articles
  rename to update_prompt_articles_updated_at;

alter policy "Users can create opportunity articles for their projects"
  on public.prompt_articles
  rename to "Users can create prompt articles for their projects";
alter policy "Users can delete their own opportunity articles"
  on public.prompt_articles
  rename to "Users can delete their own prompt articles";
alter policy "Users can read their own opportunity articles"
  on public.prompt_articles
  rename to "Users can read their own prompt articles";
alter policy "Users can update their own opportunity articles"
  on public.prompt_articles
  rename to "Users can update their own prompt articles";

-- delete_project_cascade still references the old article_outlines name from
-- when the function was last redefined. Update it to the current table name
-- so a project deletion does not error on a missing relation.
create or replace function delete_project_cascade(target_project_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from prompt_articles where project_id = target_project_id;
  delete from sources where project_id = target_project_id;
  delete from prompt_responses where project_id = target_project_id;
  delete from prompts where project_id = target_project_id;
  delete from topics where project_id = target_project_id;
  delete from competitors where project_id = target_project_id;
  delete from projects where id = target_project_id;
end;
$$;
