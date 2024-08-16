CREATE TABLE `servers` (
	`id` text NOT NULL,
	`data` text NOT NULL,
	`is_available` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `prices` (
	`server_id` text NOT NULL,
	`price` real NOT NULL,
	`next_reduce` integer NOT NULL,
	`is_fixed` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idIdx` ON `servers` (`id`);--> statement-breakpoint
CREATE UNIQUE INDEX `price_server_id_unique_idx` ON `prices` (`server_id`,`price`);