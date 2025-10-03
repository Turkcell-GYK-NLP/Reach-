CREATE TABLE "call_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"call_id" varchar NOT NULL,
	"assistant_id" varchar,
	"status" text,
	"started_at" timestamp,
	"ended_at" timestamp,
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"summary" text,
	"transcript" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "category_analysis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"total_count" integer NOT NULL,
	"affected_cities" integer NOT NULL,
	"top_topics" jsonb NOT NULL,
	"most_affected_city" text,
	"most_affected_city_count" integer,
	"timeframe" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"analyzed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"message" text NOT NULL,
	"response" text,
	"timestamp" timestamp DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "emergency_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" text NOT NULL,
	"location" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "emotional_analysis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"emotional_trend" text NOT NULL,
	"risk_factors" jsonb DEFAULT '[]'::jsonb,
	"recommendations" jsonb DEFAULT '[]'::jsonb,
	"timeframe" text NOT NULL,
	"analysis_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "network_status" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator" text NOT NULL,
	"location" text NOT NULL,
	"coverage" integer NOT NULL,
	"signal_strength" integer,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "social_media_insights" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" text NOT NULL,
	"sentiment" text NOT NULL,
	"count" integer NOT NULL,
	"category" text NOT NULL,
	"location" text,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trending_topics_analysis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"il" text NOT NULL,
	"latitude" real,
	"longitude" real,
	"total_tweets" integer NOT NULL,
	"topics" jsonb NOT NULL,
	"timeframe" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"analyzed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tweet_density_analysis" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"il" text NOT NULL,
	"count" integer NOT NULL,
	"latitude" real,
	"longitude" real,
	"positive_sentiment" integer DEFAULT 0,
	"neutral_sentiment" integer DEFAULT 0,
	"negative_sentiment" integer DEFAULT 0,
	"timeframe" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"analyzed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tweets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tweet_id" varchar NOT NULL,
	"timestamp" timestamp NOT NULL,
	"author" text NOT NULL,
	"text" text NOT NULL,
	"il" text,
	"ilce" text,
	"region" text,
	"latitude" real,
	"longitude" real,
	"disaster_type" text,
	"help_topic" text,
	"sentiment" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
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
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"question_id" text NOT NULL,
	"answer" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"age" integer,
	"location" text,
	"operator" text,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"notifications_enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "call_conversations" ADD CONSTRAINT "call_conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emotional_analysis" ADD CONSTRAINT "emotional_analysis_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_responses" ADD CONSTRAINT "user_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");