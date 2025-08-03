-- Migration 021: Rename Frameworks to Fields
-- Description: Renames framework-related tables and removes framework dependency, focusing on DORA fields only
-- Author: Development Team
-- Date: 2025-07-29

-- Step 1: Drop existing foreign key constraint from framework_fields
ALTER TABLE framework_fields DROP CONSTRAINT IF EXISTS framework_fields_framework_id_fkey;

-- Step 2: Rename tables
ALTER TABLE framework_fields RENAME TO fields;
ALTER TABLE framework_options RENAME TO field_options;
ALTER TABLE framework_field_assignments RENAME TO field_assignments;

-- Step 3: Remove framework_id column and rename framework to domain
ALTER TABLE fields DROP COLUMN framework_id;
ALTER TABLE fields RENAME COLUMN framework TO domain;

-- Step 4: Set all fields to DORA domain since we're focusing on DORA only
UPDATE fields SET domain = 'DORA' WHERE domain IS NOT NULL OR domain != 'DORA';

-- Step 5: Update indexes to match new table names
DROP INDEX IF EXISTS idx_framework_fields_governance;
DROP INDEX IF EXISTS idx_framework_fields_org_custom;

CREATE INDEX idx_fields_governance 
  ON fields(field_group, organization_id, is_active);

CREATE INDEX idx_fields_org_custom 
  ON fields(organization_id) 
  WHERE field_group = 'custom_fields';

-- Step 6: Update RLS policies for new table names
DROP POLICY IF EXISTS "Users can view framework fields with governance" ON fields;
DROP POLICY IF EXISTS "Field creation with governance rules" ON fields;
DROP POLICY IF EXISTS "Field updates with governance rules" ON fields;
DROP POLICY IF EXISTS "Field deletion with governance rules" ON fields;

-- Recreate policies with new table name
CREATE POLICY "Users can view fields with governance" ON fields
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
                AND users.org_id = fields.organization_id
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
                AND u.org_id = fields.organization_id
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
                AND u.org_id = fields.organization_id
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
                AND u.org_id = fields.organization_id
            ))
    );

-- Step 7: Update field_assignments table foreign key
ALTER TABLE field_assignments RENAME COLUMN framework_field_id TO field_id;

-- Step 8: Add comments for documentation
COMMENT ON TABLE fields IS 'DORA compliance fields with governance controls';
COMMENT ON COLUMN fields.domain IS 'Field domain (DORA for compliance fields)';
COMMENT ON COLUMN fields.field_group IS 'Governance group: core_fields (DORA mandatory), optional_fields (DORA optional), custom_fields (organization-specific)';
COMMENT ON COLUMN fields.organization_id IS 'Organization that owns this custom field (NULL for system fields)';

-- Step 9: Note that the frameworks table will be dropped in a separate migration
-- This allows for gradual migration and rollback if needed