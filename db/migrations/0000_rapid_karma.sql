DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendees') THEN
    ALTER TABLE "attendees" RENAME TO "legacy_attendees";
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_events') THEN
    ALTER TABLE "audit_events" RENAME TO "legacy_audit_events";
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'badge_print_events') THEN
    ALTER TABLE "badge_print_events" RENAME TO "legacy_badge_print_events";
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'import_batches') THEN
    ALTER TABLE "import_batches" RENAME TO "legacy_import_batches";
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'registration_counters') THEN
    ALTER TABLE "registration_counters" RENAME TO "legacy_registration_counters";
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scan_events') THEN
    ALTER TABLE "scan_events" RENAME TO "legacy_scan_events";
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'spot_registration_keys') THEN
    ALTER TABLE "spot_registration_keys" RENAME TO "legacy_spot_registration_keys";
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_staff_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"venue" varchar(255),
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_org_slug_unique" UNIQUE("organization_id","slug"),
	CONSTRAINT "events_composite_id_org" UNIQUE("id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "registration_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"counter_key" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"prefix" varchar(20) NOT NULL,
	"start_value" integer DEFAULT 1 NOT NULL,
	"next_value" integer DEFAULT 1 NOT NULL,
	"padding" integer DEFAULT 4 NOT NULL,
	"last_used_value" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"registration_number" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"phone_number" varchar(50),
	"email" varchar(255),
	"gender" varchar(50),
	"medical_council_number" varchar(100),
	"food_preference" varchar(50) DEFAULT 'Not Specified' NOT NULL,
	"payment_status" varchar(50) DEFAULT 'Paid' NOT NULL,
	"registration_type" varchar(50) DEFAULT 'pre_registered' NOT NULL,
	"attendance_status" varchar(50) DEFAULT 'not_checked_in' NOT NULL,
	"qr_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"import_batch_id" uuid,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendees_composite_id_event" UNIQUE("id","event_id")
);
--> statement-breakpoint
CREATE TABLE "badge_print_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"attendee_id" uuid NOT NULL,
	"print_type" varchar(50) NOT NULL,
	"reason" text,
	"staff_user_id" text NOT NULL,
	"printed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_info" text
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"storage_path" text,
	"row_count" integer DEFAULT 0 NOT NULL,
	"imported_count" integer DEFAULT 0 NOT NULL,
	"rejected_count" integer DEFAULT 0 NOT NULL,
	"rejection_summary" jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "import_batches_composite_id_event" UNIQUE("id","event_id")
);
--> statement-breakpoint
CREATE TABLE "scan_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"attendee_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"staff_user_id" text NOT NULL,
	"device_info" text,
	"session_id" text
);
--> statement-breakpoint
CREATE TABLE "spot_registration_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"idempotency_key" varchar(255) NOT NULL,
	"attendee_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"event_id" uuid,
	"user_id" text NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100) NOT NULL,
	"entity_id" text,
	"details" jsonb,
	"ip_address" varchar(50),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_settings" ADD CONSTRAINT "event_settings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_staff_assignments" ADD CONSTRAINT "event_staff_assignments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_counters" ADD CONSTRAINT "registration_counters_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_print_events" ADD CONSTRAINT "badge_print_events_attendee_id_event_id_attendees_id_event_id_fk" FOREIGN KEY ("attendee_id","event_id") REFERENCES "public"."attendees"("id","event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_events" ADD CONSTRAINT "scan_events_attendee_id_event_id_attendees_id_event_id_fk" FOREIGN KEY ("attendee_id","event_id") REFERENCES "public"."attendees"("id","event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spot_registration_keys" ADD CONSTRAINT "spot_registration_keys_attendee_id_event_id_attendees_id_event_id_fk" FOREIGN KEY ("attendee_id","event_id") REFERENCES "public"."attendees"("id","event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "org_members_org_user_unique" ON "organization_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "org_members_org_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_members_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_event_key_unique" ON "event_settings" USING btree ("event_id","key");--> statement-breakpoint
CREATE INDEX "settings_event_idx" ON "event_settings" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_event_user_unique" ON "event_staff_assignments" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "staff_event_idx" ON "event_staff_assignments" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "staff_user_idx" ON "event_staff_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_org_idx" ON "events" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "counters_event_key_unique" ON "registration_counters" USING btree ("event_id","counter_key");--> statement-breakpoint
CREATE INDEX "counters_event_idx" ON "registration_counters" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "attendees_event_reg_no_unique" ON "attendees" USING btree ("event_id","registration_number");--> statement-breakpoint
CREATE UNIQUE INDEX "attendees_event_qr_token_unique" ON "attendees" USING btree ("event_id","qr_token");--> statement-breakpoint
CREATE INDEX "attendees_event_idx" ON "attendees" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "attendees_name_search_idx" ON "attendees" USING btree ("event_id","name");--> statement-breakpoint
CREATE INDEX "attendees_reg_no_idx" ON "attendees" USING btree ("event_id","registration_number");--> statement-breakpoint
CREATE INDEX "attendees_category_idx" ON "attendees" USING btree ("event_id","category");--> statement-breakpoint
CREATE INDEX "attendees_status_idx" ON "attendees" USING btree ("event_id","attendance_status");--> statement-breakpoint
CREATE INDEX "badge_prints_event_idx" ON "badge_print_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "badge_prints_attendee_idx" ON "badge_print_events" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "import_batches_event_idx" ON "import_batches" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "scan_events_event_idx" ON "scan_events" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "scan_events_attendee_idx" ON "scan_events" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "scan_events_time_idx" ON "scan_events" USING btree ("event_id","scanned_at");--> statement-breakpoint
CREATE UNIQUE INDEX "spot_keys_event_idempotency_unique" ON "spot_registration_keys" USING btree ("event_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "spot_keys_event_idx" ON "spot_registration_keys" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "audit_events_org_time_idx" ON "audit_events" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_event_time_idx" ON "audit_events" USING btree ("event_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_user_idx" ON "audit_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_events_action_idx" ON "audit_events" USING btree ("organization_id","action");