CREATE TABLE `learners` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`level` text NOT NULL,
	`preferred_language` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`filename` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`storage_key` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_sources_storage_key_unique` ON `learning_sources` (`storage_key`);
--> statement-breakpoint
CREATE INDEX `idx_learning_sources_learner_id` ON `learning_sources` (`learner_id`);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_id` text NOT NULL,
	`source_id` text,
	`topic` text,
	`title` text NOT NULL,
	`language` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`status` text NOT NULL,
	`plan_json` text,
	`created_at` text NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `learning_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lessons_learner_created` ON `lessons` (`learner_id`,`created_at`);
--> statement-breakpoint
CREATE TABLE `checkpoint_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`checkpoint_id` text NOT NULL,
	`response` text NOT NULL,
	`evaluation_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_attempts_lesson_id` ON `checkpoint_attempts` (`lesson_id`);
--> statement-breakpoint
CREATE TABLE `learning_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`learner_id` text NOT NULL,
	`score_percent` integer NOT NULL,
	`report_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learner_id`) REFERENCES `learners`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reports_learner_created` ON `learning_reports` (`learner_id`,`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_reports_lesson_id` ON `learning_reports` (`lesson_id`);
