ALTER TABLE "organizations" ADD COLUMN "plan_id" varchar(50) DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "plan_activated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "plan_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "extra_attendees_quota" integer DEFAULT 0 NOT NULL;