CREATE TABLE `whoop_connections` (
	`owner` text PRIMARY KEY NOT NULL,
	`credentials` text,
	`snapshot` text,
	`updated` integer,
	`lease` text,
	`lease_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `whoop_states` (
	`owner` text PRIMARY KEY NOT NULL,
	`hash` text NOT NULL,
	`expires` integer NOT NULL
);
