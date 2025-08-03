-- Migration 020: Add Field Governance
-- Description: Implements hybrid field governance system for DORA compliance
-- Author: Development Team
-- Date: 2025-07-29

-- Step 1: Add governance columns to framework_fields table
ALTER TABLE framework_fields 
ADD COLUMN field_group VARCHAR(20) 
  CHECK (field_group IN ('core_fields', 'optional_fields', 'custom_fields')) 
  NOT NULL DEFAULT 'custom_fields';

ALTER TABLE framework_fields 
ADD COLUMN organization_id UUID 
  REFERENCES organizations(id) ON DELETE CASCADE;

-- Step 2: Add composite indexes for performance
CREATE INDEX idx_framework_fields_governance 
  ON framework_fields(field_group, organization_id, is_active);


CREATE INDEX idx_framework_fields_org_custom 
  ON framework_fields(organization_id) 
  WHERE field_group = 'custom_fields';

-- Step 3: Drop existing RLS policies for framework_fields
DROP POLICY IF EXISTS "Users can view all framework fields" ON framework_fields;
DROP POLICY IF EXISTS "Only administrators can modify framework fields" ON framework_fields;

-- Step 4: Create new RLS policies with governance rules

-- Policy for viewing fields
CREATE POLICY "Users can view framework fields with governance" ON framework_fields
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
                AND users.org_id = framework_fields.organization_id
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

-- Policy for inserting fields
CREATE POLICY "Field creation with governance rules" ON framework_fields
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
                AND u.org_id = framework_fields.organization_id
            ))
    );

-- Policy for updating fields
CREATE POLICY "Field updates with governance rules" ON framework_fields
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
        -- Optional fields can be toggled (is_active) by org admins, fully modified by Vendorica admin
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
                AND u.org_id = framework_fields.organization_id
            ))
    );

-- Policy for deleting fields
CREATE POLICY "Field deletion with governance rules" ON framework_fields
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
                AND u.org_id = framework_fields.organization_id
            ))
    );

-- Step 5: Create Vendorica admin role if it doesn't exist
INSERT INTO roles (name, display_name, description, is_system, is_active)
VALUES (
    'vendorica_admin',
    'Vendorica Administrator',
    'System-level administrator with full access to all Vendorica features and data',
    true,
    true
) ON CONFLICT (name) DO NOTHING;

-- Step 6: Migrate existing fields to appropriate groups
-- All existing fields will be marked as custom_fields initially
UPDATE framework_fields 
SET field_group = 'custom_fields'
WHERE field_group IS NULL;

-- Step 7: Add comments for documentation
COMMENT ON COLUMN framework_fields.field_group IS 'Governance group: core_fields (DORA mandatory, system-managed), optional_fields (DORA optional), custom_fields (organization-specific)';
COMMENT ON COLUMN framework_fields.organization_id IS 'Organization that owns this custom field (NULL for system fields)';

-- Step 8: Create sample DORA core fields (these would be added by Vendorica admin)
-- This is commented out as it should be done through the application, not migration
/*
INSERT INTO framework_fields (
    framework_id, framework, code, label, description, 
    field_type, required, field_group, help_text
) VALUES 
    -- Example DORA core fields (code field contains EBA reference)
    (NULL, 'DORA', 'EBA-GL-2024-01', 'ICT Risk Management', 
     'Assessment of ICT risk management framework', 
     'select', true, 'core_fields',
     'Mandatory DORA requirement for ICT risk management'),
    
    (NULL, 'DORA', 'EBA-GL-2024-02', 'Incident Reporting Capability', 
     'Major ICT-related incident reporting procedures', 
     'multiselect', true, 'core_fields',
     'Mandatory DORA requirement for incident reporting'),
    
    -- Example DORA optional fields
    (NULL, 'DORA', 'EBA-GL-2024-15', 'Recovery Time Objective', 
     'Target time for service recovery', 
     'number', false, 'optional_fields',
     'Optional DORA field for recovery planning');
*/