ALTER TABLE `users` ADD COLUMN `role` text DEFAULT 'monstiez' NOT NULL;
--> statement-breakpoint
ALTER TABLE `posts` ADD COLUMN `source_language` text DEFAULT 'zh-TW' NOT NULL;
--> statement-breakpoint
ALTER TABLE `posts` ADD COLUMN `status` text DEFAULT 'published' NOT NULL;
--> statement-breakpoint
ALTER TABLE `posts` ADD COLUMN `updated_at` text;
--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`locale` text DEFAULT 'zh-TW' NOT NULL,
	`published_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`pinned` integer DEFAULT false NOT NULL,
	`created_by` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `post_translations` (
	`post_id` integer NOT NULL,
	`target_language` text NOT NULL,
	`translated_body` text NOT NULL,
	`provider` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`post_id`, `target_language`),
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`reporter_id` integer NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reports_post_reporter` ON `reports` (`post_id`,`reporter_id`);
