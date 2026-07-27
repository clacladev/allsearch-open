alter table "public"."projects" add column "is_paused" boolean not null default false;

create or replace function delete_project_cascade(target_project_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from prompt_responses where project_id = target_project_id;
  delete from prompts where project_id = target_project_id;
  delete from prompt_groups where project_id = target_project_id;
  delete from competitors where project_id = target_project_id;
  delete from projects where id = target_project_id;
end;
$$;
