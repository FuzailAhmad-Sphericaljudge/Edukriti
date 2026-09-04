ALTER TABLE `learning_sources` ADD `page_count` integer;
--> statement-breakpoint
ALTER TABLE `learning_sources` ADD `chunk_count` integer;
--> statement-breakpoint
CREATE TABLE `source_chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`chunk_index` integer NOT NULL,
	`page_start` integer NOT NULL,
	`page_end` integer NOT NULL,
	`token_count` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `learning_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_source_chunks_source_index` ON `source_chunks` (`source_id`,`chunk_index`);
