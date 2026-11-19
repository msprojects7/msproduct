CREATE TABLE "attendee_access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendee_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"token_value" text,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendee_access_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "attendee_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attendee_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"preferred_name" varchar(255),
	"badge_organization" varchar(255),
	"dietary_requirements" text,
	"accessibility_needs" text,
	"badge_template_id" varchar(100),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"body_text" text NOT NULL,
	"signatory_name" varchar(255) NOT NULL,
	"signatory_title" varchar(255) NOT NULL,
	"logo_url" text,
	"signature_url" text,
	"criteria_type" varchar(50) DEFAULT 'check_in' NOT NULL,
	"min_session_count" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issued_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"attendee_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"certificate_reference" varchar(100) NOT NULL,
	"verification_token" varchar(128) NOT NULL,
	"status" varchar(50) DEFAULT 'valid' NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	CONSTRAINT "issued_certificates_certificate_reference_unique" UNIQUE("certificate_reference"),
	CONSTRAINT "issued_certificates_verification_token_unique" UNIQUE("verification_token")
);
--> statement-breakpoint
CREATE TABLE "kiosk_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"kiosk_name" varchar(100) NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kiosk_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "session_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"attendee_id" uuid NOT NULL,
	"action" varchar(50) DEFAULT 'check_in' NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"staff_user_id" text NOT NULL,
	"device_info" text
);
--> statement-breakpoint
ALTER TABLE "attendee_access_tokens" ADD CONSTRAINT "attendee_access_tokens_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendee_access_tokens" ADD CONSTRAINT "attendee_access_tokens_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendee_preferences" ADD CONSTRAINT "attendee_preferences_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendee_preferences" ADD CONSTRAINT "attendee_preferences_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_certificates" ADD CONSTRAINT "issued_certificates_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_certificates" ADD CONSTRAINT "issued_certificates_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issued_certificates" ADD CONSTRAINT "issued_certificates_template_id_certificate_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."certificate_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kiosk_sessions" ADD CONSTRAINT "kiosk_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_session_id_event_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."event_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_attendance" ADD CONSTRAINT "session_attendance_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendee_access_tokens_event_att_idx" ON "attendee_access_tokens" USING btree ("event_id","attendee_id");--> statement-breakpoint
CREATE INDEX "attendee_access_tokens_token_hash_idx" ON "attendee_access_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "attendee_preferences_unique_att_event" ON "attendee_preferences" USING btree ("attendee_id","event_id");--> statement-breakpoint
CREATE INDEX "attendee_preferences_event_idx" ON "attendee_preferences" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "cert_templates_event_idx" ON "certificate_templates" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "issued_certs_att_template_unique" ON "issued_certificates" USING btree ("event_id","attendee_id","template_id");--> statement-breakpoint
CREATE INDEX "issued_certs_event_idx" ON "issued_certificates" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "issued_certs_ref_idx" ON "issued_certificates" USING btree ("certificate_reference");--> statement-breakpoint
CREATE INDEX "issued_certs_token_idx" ON "issued_certificates" USING btree ("verification_token");--> statement-breakpoint
CREATE INDEX "kiosk_sessions_event_idx" ON "kiosk_sessions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "kiosk_sessions_token_idx" ON "kiosk_sessions" USING btree ("session_token");--> statement-breakpoint
CREATE INDEX "session_attendance_event_idx" ON "session_attendance" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "session_attendance_session_att_idx" ON "session_attendance" USING btree ("session_id","attendee_id");--> statement-breakpoint
CREATE INDEX "session_attendance_time_idx" ON "session_attendance" USING btree ("event_id","scanned_at");