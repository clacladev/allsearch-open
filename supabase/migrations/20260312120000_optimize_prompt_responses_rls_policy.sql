-- Optimize prompt_responses RLS policy to avoid re-evaluating auth.uid() per row.
-- Wrapping auth.uid() in (select auth.uid()) lets the planner evaluate it once.

drop policy "Users can read responses of their projects" on "public"."prompt_responses";

create policy "Users can read responses of their projects"
  on "public"."prompt_responses"
  as permissive
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects
      where projects.id = prompt_responses.project_id
        and projects.author_id = (select auth.uid())
    )
  );
