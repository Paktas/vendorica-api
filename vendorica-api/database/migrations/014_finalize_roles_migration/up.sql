-- Migration 014: Finalize Roles Migration
-- Description: Remove old role column and complete switch to roles table system
-- Author: Development Team
-- Date: 2025-07-27

-- Step 1: Verify all users have valid role_id before final switch
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.role_id IS NULL OR r.id IS NULL;
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Cannot finalize migration: % users have invalid role_id references', invalid_count;
    END IF;
    
    RAISE NOTICE 'Role validation successful: All users have valid role references';
END $$;

-- Step 2: Drop old role column check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 3: Drop old role column index if it exists
DROP INDEX IF EXISTS idx_users_role;

-- Step 4: Remove old role column (this makes the migration irreversible)
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Step 5: Update table comment to reflect new structure  
COMMENT ON TABLE users IS 'Application users with role-based access control via roles table';

-- Step 6: Create view for easy role name access (optional helper)
CREATE OR REPLACE VIEW users_with_roles AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.org_id,
    u.status,
    u.timezone,
    u.date_format,
    u.time_format,
    u.last_login,
    u.created_at,
    u.updated_at,
    r.id as role_id,
    r.name as role_name,
    r.display_name as role_display_name,
    r.description as role_description
FROM users u
JOIN roles r ON u.role_id = r.id;

-- Add comment to view
COMMENT ON VIEW users_with_roles IS 'Convenient view showing users with their role information';

-- Final verification: Show role distribution
SELECT 
    r.name as role_name,
    r.display_name as role_display_name,
    COUNT(u.id) as user_count,
    r.is_system,
    r.is_active
FROM roles r
LEFT JOIN users u ON u.role_id = r.id
GROUP BY r.id, r.name, r.display_name, r.is_system, r.is_active
ORDER BY 
    CASE r.name 
        WHEN 'administrator' THEN 1
        WHEN 'supervisor' THEN 2
        WHEN 'user' THEN 3
        ELSE 4
    END;