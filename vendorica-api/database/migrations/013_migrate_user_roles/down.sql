-- Migration 013 Rollback: Remove role_id from users table
-- Description: Remove role_id column and restore original role string system
-- WARNING: This assumes the original role column still exists

-- Step 1: Verify original role column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Cannot rollback: Original role column does not exist. Migration 014 may have already been applied.';
    END IF;
END $$;

-- Step 2: Verify role data integrity before removing role_id
DO $$
DECLARE
    mismatched_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mismatched_count
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.role != r.name;
    
    IF mismatched_count > 0 THEN
        RAISE WARNING 'Found % users with mismatched role/role_id data', mismatched_count;
    END IF;
END $$;

-- Step 3: Drop foreign key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_id_fkey;

-- Step 4: Drop index
DROP INDEX IF EXISTS idx_users_role_id;

-- Step 5: Remove role_id column
ALTER TABLE users DROP COLUMN IF EXISTS role_id;

-- Verification: Confirm role_id column has been removed
SELECT 
    column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public' 
  AND column_name = 'role_id';