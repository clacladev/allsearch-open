-- Rename table prompt_groups → topics
ALTER TABLE "public"."prompt_groups" RENAME TO "topics";

-- Rename primary key constraint (also renames the underlying index)
ALTER TABLE "public"."topics" RENAME CONSTRAINT "prompt_groups_pkey" TO "topics_pkey";

-- Rename foreign key constraints on topics table
ALTER TABLE "public"."topics" RENAME CONSTRAINT "prompt_groups_author_id_fkey" TO "topics_author_id_fkey";
ALTER TABLE "public"."topics" RENAME CONSTRAINT "prompt_groups_project_id_fkey" TO "topics_project_id_fkey";

-- Rename column prompt_group_id → topic_id in prompts table
ALTER TABLE "public"."prompts" RENAME COLUMN "prompt_group_id" TO "topic_id";

-- Rename foreign key constraint on prompts table
ALTER TABLE "public"."prompts" RENAME CONSTRAINT "prompts_prompt_group_id_fkey" TO "prompts_topic_id_fkey";

-- Rename trigger on topics table
ALTER TRIGGER "update_prompt_groups_updated_at" ON "public"."topics" RENAME TO "update_topics_updated_at";

-- Update the cascade delete function to use topics instead of prompt_groups
CREATE OR REPLACE FUNCTION delete_project_cascade(target_project_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from prompt_responses where project_id = target_project_id;
  delete from prompts where project_id = target_project_id;
  delete from topics where project_id = target_project_id;
  delete from competitors where project_id = target_project_id;
  delete from projects where id = target_project_id;
end;
$$;
