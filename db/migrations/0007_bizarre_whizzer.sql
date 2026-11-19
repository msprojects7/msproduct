CREATE TABLE "event_promo_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"discount_type" varchar(50) DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"applicable_ticket_ids" jsonb,
	"min_purchase_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"max_total_redemptions" integer,
	"current_redemptions" integer DEFAULT 0 NOT NULL,
	"max_redemptions_per_user" integer DEFAULT 1 NOT NULL,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"ticket_type" varchar(50) DEFAULT 'paid' NOT NULL,
	"category" varchar(100) DEFAULT 'general' NOT NULL,
	"price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"total_quantity" integer DEFAULT 100 NOT NULL,
	"sold_quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"min_per_order" integer DEFAULT 1 NOT NULL,
	"max_per_order" integer DEFAULT 10 NOT NULL,
	"sales_start" timestamp with time zone,
	"sales_end" timestamp with time zone,
	"visibility" varchar(50) DEFAULT 'public' NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_code_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promo_code_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"order_id" uuid,
	"attendee_email" varchar(255) NOT NULL,
	"discount_applied" numeric(10, 2) NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"attendee_id" uuid NOT NULL,
	"field_id" uuid,
	"field_key" varchar(100) NOT NULL,
	"answer_value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_form_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"field_key" varchar(100) NOT NULL,
	"field_label" varchar(255) NOT NULL,
	"field_type" varchar(50) NOT NULL,
	"description" text,
	"placeholder" varchar(255),
	"is_required" boolean DEFAULT false NOT NULL,
	"default_value" text,
	"options" jsonb,
	"validation_rules" jsonb,
	"conditional_logic" jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"title" varchar(255) DEFAULT 'Standard Registration Form' NOT NULL,
	"description" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"order_number" varchar(100) NOT NULL,
	"ticket_id" uuid NOT NULL,
	"promo_code_id" uuid,
	"attendee_id" uuid,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"gross_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"final_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_phone" varchar(50),
	"payment_provider" varchar(50) DEFAULT 'none' NOT NULL,
	"payment_reference" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_price_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"rule_type" varchar(50) NOT NULL,
	"discount_type" varchar(50) DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"min_quantity" integer DEFAULT 1 NOT NULL,
	"max_quantity" integer,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_promo_codes" ADD CONSTRAINT "event_promo_codes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_tickets" ADD CONSTRAINT "event_tickets_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemptions" ADD CONSTRAINT "promo_code_redemptions_promo_code_id_event_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."event_promo_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_code_redemptions" ADD CONSTRAINT "promo_code_redemptions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_order_id_registration_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."registration_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_answers" ADD CONSTRAINT "registration_answers_field_id_registration_form_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."registration_form_fields"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_form_fields" ADD CONSTRAINT "registration_form_fields_form_id_registration_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."registration_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_form_fields" ADD CONSTRAINT "registration_form_fields_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_forms" ADD CONSTRAINT "registration_forms_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_orders" ADD CONSTRAINT "registration_orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_orders" ADD CONSTRAINT "registration_orders_ticket_id_event_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."event_tickets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_orders" ADD CONSTRAINT "registration_orders_promo_code_id_event_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."event_promo_codes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_orders" ADD CONSTRAINT "registration_orders_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_price_rules" ADD CONSTRAINT "ticket_price_rules_ticket_id_event_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."event_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_price_rules" ADD CONSTRAINT "ticket_price_rules_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_promo_codes_event_code_unique" ON "event_promo_codes" USING btree ("event_id","code");--> statement-breakpoint
CREATE INDEX "event_promo_codes_event_idx" ON "event_promo_codes" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_tickets_event_idx" ON "event_tickets" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_tickets_event_status_idx" ON "event_tickets" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "event_tickets_event_order_idx" ON "event_tickets" USING btree ("event_id","display_order");--> statement-breakpoint
CREATE INDEX "promo_redemptions_promo_idx" ON "promo_code_redemptions" USING btree ("promo_code_id");--> statement-breakpoint
CREATE INDEX "promo_redemptions_event_idx" ON "promo_code_redemptions" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "promo_redemptions_user_promo_idx" ON "promo_code_redemptions" USING btree ("promo_code_id","attendee_email");--> statement-breakpoint
CREATE INDEX "reg_answers_order_idx" ON "registration_answers" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "reg_answers_attendee_idx" ON "registration_answers" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "reg_answers_field_idx" ON "registration_answers" USING btree ("field_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reg_form_fields_form_key_unique" ON "registration_form_fields" USING btree ("form_id","field_key");--> statement-breakpoint
CREATE INDEX "reg_form_fields_form_order_idx" ON "registration_form_fields" USING btree ("form_id","display_order");--> statement-breakpoint
CREATE INDEX "reg_form_fields_event_idx" ON "registration_form_fields" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_forms_event_unique" ON "registration_forms" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "registration_forms_event_idx" ON "registration_forms" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reg_orders_event_order_no_unique" ON "registration_orders" USING btree ("event_id","order_number");--> statement-breakpoint
CREATE INDEX "reg_orders_event_idx" ON "registration_orders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "reg_orders_attendee_idx" ON "registration_orders" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "reg_orders_ticket_idx" ON "registration_orders" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "reg_orders_event_status_idx" ON "registration_orders" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "ticket_price_rules_ticket_idx" ON "ticket_price_rules" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "ticket_price_rules_event_idx" ON "ticket_price_rules" USING btree ("event_id");