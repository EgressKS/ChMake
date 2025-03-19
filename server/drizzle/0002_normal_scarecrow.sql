ALTER TABLE "users" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "learning_streak" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_rooms" integer DEFAULT 0;