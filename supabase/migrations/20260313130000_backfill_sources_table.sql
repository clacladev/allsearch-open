-- Backfill sources table from the JSONB sources column on prompt_responses.
-- Each source item in the JSONB array becomes one row in the sources table.

insert into sources (
  project_id,
  prompt_id,
  prompt_response_id,
  is_cited,
  position,
  clean_url,
  url,
  hostname,
  raw_url,
  title,
  description,
  headings,
  brand_ids_ranking,
  created_at
)
select
  pr.project_id,
  pr.prompt_id,
  pr.id as prompt_response_id,
  coalesce((source.value->>'isCited')::boolean, false) as is_cited,
  (source.ordinality - 1)::smallint as position,
  source.value->>'cleanUrl' as clean_url,
  source.value->>'url' as url,
  source.value->>'hostname' as hostname,
  source.value->>'rawUrl' as raw_url,
  source.value->>'title' as title,
  source.value->>'description' as description,
  source.value->'headings' as headings,
  coalesce(
    array(select jsonb_array_elements_text(source.value->'brandIdsRanking')),
    '{}'::text[]
  ) as brand_ids_ranking,
  pr.created_at
from prompt_responses pr,
  lateral jsonb_array_elements(pr.sources->'data') with ordinality as source(value, ordinality)
where jsonb_array_length(pr.sources->'data') > 0;
