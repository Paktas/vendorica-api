-- Migration 023: Add last_login field to users table
-- Description: Add last_login timestamp field to track user login activity
-- Author: Development Team
-- Date: 2025-07-30

-- Step 1: Add last_login column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_login column to users table';
    ELSE
        RAISE NOTICE 'last_login column already exists in users table';
    END IF;
END $$;

-- Step 2: Add comment to document the field
COMMENT ON COLUMN users.last_login IS 'Timestamp of the user''s most recent successful login';

-- Verification: Check that the column exists
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) INTO column_exists;
    
    IF column_exists THEN
        RAISE NOTICE 'Verification successful: last_login column exists in users table';
    ELSE
        RAISE EXCEPTION 'Verification failed: last_login column missing from users table';
    END IF;
END $$;