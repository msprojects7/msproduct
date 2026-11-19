CREATE TABLE "event_exhibitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"booth_number" varchar(50) NOT NULL,
	"contact_name" varchar(255),
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"description" text,
	"website_url" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"track_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"session_date" timestamp with time zone,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"room" varchar(100),
	"capacity" integer,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_speakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"speaker_id" uuid NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"tier" varchar(50) NOT NULL,
	"logo_url" text,
	"website_url" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_tracks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"room_name" varchar(100),
	"capacity" integer DEFAULT 0 NOT NULL,
	"color" varchar(30) DEFAULT '#3B82F6' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_speakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"speaker_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'speaker' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "speakers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"title" varchar(255),
	"company" varchar(255),
	"bio" text,
	"email" varchar(255),
	"phone" varchar(50),
	"photo_url" text,
	"website_url" text,
	"linkedin_url" text,
	"twitter_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_exhibitors" ADD CONSTRAINT "event_exhibitors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_track_id_event_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."event_tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_tracks" ADD CONSTRAINT "event_tracks_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_speakers" ADD CONSTRAINT "session_speakers_session_id_event_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."event_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_speakers" ADD CONSTRAINT "session_speakers_speaker_id_speakers_id_fk" FOREIGN KEY ("speaker_id") REFERENCES "public"."speakers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "speakers" ADD CONSTRAINT "speakers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_exhibitors_event_booth_unique" ON "event_exhibitors" USING btree ("event_id","booth_number");--> statement-breakpoint
CREATE INDEX "event_exhibitors_event_idx" ON "event_exhibitors" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sessions_event_idx" ON "event_sessions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sessions_track_idx" ON "event_sessions" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "event_sessions_time_idx" ON "event_sessions" USING btree ("event_id","start_time","end_time");--> statement-breakpoint
CREATE UNIQUE INDEX "event_speakers_event_speaker_unique" ON "event_speakers" USING btree ("event_id","speaker_id");--> statement-breakpoint
CREATE INDEX "event_speakers_event_idx" ON "event_speakers" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_speakers_speaker_idx" ON "event_speakers" USING btree ("speaker_id");--> statement-breakpoint
CREATE INDEX "event_sponsors_event_idx" ON "event_sponsors" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_sponsors_tier_order_idx" ON "event_sponsors" USING btree ("event_id","tier","display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "event_tracks_event_name_unique" ON "event_tracks" USING btree ("event_id","name");--> statement-breakpoint
CREATE INDEX "event_tracks_event_idx" ON "event_tracks" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "session_speakers_session_speaker_unique" ON "session_speakers" USING btree ("session_id","speaker_id");--> statement-breakpoint
CREATE INDEX "session_speakers_session_idx" ON "session_speakers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_speakers_speaker_idx" ON "session_speakers" USING btree ("speaker_id");--> statement-breakpoint
CREATE INDEX "speakers_org_idx" ON "speakers" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "speakers_org_name_idx" ON "speakers" USING btree ("organization_id","name");