PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`provider_keys` text DEFAULT '{}' NOT NULL,
	`enabled_chatbots` text
);
--> statement-breakpoint
INSERT INTO `__new_settings`(`id`, `created_at`, `updated_at`, `provider_keys`, `enabled_chatbots`) SELECT `id`, `created_at`, `updated_at`, `provider_keys`, `enabled_chatbots` FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;