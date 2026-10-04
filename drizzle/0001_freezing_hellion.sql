CREATE TABLE `staff` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`baseline` integer DEFAULT 0 NOT NULL,
	`configured` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `code` text DEFAULT '411C' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `local_seq` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_code_local_seq_unique` ON `orders` (`code`,`local_seq`);