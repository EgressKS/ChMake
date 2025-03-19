CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "scheduled_date" timestamp;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "scheduled_time" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birthday" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "practice_language" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "instagram_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;