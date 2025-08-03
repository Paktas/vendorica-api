-- Migration 023 Rollback: Remove last_login field from users table
-- Description: Remove the last_login timestamp field from users table
-- Author: Development Team
-- Date: 2025-07-30

-- Step 1: Remove last_login column if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) THEN
        ALTER TABLE users DROP COLUMN last_login;
        RAISE NOTICE 'Removed last_login column from users table';
    ELSE
        RAISE NOTICE 'last_login column does not exist in users table';
    END IF;
END $$;

-- Verification: Check that the column is removed
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Verification successful: last_login column removed from users table';
    ELSE
        RAISE EXCEPTION 'Verification failed: last_login column still exists in users table';
    END IF;
END $$;