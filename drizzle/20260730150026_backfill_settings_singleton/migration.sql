-- Custom SQL migration file, put your code below! --
-- Backfill: the very first `settings` migration created `enabled_chatbots` as `NOT NULL DEFAULT
-- '[]'`, before the "off vs never-chosen" distinction existed (see
-- libs/database/schema.ts:68-71) — no UI let a user deliberately disable every Chatbot until that
-- distinction shipped, so a `[]` from that era only ever means "never chosen", never a deliberate
-- choice. Converting it to NULL restores that meaning for any database that predates the feature.
UPDATE `settings` SET `enabled_chatbots` = NULL WHERE `enabled_chatbots` = '[]';
--> statement-breakpoint
-- The application now always addresses the one settings row by a fixed id (see
-- SETTINGS_SINGLETON_ID in libs/database/Settings/queries.ts) instead of reading "whichever row
-- happens to exist", closing a race in the old `getOrCreateSettingsRow()` that could create more
-- than one row. Any database that already has more than one row (only possible from that pre-fix
-- race) is consolidated here into a single row: every provider key ever saved is kept, with the
-- most recently updated row's value winning for a given provider, and the most recently updated
-- non-null `enabled_chatbots` selection winning outright. A database with zero or one row (the
-- overwhelmingly common case) passes through unchanged.
UPDATE `settings`
SET
  `provider_keys` = (
    WITH RECURSIVE ordered AS (
      SELECT rowid AS rid, `provider_keys`,
             ROW_NUMBER() OVER (ORDER BY `updated_at` ASC, rowid ASC) AS rn
      FROM `settings`
    ),
    folded(rn, provider_keys) AS (
      SELECT rn, provider_keys FROM ordered WHERE rn = 1
      UNION ALL
      SELECT o.rn, json_patch(f.provider_keys, o.provider_keys)
      FROM folded f JOIN ordered o ON o.rn = f.rn + 1
    )
    SELECT provider_keys FROM folded ORDER BY rn DESC LIMIT 1
  ),
  `enabled_chatbots` = (
    SELECT `enabled_chatbots` FROM `settings`
    WHERE `enabled_chatbots` IS NOT NULL
    ORDER BY `updated_at` DESC LIMIT 1
  )
WHERE rowid = (SELECT MIN(rowid) FROM `settings`);
--> statement-breakpoint
DELETE FROM `settings` WHERE rowid != (SELECT MIN(rowid) FROM `settings`);
--> statement-breakpoint
UPDATE `settings` SET `id` = 'singleton' WHERE `id` != 'singleton';
