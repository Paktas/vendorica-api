-- Migration 004 Rollback: Restore is_active boolean field
-- Description: Remove status ENUM and restore is_active boolean field
-- Author: Development Team
-- Date: 2024-12-31

-- Step 1: Add back is_active boolean column
ALTER TABLE users 
ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;

-- Step 2: Migrate status enum back to boolean
UPDATE users 
SET is_active = CASE 
    WHEN status = 'active' THEN true
    WHEN status IN ('inactive', 'suspended') THEN false
    ELSE true
END;

-- Step 3: Drop the status column
ALTER TABLE users DROP COLUMN status;

-- Step 4: Drop the user_status enum type
DROP TYPE user_status;

-- Step 5: Restore original RLS policy
DROP POLICY IF EXISTS "Users can update their own record" ON users;

CREATE POLICY "Users can update their own record" ON users
    FOR UPDATE USING (auth.uid() = id AND is_active = true)
    WITH CHECK (auth.uid() = id);