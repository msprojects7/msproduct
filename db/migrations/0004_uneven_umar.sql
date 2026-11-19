CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_id" uuid,
	"draft_type" varchar(100) NOT NULL,
	"data" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp_hash" varchar(64) NOT NULL,
	"purpose" varchar(50) DEFAULT 'registration' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"verification_grant" varchar(64),
	"grant_expires_at" timestamp with time zone,
	"is_consumed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drafts_user_org_type_idx" ON "drafts" USING btree ("user_id","organization_id","draft_type");--> statement-breakpoint
CREATE INDEX "drafts_org_idx" ON "drafts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "drafts_event_idx" ON "drafts" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "drafts_time_idx" ON "drafts" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "verifications_email_purpose_idx" ON "email_verifications" USING btree ("email","purpose");--> statement-breakpoint
CREATE INDEX "verifications_grant_idx" ON "email_verifications" USING btree ("verification_grant");--> statement-breakpoint
CREATE INDEX "verifications_expiry_idx" ON "email_verifications" USING btree ("expires_at");