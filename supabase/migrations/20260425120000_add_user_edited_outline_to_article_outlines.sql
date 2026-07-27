-- Add a nullable column to store the user-edited version of an outline.
-- The original AI-generated headings stay in `outline` so the user can restore
-- from the original suggestion at any time. When `user_edited_outline` is null
-- the user has not modified anything yet (or has chosen to restore).

ALTER TABLE "public"."article_outlines"
  ADD COLUMN IF NOT EXISTS "user_edited_outline" jsonb;
