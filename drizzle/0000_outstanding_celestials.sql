CREATE TABLE `orders` (
	`seq` integer PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`customer` text NOT NULL,
	`memo` text NOT NULL,
	`amount` integer,
	`created_at` text NOT NULL,
	`cancelled_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_request_id_unique` ON `orders` (`request_id`);