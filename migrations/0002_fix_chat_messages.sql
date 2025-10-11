-- Fix chat_messages table schema
ALTER TABLE "chat_messages" 
ADD COLUMN "role" text NOT NULL DEFAULT 'user',
ADD COLUMN "content" text NOT NULL DEFAULT '';

-- Update existing records
UPDATE "chat_messages" 
SET 
  "role" = 'user',
  "content" = COALESCE("message", '')
WHERE "content" = '';

-- Make role and content NOT NULL after updating
ALTER TABLE "chat_messages" 
ALTER COLUMN "role" SET NOT NULL,
ALTER COLUMN "content" SET NOT NULL;

-- Add createdAt column if missing
ALTER TABLE "chat_messages" 
ADD COLUMN "created_at" timestamp DEFAULT now();

-- Update existing records with current timestamp
UPDATE "chat_messages" 
SET "created_at" = COALESCE("timestamp", now())
WHERE "created_at" IS NULL;
