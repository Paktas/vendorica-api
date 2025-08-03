-- Migration 016 Rollback: Remove updated_at field from users table
-- Description: Remove updated_at timestamp field and trigger from users table
-- Author: Development Team
-- Date: 2025-07-27

-- Step 1: Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Step 2: Drop the updated_at column if it exists
ALTER TABLE users DROP COLUMN IF EXISTS updated_at;

-- Note: We don't drop the update_updated_at_column function as it might be used by other tables

-- Verification: Check that the column has been removed
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE NOTICE 'Verification successful: updated_at column removed from users table';
    ELSE
        RAISE EXCEPTION 'Verification failed: updated_at column still exists in users table';
    END IF;
END $$;