-- De-duplicate active competitors before the unique indexes below are created: duplicates are
-- only possible via the pre-fix check-then-write race in the competitors route. Keep the newest
-- row per (project_id, url) / (project_id, name) by updated_at (rowid breaks ties), delete older
-- duplicates.
DELETE FROM `competitors`
WHERE `is_archived` = 0 AND rowid NOT IN (
  SELECT rowid FROM `competitors` c
  WHERE `is_archived` = 0
    AND rowid = (
      SELECT rowid FROM `competitors` newer
      WHERE newer.`is_archived` = 0
        AND newer.`project_id` = c.`project_id`
        AND newer.`url` = c.`url`
      ORDER BY newer.`updated_at` DESC, newer.rowid DESC
      LIMIT 1
    )
);
--> statement-breakpoint
DELETE FROM `competitors`
WHERE `is_archived` = 0 AND `name` IS NOT NULL AND rowid NOT IN (
  SELECT rowid FROM `competitors` c
  WHERE `is_archived` = 0 AND `name` IS NOT NULL
    AND rowid = (
      SELECT rowid FROM `competitors` newer
      WHERE newer.`is_archived` = 0
        AND newer.`name` IS NOT NULL
        AND newer.`project_id` = c.`project_id`
        AND newer.`name` = c.`name`
      ORDER BY newer.`updated_at` DESC, newer.rowid DESC
      LIMIT 1
    )
);
--> statement-breakpoint
CREATE UNIQUE INDEX `competitors_project_id_url_is_active_uidx` ON `competitors` (`project_id`,`url`) WHERE "competitors"."is_archived" = 0;--> statement-breakpoint
CREATE UNIQUE INDEX `competitors_project_id_name_is_active_uidx` ON `competitors` (`project_id`,`name`) WHERE "competitors"."is_archived" = 0 and "competitors"."name" is not null;
