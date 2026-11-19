CREATE TABLE "email_delivery_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"order_id" uuid,
	"recipient_email" varchar(255) NOT NULL,
	"email_type" varchar(100) NOT NULL,
	"subject" text NOT NULL,
	"status" varchar(50) DEFAULT 'sent' NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_websites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"theme" jsonb DEFAULT '{"primaryColor":"#2563eb","secondaryColor":"#4f46e5","accentColor":"#06b6d4","darkMode":false}'::jsonb NOT NULL,
	"hero_title" varchar(255),
	"hero_subtitle" text,
	"hero_cover_url" text,
	"logo_url" text,
	"about_text" text,
	"sections_config" jsonb DEFAULT '[{"id":"about","title":"About Event","isVisible":true,"displayOrder":0},{"id":"tickets","title":"Passes & Registration","isVisible":true,"displayOrder":1},{"id":"speakers","title":"Featured Speakers","isVisible":true,"displayOrder":2},{"id":"agenda","title":"Schedule & Sessions","isVisible":true,"displayOrder":3},{"id":"sponsors","title":"Partners & Sponsors","isVisible":true,"displayOrder":4},{"id":"exhibitors","title":"Exhibitors","isVisible":true,"displayOrder":5},{"id":"contact","title":"Venue & Contact","isVisible":true,"displayOrder":6}]'::jsonb NOT NULL,
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"address" text,
	"footer_text" text,
	"social_links" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"seo_title" varchar(255),
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"status" varchar(50) DEFAULT 'reserved' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"payment_provider" varchar(50) DEFAULT 'razorpay' NOT NULL,
	"gateway_order_id" varchar(255),
	"gateway_payment_id" varchar(255),
	"gateway_signature" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR' NOT NULL,
	"status" varchar(50) DEFAULT 'created' NOT NULL,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gateway_event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payment_provider" varchar(50) DEFAULT 'razorpay' NOT NULL,
	"payload" jsonb,
	"processed" boolean DEFAULT false NOT NULL,
	"processing_error" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"attendee_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"subtotal" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"final_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"attendee_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"ticket_token" varchar(255) NOT NULL,
	"download_url" text,
	"storage_key" text,
	"status" varchar(50) DEFAULT 'ready' NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "registration_orders" ADD COLUMN "order_reference" varchar(100);--> statement-breakpoint
ALTER TABLE "registration_orders" ADD COLUMN "reservation_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_order_id_registration_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."registration_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_websites" ADD CONSTRAINT "event_websites_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_websites" ADD CONSTRAINT "event_websites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_order_id_registration_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."registration_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_ticket_id_event_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."event_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_registration_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."registration_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_order_items" ADD CONSTRAINT "registration_order_items_order_id_registration_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."registration_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_order_items" ADD CONSTRAINT "registration_order_items_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_order_items" ADD CONSTRAINT "registration_order_items_ticket_id_event_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."event_tickets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_order_items" ADD CONSTRAINT "registration_order_items_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_documents" ADD CONSTRAINT "ticket_documents_order_id_registration_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."registration_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_documents" ADD CONSTRAINT "ticket_documents_attendee_id_attendees_id_fk" FOREIGN KEY ("attendee_id") REFERENCES "public"."attendees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_documents" ADD CONSTRAINT "ticket_documents_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_logs_event_idx" ON "email_delivery_logs" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "email_logs_order_idx" ON "email_delivery_logs" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "email_logs_recipient_idx" ON "email_delivery_logs" USING btree ("recipient_email");--> statement-breakpoint
CREATE UNIQUE INDEX "event_websites_event_unique" ON "event_websites" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_websites_org_idx" ON "event_websites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "inv_res_order_idx" ON "inventory_reservations" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "inv_res_ticket_idx" ON "inventory_reservations" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "inv_res_status_idx" ON "inventory_reservations" USING btree ("event_id","status","expires_at");--> statement-breakpoint
CREATE INDEX "pay_tx_order_idx" ON "payment_transactions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "pay_tx_gateway_order_idx" ON "payment_transactions" USING btree ("gateway_order_id");--> statement-breakpoint
CREATE INDEX "pay_tx_gateway_pay_idx" ON "payment_transactions" USING btree ("gateway_payment_id");--> statement-breakpoint
CREATE INDEX "pay_tx_event_idx" ON "payment_transactions" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pay_webhook_event_unique" ON "payment_webhook_events" USING btree ("gateway_event_id");--> statement-breakpoint
CREATE INDEX "pay_webhook_processed_idx" ON "payment_webhook_events" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "reg_order_items_order_idx" ON "registration_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "reg_order_items_ticket_idx" ON "registration_order_items" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX "reg_order_items_attendee_idx" ON "registration_order_items" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "reg_order_items_event_idx" ON "registration_order_items" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_docs_token_unique" ON "ticket_documents" USING btree ("ticket_token");--> statement-breakpoint
CREATE INDEX "ticket_docs_attendee_idx" ON "ticket_documents" USING btree ("attendee_id");--> statement-breakpoint
CREATE INDEX "ticket_docs_order_idx" ON "ticket_documents" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "ticket_docs_event_idx" ON "ticket_documents" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "reg_orders_order_ref_idx" ON "registration_orders" USING btree ("order_reference");