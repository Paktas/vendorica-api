-- Migration 015 Rollback: Restore role column and old dependencies
-- Description: Recreate role string column and restore original RLS policies
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

-- Step 2: Add back the role string column
ALTER TABLE users ADD COLUMN role VARCHAR(20);

-- Step 3: Restore role data from roles table
UPDATE users 
SET role = (
    SELECT r.name 
    FROM roles r 
    WHERE r.id = users.role_id
);

-- Step 4: Verify all users have role strings restored
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

-- Step 5: Add NOT NULL constraint to role column
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

-- Step 6: Add default value
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- Step 7: Restore CHECK constraint for role values
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('user', 'supervisor', 'administrator'));

-- Step 8: Recreate role index
CREATE INDEX idx_users_role ON users(role);

-- Step 9: Restore original RLS policies using users.role
-- Framework policies
DROP POLICY IF EXISTS "Only administrators can modify frameworks" ON frameworks;
CREATE POLICY "Only administrators can modify frameworks" ON frameworks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'administrator'
            AND users.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Only administrators can modify framework fields" ON framework_fields;
CREATE POLICY "Only administrators can modify framework fields" ON framework_fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'administrator'
            AND users.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Only administrators can modify framework options" ON framework_options;
CREATE POLICY "Only administrators can modify framework options" ON framework_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'administrator'
            AND users.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Only administrators can modify framework field assignments" ON framework_field_assignments;
CREATE POLICY "Only administrators can modify framework field assignments" ON framework_field_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'administrator'
            AND users.status = 'active'
        )
    );

-- Step 10: Restore original audit_trail_view
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
    -- Join with users table for additional user info
    u.email as current_user_email,
    u.role as current_user_role
FROM audit_trail at
LEFT JOIN users u ON u.id = at.user_id
ORDER BY at.created_at DESC;

-- Step 11: Update table comment back to original
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