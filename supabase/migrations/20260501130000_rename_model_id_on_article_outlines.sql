-- Rename article_outlines.model_id to outline_model_id for symmetry with the
-- newly-added article_model_id. Two model columns now read self-evidently:
--   outline_model_id: model used to generate `outline`
--   article_model_id: model used to generate `article_markdown`

alter table public.article_outlines
  rename column model_id to outline_model_id;
