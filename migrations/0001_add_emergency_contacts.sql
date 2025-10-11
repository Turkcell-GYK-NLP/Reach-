CREATE TABLE "emergency_contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"relationship" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"last_contact" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
