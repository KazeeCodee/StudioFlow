CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" text DEFAULT 'email' NOT NULL,
	"audience" text NOT NULL,
	"event_type" text NOT NULL,
	"recipient_email" text NOT NULL,
	"recipient_name" text,
	"subject" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider_message_id" text,
	"error_message" text,
	"scheduled_for" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "notification_deliveries_dedupe_key_unique" ON "notification_deliveries" USING btree ("dedupe_key");