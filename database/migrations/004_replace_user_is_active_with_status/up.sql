-- Migration 004: Replace user is_active with status ENUM
-- Description: Replace boolean is_active field with status ENUM (active, inactive, suspended)
-- Author: Development Team
-- Date: 2024-12-31

-- Step 1: Create user_status ENUM type
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Step 2: Add new status column with default value
ALTER TABLE users 
ADD COLUMN status user_status DEFAULT 'active' NOT NULL;

-- Step 3: Migrate existing data
-- Convert is_active boolean to status enum (if column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        -- Update status based on is_active value
        UPDATE users 
        SET status = CASE 
            WHEN is_active = true THEN 'active'::user_status
            WHEN is_active = false THEN 'inactive'::user_status
            ELSE 'active'::user_status
        END;
        
        -- Drop the old is_active column
        ALTER TABLE users DROP COLUMN is_active;
    END IF;
END $$;

-- Step 4: Update RLS policies to use status instead of is_active
-- Drop existing policy that might reference is_active
DROP POLICY IF EXISTS "Users can update their own record" ON users;

-- Create new policy using status field
CREATE POLICY "Users can update their own record" ON users
    FOR UPDATE USING (auth.uid() = id AND status = 'active')
    WITH CHECK (auth.uid() = id AND status IN ('active', 'inactive'));

-- Step 5: Add comment for documentation
COMMENT ON COLUMN users.status IS 'User account status: active (can login), inactive (disabled), suspended (temporarily blocked)';
COMMENT ON TYPE user_status IS 'Enum for user account status values';