-- Fix users table if name column is missing
DO $$ 
BEGIN
    -- Check if name column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'name'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "name" text;
    END IF;
    
    -- Check if password_hash column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "password_hash" text;
    END IF;
    
    -- Check if age column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'age'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "age" integer;
    END IF;
    
    -- Check if location column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'location'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "location" text;
    END IF;
    
    -- Check if operator column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'operator'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "operator" text;
    END IF;
    
    -- Check if preferences column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'preferences'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "preferences" jsonb DEFAULT '{}'::jsonb;
    END IF;
    
    -- Check if notifications_enabled column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'notifications_enabled'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "notifications_enabled" boolean DEFAULT true;
    END IF;
    
    -- Check if created_at column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "created_at" timestamp DEFAULT now();
    END IF;
END $$;
