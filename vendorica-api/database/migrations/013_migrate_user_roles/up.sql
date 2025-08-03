-- Migration 013: Migrate User Roles to Foreign Key System
-- Description: Add role_id column to users table and migrate existing role data
-- Author: Development Team  
-- Date: 2025-07-27

-- Step 1: Add role_id column to users table (nullable initially for safe migration)
ALTER TABLE users ADD COLUMN role_id UUID;

-- Step 2: Create index for performance during migration
CREATE INDEX idx_users_role_id_temp ON users(role_id);

-- Step 3: Migrate existing role data
-- Map string roles to role UUIDs from the roles table
UPDATE users 
SET role_id = (
    SELECT r.id 
    FROM roles r 
    WHERE r.name = users.role
)
WHERE users.role IN ('user', 'supervisor', 'administrator');

-- Step 4: Verify data migration - check that all users have role_id assigned
DO $$
DECLARE
    unmapped_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmapped_count
    FROM users 
    WHERE role_id IS NULL;
    
    IF unmapped_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % users do not have role_id assigned', unmapped_count;
    END IF;
    
    RAISE NOTICE 'Data migration successful: All users have valid role_id assignments';
END $$;

-- Step 5: Add NOT NULL constraint now that all users have role_id
ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

-- Step 6: Add foreign key constraint
ALTER TABLE users ADD CONSTRAINT users_role_id_fkey 
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;

-- Step 7: Create proper index (drop temp index first)
DROP INDEX idx_users_role_id_temp;
CREATE INDEX idx_users_role_id ON users(role_id);

-- Step 8: Add column comment
COMMENT ON COLUMN users.role_id IS 'Foreign key reference to roles table';

-- Verification: Check role distribution after migration
SELECT 
    r.name as role_name,
    r.display_name,
    COUNT(u.id) as user_count
FROM roles r
LEFT JOIN users u ON u.role_id = r.id
GROUP BY r.id, r.name, r.display_name
ORDER BY 
    CASE r.name 
        WHEN 'administrator' THEN 1
        WHEN 'supervisor' THEN 2
        WHEN 'user' THEN 3
        ELSE 4
    END;