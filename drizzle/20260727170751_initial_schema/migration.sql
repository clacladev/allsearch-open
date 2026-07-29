CREATE TABLE `collection_run_items` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`project_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`chatbot_id` text NOT NULL,
	`status` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`error` text,
	`started_at` text,
	`finished_at` text,
	`created_at` text NOT NULL,
	CONSTRAINT `fk_collection_run_items_run_id_collection_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `collection_runs`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_collection_run_items_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_collection_run_items_prompt_id_prompts_id_fk` FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON DELETE CASCADE,
	CONSTRAINT "collection_run_items_chatbot_id_check" CHECK("chatbot_id" in ('chatgpt', 'perplexity', 'google-ai-overview')),
	CONSTRAINT "collection_run_items_status_check" CHECK("status" in ('pending', 'running', 'completed', 'failed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE `collection_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`started_at` text,
	`finished_at` text,
	`items_total` integer DEFAULT 0 NOT NULL,
	`items_completed` integer DEFAULT 0 NOT NULL,
	`items_failed` integer DEFAULT 0 NOT NULL,
	`error` text,
	`created_at` text NOT NULL,
	CONSTRAINT "collection_runs_status_check" CHECK("status" in ('pending', 'running', 'completed', 'failed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE `competitors` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`url` text NOT NULL,
	`name` text,
	`aliases` text NOT NULL,
	`icon_url` text,
	`project_id` text NOT NULL,
	`hostname` text DEFAULT '' NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_competitors_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`type` text NOT NULL,
	`url` text,
	`name` text,
	`icon_url` text,
	CONSTRAINT "organizations_type_check" CHECK("type" in ('agency', 'in-house'))
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`url` text NOT NULL,
	`name` text NOT NULL,
	`aliases` text NOT NULL,
	`icon_url` text,
	`hostname` text DEFAULT '' NOT NULL,
	`prompts_updated_at` text,
	`is_paused` integer DEFAULT false NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`target_location` text
);
--> statement-breakpoint
CREATE TABLE `prompt_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`opportunity_id` text,
	`opportunity_type` text NOT NULL,
	`target_source_clean_url` text,
	`outline` text NOT NULL,
	`article_markdown` text,
	`outline_model_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`user_edited_outline` text,
	`user_edited_article_markdown` text,
	`sources_used` text,
	`outline_used` text,
	`article_model_id` text,
	`target_word_count` integer DEFAULT 1500 NOT NULL,
	`style_guide` text,
	`pages_to_link` text DEFAULT '[]' NOT NULL,
	`target_keywords` text DEFAULT '[]' NOT NULL,
	CONSTRAINT `fk_prompt_articles_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_prompt_articles_prompt_id_prompts_id_fk` FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON DELETE CASCADE,
	CONSTRAINT "prompt_articles_target_word_count_range" CHECK("target_word_count" between 300 and 5000)
);
--> statement-breakpoint
CREATE TABLE `prompt_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`text` text NOT NULL,
	`chatbot_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`project_id` text NOT NULL,
	`workflow_id` text NOT NULL,
	`model_id` text NOT NULL,
	`brand_ids_ranking` text DEFAULT '[]' NOT NULL,
	`sentiment` text,
	`run_id` text,
	CONSTRAINT `fk_prompt_responses_prompt_id_prompts_id_fk` FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_prompt_responses_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_prompt_responses_run_id_collection_runs_id_fk` FOREIGN KEY (`run_id`) REFERENCES `collection_runs`(`id`) ON DELETE SET NULL,
	CONSTRAINT "prompt_responses_chatbot_id_check" CHECK("chatbot_id" in ('chatgpt', 'perplexity', 'google-ai-overview'))
);
--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`name` text NOT NULL,
	`topic_id` text NOT NULL,
	`project_id` text NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_prompts_topic_id_topics_id_fk` FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_prompts_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`project_id` text NOT NULL,
	`prompt_id` text NOT NULL,
	`prompt_response_id` text NOT NULL,
	`is_cited` integer NOT NULL,
	`position` integer NOT NULL,
	`clean_url` text NOT NULL,
	`url` text NOT NULL,
	`hostname` text NOT NULL,
	`raw_url` text,
	`title` text,
	`description` text,
	`headings` text,
	`brand_ids_ranking` text DEFAULT '[]' NOT NULL,
	CONSTRAINT `fk_sources_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sources_prompt_id_prompts_id_fk` FOREIGN KEY (`prompt_id`) REFERENCES `prompts`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_sources_prompt_response_id_prompt_responses_id_fk` FOREIGN KEY (`prompt_response_id`) REFERENCES `prompt_responses`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`name` text NOT NULL,
	`project_id` text NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	CONSTRAINT `fk_topics_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `collection_run_items_run_id_status_idx` ON `collection_run_items` (`run_id`,`status`);--> statement-breakpoint
CREATE INDEX `collection_runs_status_created_at_idx` ON `collection_runs` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `competitors_project_id_is_archived_updated_at_idx` ON `competitors` (`project_id`,`is_archived`,`updated_at`);--> statement-breakpoint
CREATE INDEX `projects_is_archived_created_at_idx` ON `projects` (`is_archived`,`created_at`);--> statement-breakpoint
CREATE INDEX `prompt_articles_project_id_prompt_id_opportunity_type_idx` ON `prompt_articles` (`project_id`,`prompt_id`,`opportunity_type`,`target_source_clean_url`,`created_at`);--> statement-breakpoint
CREATE INDEX `prompt_articles_project_id_prompt_id_updated_at_idx` ON `prompt_articles` (`project_id`,`prompt_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `prompt_articles_project_id_opportunity_id_updated_at_idx` ON `prompt_articles` (`project_id`,`opportunity_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `prompt_responses_project_id_created_at_idx` ON `prompt_responses` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `prompt_responses_prompt_id_created_at_idx` ON `prompt_responses` (`prompt_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `prompt_responses_run_id_idx` ON `prompt_responses` (`run_id`);--> statement-breakpoint
CREATE INDEX `prompts_project_id_is_archived_updated_at_idx` ON `prompts` (`project_id`,`is_archived`,`updated_at`);--> statement-breakpoint
CREATE INDEX `prompts_project_id_is_archived_created_at_idx` ON `prompts` (`project_id`,`is_archived`,`created_at`);--> statement-breakpoint
CREATE INDEX `prompts_topic_id_idx` ON `prompts` (`topic_id`);--> statement-breakpoint
CREATE INDEX `sources_project_id_created_at_idx` ON `sources` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `sources_prompt_response_id_position_idx` ON `sources` (`prompt_response_id`,`position`);--> statement-breakpoint
CREATE INDEX `sources_prompt_id_idx` ON `sources` (`prompt_id`);--> statement-breakpoint
CREATE INDEX `topics_project_id_is_archived_idx` ON `topics` (`project_id`,`is_archived`);