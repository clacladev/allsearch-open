CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`provider_keys` text DEFAULT '{}' NOT NULL,
	`enabled_chatbots` text DEFAULT '[]' NOT NULL
);
