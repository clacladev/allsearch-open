-- Create article_outlines table for persisting AI-generated outlines tied to
-- a prompt + opportunity + author. Each generation inserts a new row; regenerate
-- creates a new row rather than updating.

create table "public"."article_outlines" (
  "id" uuid not null default gen_random_uuid(),
  "project_id" uuid not null,
  "organization_id" uuid not null,
  "author_id" uuid not null,
  "prompt_id" uuid not null,

  -- Opportunity context. opportunity_id is a non-stable synthetic hash from
  -- getOpportunitiesSummary() — stored for provenance only. Stable identity is
  -- (author_id, project_id, prompt_id, opportunity_type, target_source_clean_url).
  "opportunity_id" text,
  "opportunity_type" text not null,
  "target_source_clean_url" text,

  "outline" jsonb not null,
  "article_markdown" text,

  "model_id" text not null,

  "created_at" timestamp with time zone not null default (now() at time zone 'utc'::text),
  "updated_at" timestamp with time zone not null default (now() at time zone 'utc'::text),

  constraint article_outlines_pkey primary key (id),
  constraint article_outlines_project_id_fkey foreign key (project_id) references projects(id) on delete cascade,
  constraint article_outlines_organization_id_fkey foreign key (organization_id) references organizations(id) on delete cascade,
  constraint article_outlines_author_id_fkey foreign key (author_id) references auth.users(id),
  constraint article_outlines_prompt_id_fkey foreign key (prompt_id) references prompts(id) on delete cascade
);

-- Indexes
create index idx_article_outlines_lookup
  on public.article_outlines using btree (
    author_id, project_id, prompt_id, opportunity_type, target_source_clean_url, created_at desc
  );
create index idx_article_outlines_project_id on public.article_outlines using btree (project_id);
create index idx_article_outlines_prompt_id on public.article_outlines using btree (prompt_id);
create index idx_article_outlines_author_id on public.article_outlines using btree (author_id);

-- updated_at trigger (reuse public.update_updated_at from 20260213101900)
create trigger update_article_outlines_updated_at
  before update on public.article_outlines
  for each row execute function public.update_updated_at();

-- RLS
alter table "public"."article_outlines" enable row level security;

-- Read: author only
create policy "Users can read their own article outlines"
  on "public"."article_outlines"
  as permissive
  for select
  to authenticated
  using (author_id = (select auth.uid()));

-- Insert: author_id matches caller + project/prompt/org consistency check
create policy "Users can create article outlines for their projects"
  on "public"."article_outlines"
  as permissive
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.projects p
      where p.id = article_outlines.project_id
        and p.author_id = (select auth.uid())
        and p.organization_id = article_outlines.organization_id
    )
    and exists (
      select 1
      from public.prompts pr
      where pr.id = article_outlines.prompt_id
        and pr.project_id = article_outlines.project_id
    )
  );

-- Update: author only
create policy "Users can update their own article outlines"
  on "public"."article_outlines"
  as permissive
  for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

-- Delete: author only
create policy "Users can delete their own article outlines"
  on "public"."article_outlines"
  as permissive
  for delete
  to authenticated
  using (author_id = (select auth.uid()));

-- Grants
grant delete on table "public"."article_outlines" to "anon";
grant insert on table "public"."article_outlines" to "anon";
grant references on table "public"."article_outlines" to "anon";
grant select on table "public"."article_outlines" to "anon";
grant trigger on table "public"."article_outlines" to "anon";
grant truncate on table "public"."article_outlines" to "anon";
grant update on table "public"."article_outlines" to "anon";

grant delete on table "public"."article_outlines" to "authenticated";
grant insert on table "public"."article_outlines" to "authenticated";
grant references on table "public"."article_outlines" to "authenticated";
grant select on table "public"."article_outlines" to "authenticated";
grant trigger on table "public"."article_outlines" to "authenticated";
grant truncate on table "public"."article_outlines" to "authenticated";
grant update on table "public"."article_outlines" to "authenticated";

grant delete on table "public"."article_outlines" to "service_role";
grant insert on table "public"."article_outlines" to "service_role";
grant references on table "public"."article_outlines" to "service_role";
grant select on table "public"."article_outlines" to "service_role";
grant trigger on table "public"."article_outlines" to "service_role";
grant truncate on table "public"."article_outlines" to "service_role";
grant update on table "public"."article_outlines" to "service_role";

-- Cascade delete: include article_outlines in the project cascade before projects are deleted
create or replace function delete_project_cascade(target_project_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from article_outlines where project_id = target_project_id;
  delete from sources where project_id = target_project_id;
  delete from prompt_responses where project_id = target_project_id;
  delete from prompts where project_id = target_project_id;
  delete from topics where project_id = target_project_id;
  delete from competitors where project_id = target_project_id;
  delete from projects where id = target_project_id;
end;
$$;
