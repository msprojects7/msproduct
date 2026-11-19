CREATE TABLE "platform_administrators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_administrators_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE INDEX "platform_admins_user_idx" ON "platform_administrators" USING btree ("user_id");