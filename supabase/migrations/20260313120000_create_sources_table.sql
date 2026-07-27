-- Create normalized sources table to replace the JSONB sources column on prompt_responses.
-- Each row represents one source appearing in one prompt response.

create table "public"."sources" (
  "id" uuid not null default gen_random_uuid(),
  "created_at" timestamp with time zone not null default (now() at time zone 'utc'::text),
  "project_id" uuid not null,
  "prompt_id" uuid not null,
  "prompt_response_id" uuid not null,
  "is_cited" boolean not null,
  "position" smallint not null,
  "clean_url" text not null,
  "url" text not null,
  "hostname" text not null,
  "raw_url" text,
  "title" text,
  "description" text,
  "headings" jsonb,
  "brand_ids_ranking" text[] not null default '{}'::text[],
  constraint sources_pkey primary key (id),
  constraint sources_project_id_fkey foreign key (project_id) references projects(id),
  constraint sources_prompt_id_fkey foreign key (prompt_id) references prompts(id),
  constraint sources_prompt_response_id_fkey foreign key (prompt_response_id) references prompt_responses(id)
);

-- Indexes
create index idx_sources_project_id on public.sources using btree (project_id);
create index idx_sources_prompt_response_id on public.sources using btree (prompt_response_id);
create index idx_sources_prompt_id on public.sources using btree (prompt_id);
create index idx_sources_project_id_clean_url on public.sources using btree (project_id, clean_url);
create index idx_sources_project_id_created_at on public.sources using btree (project_id, created_at desc);

-- RLS
alter table "public"."sources" enable row level security;

create policy "Users can read sources of their projects"
  on "public"."sources"
  as permissive
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = sources.project_id
        and projects.author_id = (select auth.uid())
    )
  );

-- Grants
grant delete on table "public"."sources" to "anon";
grant insert on table "public"."sources" to "anon";
grant references on table "public"."sources" to "anon";
grant select on table "public"."sources" to "anon";
grant trigger on table "public"."sources" to "anon";
grant truncate on table "public"."sources" to "anon";
grant update on table "public"."sources" to "anon";

grant delete on table "public"."sources" to "authenticated";
grant insert on table "public"."sources" to "authenticated";
grant references on table "public"."sources" to "authenticated";
grant select on table "public"."sources" to "authenticated";
grant trigger on table "public"."sources" to "authenticated";
grant truncate on table "public"."sources" to "authenticated";
grant update on table "public"."sources" to "authenticated";

grant delete on table "public"."sources" to "service_role";
grant insert on table "public"."sources" to "service_role";
grant references on table "public"."sources" to "service_role";
grant select on table "public"."sources" to "service_role";
grant trigger on table "public"."sources" to "service_role";
grant truncate on table "public"."sources" to "service_role";
grant update on table "public"."sources" to "service_role";

-- Update cascade delete to include sources (must delete before prompt_responses due to FK)
create or replace function delete_project_cascade(target_project_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from sources where project_id = target_project_id;
  delete from prompt_responses where project_id = target_project_id;
  delete from prompts where project_id = target_project_id;
  delete from topics where project_id = target_project_id;
  delete from competitors where project_id = target_project_id;
  delete from projects where id = target_project_id;
end;
$$;
