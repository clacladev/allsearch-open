-- Replace the existing (created_at, project_id) index with a more efficient
-- (project_id, created_at DESC) composite index. The new column order matches
-- the query pattern: equality filter on project_id, then range/sort on created_at.
DROP INDEX IF EXISTS prompt_responses_created_at_project_id_idx;

CREATE INDEX idx_prompt_responses_project_id_created_at
ON public.prompt_responses (project_id, created_at DESC);

-- Add composite index for prompt-specific date-range queries.
CREATE INDEX idx_prompt_responses_prompt_id_created_at
ON public.prompt_responses (prompt_id, created_at DESC);
