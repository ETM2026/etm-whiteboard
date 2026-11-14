CREATE TABLE `tutor_config` (
	`id` integer PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`limit_micros` integer DEFAULT 5000000 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tutor_homework` (
	`id` text PRIMARY KEY NOT NULL,
	`at` integer NOT NULL,
	`body` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tutor_practice` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`at` integer NOT NULL,
	`body` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tutor_results` (
	`id` text PRIMARY KEY NOT NULL,
	`at` integer NOT NULL,
	`body` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tutor_usage` (
	`month` text PRIMARY KEY NOT NULL,
	`reserved` integer DEFAULT 0 NOT NULL,
	`spent` integer DEFAULT 0 NOT NULL,
	`calls` integer DEFAULT 0 NOT NULL
);
