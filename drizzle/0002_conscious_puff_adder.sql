CREATE INDEX `idx_announcements_locale_pinned_published` ON `announcements` (`locale`,`pinned`,`published_at`);--> statement-breakpoint
CREATE INDEX `idx_posts_status_created_at` ON `posts` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_reports_status_created_at` ON `reports` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_sessions_user_id` ON `sessions` (`user_id`);