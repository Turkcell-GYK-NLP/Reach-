-- Migration: Recreate users table with correct schema
-- This migration safely recreates the users table to match schema.ts

-- Drop existing tables that depend on users
DROP TABLE IF EXISTS "call_conversations" CASCADE;
DROP TABLE IF EXISTS "emotional_analysis" CASCADE;
DROP TABLE IF EXISTS "user_profiles" CASCADE;
DROP TABLE IF EXISTS "user_responses" CASCADE;
DROP TABLE IF EXISTS "chat_messages" CASCADE;
DROP TABLE IF EXISTS "emergency_contacts" CASCADE;

-- Drop and recreate users table
DROP TABLE IF EXISTS "users" CASCADE;

CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"password_hash" text,
	"phone" text,
	"age_years" integer NOT NULL,
	"gender" text,
	"locale" text NOT NULL DEFAULT 'tr-TR',
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);

-- Recreate unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" USING btree ("email");

-- Recreate chat_messages table
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"session_id" varchar,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);

ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- Recreate emergency_contacts table
CREATE TABLE IF NOT EXISTS "emergency_contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"relationship" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Recreate user_profiles table
CREATE TABLE IF NOT EXISTS "user_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL UNIQUE,
	"positivity" real DEFAULT 0.5,
	"anxiety_level" real DEFAULT 0.5,
	"hope_level" real DEFAULT 0.5,
	"social_connection" real DEFAULT 0.5,
	"shelter_need" real DEFAULT 0.5,
	"food_need" real DEFAULT 0.5,
	"communication_need" real DEFAULT 0.5,
	"medical_need" real DEFAULT 0.5,
	"psychological_need" real DEFAULT 0.5,
	"trauma_severity" text DEFAULT 'medium',
	"recovery_trend" text DEFAULT 'stable',
	"support_network_size" text DEFAULT 'moderate',
	"family_connection" text DEFAULT 'worried',
	"trust_level" real DEFAULT 0.5,
	"response_frequency" real DEFAULT 0.5,
	"engagement_depth" real DEFAULT 0.5,
	"help_seeking_behavior" text DEFAULT 'moderate',
	"last_assessment" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

-- Recreate user_responses table
CREATE TABLE IF NOT EXISTS "user_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"question_id" text NOT NULL,
	"answer" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);

ALTER TABLE "user_responses" ADD CONSTRAINT "user_responses_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;

