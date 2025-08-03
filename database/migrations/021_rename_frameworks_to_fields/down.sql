-- Migration 021: Rename Frameworks to Fields - Rollback
-- Description: Reverts framework to fields renaming
-- Author: Development Team
-- Date: 2025-07-29

-- Step 1: Drop new RLS policies
DROP POLICY IF EXISTS "Users can view fields with governance" ON fields;
DROP POLICY IF EXISTS "Field creation with governance rules" ON fields;
DROP POLICY IF EXISTS "Field updates with governance rules" ON fields;
DROP POLICY IF EXISTS "Field deletion with governance rules" ON fields;

-- Step 2: Restore original RLS policies with framework naming
CREATE POLICY "Users can view framework fields with governance" ON fields
    FOR SELECT USING (
        -- Core and optional fields are visible to all
        field_group IN ('core_fields', 'optional_fields')
        OR
        -- Custom fields are visible only to the organization that owns them
        (field_group = 'custom_fields' AND (
            -- Check if user belongs to the organization
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.organization_id = fields.organization_id
            )
            OR
            -- Vendorica admins can see all fields
            EXISTS (
                SELECT 1 FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = auth.uid()
                AND r.name = 'vendorica_admin'
                AND u.status = 'active'
            )
        ))
    );

CREATE POLICY "Field creation with governance rules" ON fields
    FOR INSERT WITH CHECK (
        -- Only Vendorica admins can create core or optional fields
        (field_group IN ('core_fields', 'optional_fields') AND 
            EXISTS (
                SELECT 1 FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = auth.uid()
                AND r.name = 'vendorica_admin'
                AND u.status = 'active'
            ))
        OR
        -- Organization admins can create custom fields for their org
        (field_group = 'custom_fields' AND 
            EXISTS (
                SELECT 1 FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = auth.uid()
                AND r.name IN ('administrator', 'supervisor')
                AND u.status = 'active'
                AND u.organization_id = fields.organization_id
            ))
    );

CREATE POLICY "Field updates with governance rules" ON fields
    FOR UPDATE USING (
        -- Core fields cannot be modified by anyone except Vendorica admin
        (field_group = 'core_fields' AND 
            EXISTS (
                SELECT 1 FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = auth.uid()
                AND r.name = 'vendorica_admin'
                AND u.status = 'active'
            ))
        OR
        -- Optional fields can be toggled by org admins, fully modified by Vendorica admin
        (field_group = 'optional_fields' AND (
            -- Vendorica admin can modify everything
            EXISTS (
                SELECT 1 FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = auth.uid()
                AND r.name = 'vendorica_admin'
                AND u.status = 'active'
            )
            OR
            -- Org admins can toggle is_active for optional fields
            EXISTS (
                SELECT 1 FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = auth.uid()
                AND r.name IN ('administrator', 'supervisor')
                AND u.status = 'active'
            )
        ))
        OR
        -- Custom fields can be modified by the organization that owns them
        (field_group = 'custom_fields' AND 
            EXISTS (
                SELECT 1 FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = auth.uid()
                AND r.name IN ('administrator', 'supervisor')
                AND u.status = 'active'
                AND u.organization_id = fields.organization_id
            ))
    );

CREATE POLICY "Field deletion with governance rules" ON fields
    FOR DELETE USING (
        -- Core and optional fields can only be deleted by Vendorica admin
        (field_group IN ('core_fields', 'optional_fields') AND 
            EXISTS (
                SELECT 1 FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = auth.uid()
                AND r.name = 'vendorica_admin'
                AND u.status = 'active'
            ))
        OR
        -- Custom fields can be deleted by the organization that owns them
        (field_group = 'custom_fields' AND 
            EXISTS (
                SELECT 1 FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = auth.uid()
                AND r.name IN ('administrator', 'supervisor')
                AND u.status = 'active'
                AND u.organization_id = fields.organization_id
            ))
    );

-- Step 3: Drop new indexes
DROP INDEX IF EXISTS idx_fields_governance;
DROP INDEX IF EXISTS idx_fields_org_custom;

-- Step 4: Restore original indexes
CREATE INDEX idx_framework_fields_governance 
  ON fields(field_group, organization_id, is_active);

CREATE INDEX idx_framework_fields_org_custom 
  ON fields(organization_id) 
  WHERE field_group = 'custom_fields';

-- Step 5: Revert column names and restore framework_id
ALTER TABLE fields RENAME COLUMN domain TO framework;
ALTER TABLE fields ADD COLUMN framework_id UUID REFERENCES frameworks(id);

-- Step 6: Rename field_assignments table back
ALTER TABLE field_assignments RENAME COLUMN field_id TO framework_field_id;

-- Step 7: Rename tables back to original names
ALTER TABLE field_assignments RENAME TO framework_field_assignments;
ALTER TABLE field_options RENAME TO framework_options;
ALTER TABLE fields RENAME TO framework_fields;