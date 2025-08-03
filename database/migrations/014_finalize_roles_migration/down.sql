-- Migration 014 Rollback: Restore old role column system
-- Description: Recreate role string column and restore original constraints
-- WARNING: This rollback requires role_id data to be intact

-- Step 1: Verify role_id column and data exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'role_id'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'Cannot rollback: role_id column does not exist';
    END IF;
END $$;

-- Step 2: Drop the helper view
DROP VIEW IF EXISTS users_with_roles;

-- Step 3: Add back the role string column
ALTER TABLE users ADD COLUMN role VARCHAR(20);

-- Step 4: Restore role data from roles table
UPDATE users 
SET role = (
    SELECT r.name 
    FROM roles r 
    WHERE r.id = users.role_id
);

-- Step 5: Verify all users have role strings restored
DO $$
DECLARE
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_count
    FROM users 
    WHERE role IS NULL;
    
    IF missing_count > 0 THEN
        RAISE EXCEPTION 'Rollback failed: % users do not have role string restored', missing_count;
    END IF;
    
    RAISE NOTICE 'Role string restoration successful';
END $$;

-- Step 6: Add NOT NULL constraint to role column
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

-- Step 7: Add default value
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- Step 8: Restore CHECK constraint for role values
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'supervisor', 'administrator'));

-- Step 9: Recreate role index
CREATE INDEX idx_users_role ON users(role);

-- Step 10: Update table comment back to original
COMMENT ON TABLE users IS 'Application users with role-based access control and preferences';

-- Final verification
SELECT 
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY 
    CASE role 
        WHEN 'administrator' THEN 1
        WHEN 'supervisor' THEN 2
        WHEN 'user' THEN 3
        ELSE 4
    END;