-- Migration 015: Fix Role Dependencies and Complete Migration
-- Description: Properly handle all dependencies on users.role column before removal
-- Author: Development Team
-- Date: 2025-07-27

-- Step 1: Verify all users have valid role_id before proceeding
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    WHERE u.role_id IS NULL OR r.id IS NULL;
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Cannot proceed: % users have invalid role_id references', invalid_count;
    END IF;
    
    RAISE NOTICE 'Role validation successful: All users have valid role references';
END $$;

-- Step 2: Update all RLS policies to use role_id with roles table join
-- Framework policies that check for administrator role
DROP POLICY IF EXISTS "Only administrators can modify frameworks" ON frameworks;
CREATE POLICY "Only administrators can modify frameworks" ON frameworks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'administrator'
            AND u.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Only administrators can modify framework fields" ON framework_fields;
CREATE POLICY "Only administrators can modify framework fields" ON framework_fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'administrator'
            AND u.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Only administrators can modify framework options" ON framework_options;
CREATE POLICY "Only administrators can modify framework options" ON framework_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'administrator'
            AND u.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Only administrators can modify framework field assignments" ON framework_field_assignments;
CREATE POLICY "Only administrators can modify framework field assignments" ON framework_field_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = auth.uid()
            AND r.name = 'administrator'
            AND u.status = 'active'
        )
    );

-- Step 3: Update audit_trail_view to use role_id with roles table join
DROP VIEW IF EXISTS audit_trail_view;
CREATE VIEW audit_trail_view AS
SELECT 
    at.id,
    at.entity_type,
    at.entity_id,
    at.operation,
    at.old_values,
    at.new_values,
    at.changed_fields,
    at.user_email,
    at.user_role,
    at.description,
    at.severity,
    at.created_at,
    -- Join with users table for additional user info using new role system
    u.email as current_user_email,
    r.name as current_user_role
FROM audit_trail at
LEFT JOIN users u ON u.id = at.user_id
LEFT JOIN roles r ON u.role_id = r.id
ORDER BY at.created_at DESC;

-- Step 4: Now safe to drop the old role column constraints and indexes
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
DROP INDEX IF EXISTS idx_users_role;

-- Step 5: Remove old role column (this makes the migration irreversible)
ALTER TABLE users DROP COLUMN IF EXISTS role;

-- Step 6: Update table comment to reflect new structure  
COMMENT ON TABLE users IS 'Application users with role-based access control via roles table';

-- Step 7: Verify users_with_roles view still works
DO $$
DECLARE
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO view_count FROM users_with_roles LIMIT 1;
    RAISE NOTICE 'users_with_roles view is working correctly';
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'users_with_roles view has issues: %', SQLERRM;
END $$;

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