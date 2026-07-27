create type "public"."chatbot_id" as enum ('chatgpt', 'perplexity', 'google-ai-mode');

create type "public"."organization_type" as enum ('agency', 'in-house');

create type "public"."user_role" as enum ('user', 'admin');


  create table "public"."competitors" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "url" text not null,
    "name" text,
    "aliases" text[] not null,
    "icon_url" text,
    "project_id" uuid not null,
    "author_id" uuid not null,
    "hostname" text not null default ''::text,
    "organization_id" uuid not null
      );


alter table "public"."competitors" enable row level security;


  create table "public"."organizations" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "type" public.organization_type not null,
    "url" text,
    "name" text,
    "icon_url" text,
    "owner_id" uuid not null
      );


alter table "public"."organizations" enable row level security;


  create table "public"."projects" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "url" text not null,
    "name" text not null,
    "aliases" text[] not null,
    "icon_url" text,
    "organization_id" uuid not null,
    "author_id" uuid not null,
    "prompts_updated_at" timestamp with time zone,
    "hostname" text not null default ''::text
      );


alter table "public"."projects" enable row level security;


  create table "public"."prompt_groups" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "name" text not null,
    "project_id" uuid not null,
    "author_id" uuid not null
      );


alter table "public"."prompt_groups" enable row level security;


  create table "public"."prompt_responses" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "text" text not null,
    "chatbot_id" public.chatbot_id not null,
    "prompt_id" uuid not null,
    "project_id" uuid not null,
    "workflow_id" text not null,
    "model_id" text not null,
    "brand_ids_ranking" uuid[] not null default '{}'::uuid[],
    "sources" jsonb not null
      );


alter table "public"."prompt_responses" enable row level security;


  create table "public"."prompts" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "name" text not null,
    "prompt_group_id" uuid not null,
    "project_id" uuid not null,
    "author_id" uuid not null,
    "organization_id" uuid not null
      );


alter table "public"."prompts" enable row level security;


  create table "public"."user_profiles" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'UTC'::text),
    "email" text not null,
    "customer_id" text,
    "price_id" text,
    "price_key" text,
    "scheduled_cancellation" boolean not null default false,
    "subscribed_at" timestamp with time zone,
    "is_unpaid" boolean not null default false,
    "role" public.user_role not null default 'user'::public.user_role
      );


alter table "public"."user_profiles" enable row level security;

CREATE UNIQUE INDEX competitors_pkey ON public.competitors USING btree (id);

CREATE INDEX idx_user_profiles_admin_role ON public.user_profiles USING btree (role) WHERE (role = 'admin'::public.user_role);

CREATE UNIQUE INDEX organizations_owner_id_key ON public.organizations USING btree (owner_id);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX prompt_groups_pkey ON public.prompt_groups USING btree (id);

CREATE INDEX prompt_responses_created_at_project_id_idx ON public.prompt_responses USING btree (created_at, project_id);

CREATE UNIQUE INDEX prompt_responses_pkey ON public.prompt_responses USING btree (id);

CREATE UNIQUE INDEX prompts_pkey ON public.prompts USING btree (id);

CREATE INDEX user_profiles_customer_id_idx ON public.user_profiles USING btree (customer_id);

CREATE UNIQUE INDEX user_profiles_customer_id_key ON public.user_profiles USING btree (customer_id);

CREATE UNIQUE INDEX user_profiles_email_key ON public.user_profiles USING btree (email);

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

alter table "public"."competitors" add constraint "competitors_pkey" PRIMARY KEY using index "competitors_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."prompt_groups" add constraint "prompt_groups_pkey" PRIMARY KEY using index "prompt_groups_pkey";

alter table "public"."prompt_responses" add constraint "prompt_responses_pkey" PRIMARY KEY using index "prompt_responses_pkey";

alter table "public"."prompts" add constraint "prompts_pkey" PRIMARY KEY using index "prompts_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."competitors" add constraint "competitors_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users(id) not valid;

alter table "public"."competitors" validate constraint "competitors_author_id_fkey";

alter table "public"."competitors" add constraint "competitors_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) not valid;

alter table "public"."competitors" validate constraint "competitors_organization_id_fkey";

alter table "public"."competitors" add constraint "competitors_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) not valid;

alter table "public"."competitors" validate constraint "competitors_project_id_fkey";

alter table "public"."organizations" add constraint "organizations_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) not valid;

alter table "public"."organizations" validate constraint "organizations_owner_id_fkey";

alter table "public"."organizations" add constraint "organizations_owner_id_key" UNIQUE using index "organizations_owner_id_key";

alter table "public"."projects" add constraint "projects_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users(id) not valid;

alter table "public"."projects" validate constraint "projects_author_id_fkey";

alter table "public"."projects" add constraint "projects_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) not valid;

alter table "public"."projects" validate constraint "projects_organization_id_fkey";

alter table "public"."prompt_groups" add constraint "prompt_groups_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users(id) not valid;

alter table "public"."prompt_groups" validate constraint "prompt_groups_author_id_fkey";

alter table "public"."prompt_groups" add constraint "prompt_groups_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) not valid;

alter table "public"."prompt_groups" validate constraint "prompt_groups_project_id_fkey";

alter table "public"."prompt_responses" add constraint "prompt_responses_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) not valid;

alter table "public"."prompt_responses" validate constraint "prompt_responses_project_id_fkey";

alter table "public"."prompt_responses" add constraint "prompt_responses_prompt_id_fkey" FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) not valid;

alter table "public"."prompt_responses" validate constraint "prompt_responses_prompt_id_fkey";

alter table "public"."prompts" add constraint "prompts_author_id_fkey" FOREIGN KEY (author_id) REFERENCES auth.users(id) not valid;

alter table "public"."prompts" validate constraint "prompts_author_id_fkey";

alter table "public"."prompts" add constraint "prompts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) not valid;

alter table "public"."prompts" validate constraint "prompts_organization_id_fkey";

alter table "public"."prompts" add constraint "prompts_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) not valid;

alter table "public"."prompts" validate constraint "prompts_project_id_fkey";

alter table "public"."prompts" add constraint "prompts_prompt_group_id_fkey" FOREIGN KEY (prompt_group_id) REFERENCES public.prompt_groups(id) not valid;

alter table "public"."prompts" validate constraint "prompts_prompt_group_id_fkey";

alter table "public"."user_profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "profiles_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_customer_id_key" UNIQUE using index "user_profiles_customer_id_key";

alter table "public"."user_profiles" add constraint "user_profiles_email_key" UNIQUE using index "user_profiles_email_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$begin
  insert into public.user_profiles (id, email, created_at, updated_at)
  values (
    new.id,
    new.email,
    now() at time zone 'utc',
    now() at time zone 'utc'
  )
  on conflict (id) do nothing;
  
  return new;
end;$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
    SET search_path = 'public'; -- Set a fixed search path
    NEW.updated_at = NOW();
    RETURN NEW;
END;$function$
;

grant delete on table "public"."competitors" to "anon";

grant insert on table "public"."competitors" to "anon";

grant references on table "public"."competitors" to "anon";

grant select on table "public"."competitors" to "anon";

grant trigger on table "public"."competitors" to "anon";

grant truncate on table "public"."competitors" to "anon";

grant update on table "public"."competitors" to "anon";

grant delete on table "public"."competitors" to "authenticated";

grant insert on table "public"."competitors" to "authenticated";

grant references on table "public"."competitors" to "authenticated";

grant select on table "public"."competitors" to "authenticated";

grant trigger on table "public"."competitors" to "authenticated";

grant truncate on table "public"."competitors" to "authenticated";

grant update on table "public"."competitors" to "authenticated";

grant delete on table "public"."competitors" to "service_role";

grant insert on table "public"."competitors" to "service_role";

grant references on table "public"."competitors" to "service_role";

grant select on table "public"."competitors" to "service_role";

grant trigger on table "public"."competitors" to "service_role";

grant truncate on table "public"."competitors" to "service_role";

grant update on table "public"."competitors" to "service_role";

grant delete on table "public"."organizations" to "anon";

grant insert on table "public"."organizations" to "anon";

grant references on table "public"."organizations" to "anon";

grant select on table "public"."organizations" to "anon";

grant trigger on table "public"."organizations" to "anon";

grant truncate on table "public"."organizations" to "anon";

grant update on table "public"."organizations" to "anon";

grant delete on table "public"."organizations" to "authenticated";

grant insert on table "public"."organizations" to "authenticated";

grant references on table "public"."organizations" to "authenticated";

grant select on table "public"."organizations" to "authenticated";

grant trigger on table "public"."organizations" to "authenticated";

grant truncate on table "public"."organizations" to "authenticated";

grant update on table "public"."organizations" to "authenticated";

grant delete on table "public"."organizations" to "service_role";

grant insert on table "public"."organizations" to "service_role";

grant references on table "public"."organizations" to "service_role";

grant select on table "public"."organizations" to "service_role";

grant trigger on table "public"."organizations" to "service_role";

grant truncate on table "public"."organizations" to "service_role";

grant update on table "public"."organizations" to "service_role";

grant delete on table "public"."projects" to "anon";

grant insert on table "public"."projects" to "anon";

grant references on table "public"."projects" to "anon";

grant select on table "public"."projects" to "anon";

grant trigger on table "public"."projects" to "anon";

grant truncate on table "public"."projects" to "anon";

grant update on table "public"."projects" to "anon";

grant delete on table "public"."projects" to "authenticated";

grant insert on table "public"."projects" to "authenticated";

grant references on table "public"."projects" to "authenticated";

grant select on table "public"."projects" to "authenticated";

grant trigger on table "public"."projects" to "authenticated";

grant truncate on table "public"."projects" to "authenticated";

grant update on table "public"."projects" to "authenticated";

grant delete on table "public"."projects" to "service_role";

grant insert on table "public"."projects" to "service_role";

grant references on table "public"."projects" to "service_role";

grant select on table "public"."projects" to "service_role";

grant trigger on table "public"."projects" to "service_role";

grant truncate on table "public"."projects" to "service_role";

grant update on table "public"."projects" to "service_role";

grant delete on table "public"."prompt_groups" to "anon";

grant insert on table "public"."prompt_groups" to "anon";

grant references on table "public"."prompt_groups" to "anon";

grant select on table "public"."prompt_groups" to "anon";

grant trigger on table "public"."prompt_groups" to "anon";

grant truncate on table "public"."prompt_groups" to "anon";

grant update on table "public"."prompt_groups" to "anon";

grant delete on table "public"."prompt_groups" to "authenticated";

grant insert on table "public"."prompt_groups" to "authenticated";

grant references on table "public"."prompt_groups" to "authenticated";

grant select on table "public"."prompt_groups" to "authenticated";

grant trigger on table "public"."prompt_groups" to "authenticated";

grant truncate on table "public"."prompt_groups" to "authenticated";

grant update on table "public"."prompt_groups" to "authenticated";

grant delete on table "public"."prompt_groups" to "service_role";

grant insert on table "public"."prompt_groups" to "service_role";

grant references on table "public"."prompt_groups" to "service_role";

grant select on table "public"."prompt_groups" to "service_role";

grant trigger on table "public"."prompt_groups" to "service_role";

grant truncate on table "public"."prompt_groups" to "service_role";

grant update on table "public"."prompt_groups" to "service_role";

grant delete on table "public"."prompt_responses" to "anon";

grant insert on table "public"."prompt_responses" to "anon";

grant references on table "public"."prompt_responses" to "anon";

grant select on table "public"."prompt_responses" to "anon";

grant trigger on table "public"."prompt_responses" to "anon";

grant truncate on table "public"."prompt_responses" to "anon";

grant update on table "public"."prompt_responses" to "anon";

grant delete on table "public"."prompt_responses" to "authenticated";

grant insert on table "public"."prompt_responses" to "authenticated";

grant references on table "public"."prompt_responses" to "authenticated";

grant select on table "public"."prompt_responses" to "authenticated";

grant trigger on table "public"."prompt_responses" to "authenticated";

grant truncate on table "public"."prompt_responses" to "authenticated";

grant update on table "public"."prompt_responses" to "authenticated";

grant delete on table "public"."prompt_responses" to "service_role";

grant insert on table "public"."prompt_responses" to "service_role";

grant references on table "public"."prompt_responses" to "service_role";

grant select on table "public"."prompt_responses" to "service_role";

grant trigger on table "public"."prompt_responses" to "service_role";

grant truncate on table "public"."prompt_responses" to "service_role";

grant update on table "public"."prompt_responses" to "service_role";

grant delete on table "public"."prompts" to "anon";

grant insert on table "public"."prompts" to "anon";

grant references on table "public"."prompts" to "anon";

grant select on table "public"."prompts" to "anon";

grant trigger on table "public"."prompts" to "anon";

grant truncate on table "public"."prompts" to "anon";

grant update on table "public"."prompts" to "anon";

grant delete on table "public"."prompts" to "authenticated";

grant insert on table "public"."prompts" to "authenticated";

grant references on table "public"."prompts" to "authenticated";

grant select on table "public"."prompts" to "authenticated";

grant trigger on table "public"."prompts" to "authenticated";

grant truncate on table "public"."prompts" to "authenticated";

grant update on table "public"."prompts" to "authenticated";

grant delete on table "public"."prompts" to "service_role";

grant insert on table "public"."prompts" to "service_role";

grant references on table "public"."prompts" to "service_role";

grant select on table "public"."prompts" to "service_role";

grant trigger on table "public"."prompts" to "service_role";

grant truncate on table "public"."prompts" to "service_role";

grant update on table "public"."prompts" to "service_role";

grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";


  create policy "Enable delete for users based on author_id"
  on "public"."competitors"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable insert for users based on author_id"
  on "public"."competitors"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable update for users based on author_id"
  on "public"."competitors"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable users to view their own data only"
  on "public"."competitors"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable delete for users based on owner_id"
  on "public"."organizations"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Enable insert for users based on owner_id"
  on "public"."organizations"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Enable update for users based on owner_id"
  on "public"."organizations"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Enable users to view their own data only"
  on "public"."organizations"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "Enable delete for users based on author_id"
  on "public"."projects"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable insert for users based on author_id"
  on "public"."projects"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable update for users based on author_id"
  on "public"."projects"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable users to view their own data only"
  on "public"."projects"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable delete for users based on author_id"
  on "public"."prompt_groups"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable insert for users based on author_id"
  on "public"."prompt_groups"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable update for users based on author_id"
  on "public"."prompt_groups"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable users to view their own data only"
  on "public"."prompt_groups"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Users can read responses of their projects"
  on "public"."prompt_responses"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = prompt_responses.project_id) AND (projects.author_id = auth.uid())))));



  create policy "Enable delete for users based on author_id"
  on "public"."prompts"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable insert for users based on author_id"
  on "public"."prompts"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable update for users based on author_id"
  on "public"."prompts"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable users to view their own data only"
  on "public"."prompts"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = author_id));



  create policy "Enable delete for users based on user_id"
  on "public"."user_profiles"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = id));



  create policy "Users can read own profile"
  on "public"."user_profiles"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = id));



  create policy "Users can update own profile"
  on "public"."user_profiles"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = id));


CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


