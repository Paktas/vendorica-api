-- Migration 016: Add missing updated_at field to users table
-- Description: Add updated_at timestamp field and trigger to users table if not exists
-- Author: Development Team
-- Date: 2025-07-27

-- Step 1: Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to users table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in users table';
    END IF;
END $$;

-- Step 2: Ensure trigger exists for updating updated_at
-- First check if the trigger function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    ) THEN
        -- Create the trigger function if it doesn't exist
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
        RAISE NOTICE 'Created update_updated_at_column function';
    ELSE
        RAISE NOTICE 'update_updated_at_column function already exists';
    END IF;
END $$;

-- Step 3: Create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at 
            BEFORE UPDATE ON users 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_users_updated_at trigger';
    ELSE
        RAISE NOTICE 'update_users_updated_at trigger already exists';
    END IF;
END $$;

-- Step 4: Update existing records to have current timestamp if updated_at is null
UPDATE users 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Verification: Check that the column exists
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'Verification successful: updated_at column exists in users table';
    ELSE
        RAISE EXCEPTION 'Verification failed: updated_at column missing from users table';
    END IF;
END $$;