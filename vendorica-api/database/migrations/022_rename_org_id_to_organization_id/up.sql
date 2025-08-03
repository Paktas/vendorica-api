-- Migration 022: Rename org_id to organization_id
-- Description: Standardizes column naming from org_id to organization_id across all tables
-- Author: Development Team
-- Date: 2025-07-30

-- Step 1: Rename org_id column in users table
ALTER TABLE users RENAME COLUMN org_id TO organization_id;

-- Step 2: Rename org_id column in vendors table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'vendors' AND column_name = 'org_id') THEN
        ALTER TABLE vendors RENAME COLUMN org_id TO organization_id;
    END IF;
END $$;

-- Step 3: Rename org_id column in contracts table (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'contracts' AND column_name = 'org_id') THEN
        ALTER TABLE contracts RENAME COLUMN org_id TO organization_id;
    END IF;
END $$;

-- Step 4: Update all RLS policies that reference org_id
-- Note: We need to drop and recreate policies as they cannot be altered

-- Update contracts RLS policies
DROP POLICY IF EXISTS "Users can view contracts from their organization" ON contracts;
CREATE POLICY "Users can view contracts from their organization" ON contracts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vendors v
            JOIN users u ON u.id = auth.uid()
            WHERE v.id = contracts.vendor_id
            AND u.organization_id = v.organization_id
        )
    );

DROP POLICY IF EXISTS "Users can update contracts from their organization" ON contracts;
CREATE POLICY "Users can update contracts from their organization" ON contracts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM vendors v
            JOIN users u ON u.id = auth.uid()
            WHERE v.id = contracts.vendor_id
            AND u.organization_id = v.organization_id
            AND u.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Users can insert contracts for vendors in their organization" ON contracts;
CREATE POLICY "Users can insert contracts for vendors in their organization" ON contracts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors v
            JOIN users u ON u.id = auth.uid()
            WHERE v.id = contracts.vendor_id
            AND u.organization_id = v.organization_id
            AND u.status = 'active'
        )
    );

DROP POLICY IF EXISTS "Users can delete contracts from their organization" ON contracts;
CREATE POLICY "Users can delete contracts from their organization" ON contracts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM vendors v
            JOIN users u ON u.id = auth.uid()
            JOIN roles r ON u.role_id = r.id
            WHERE v.id = contracts.vendor_id
            AND u.organization_id = v.organization_id
            AND r.name IN ('administrator', 'supervisor')
            AND u.status = 'active'
        )
    );

-- Update fields RLS policies (from migration 021)
DROP POLICY IF EXISTS "Users can view fields with governance" ON fields;
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

DROP POLICY IF EXISTS "Field creation with governance rules" ON fields;
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

DROP POLICY IF EXISTS "Field updates with governance rules" ON fields;
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

DROP POLICY IF EXISTS "Field deletion with governance rules" ON fields;
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

-- Step 5: Update indexes
DROP INDEX IF EXISTS idx_users_org_id;
CREATE INDEX idx_users_organization_id ON users(organization_id);

-- Step 6: Update any views that might reference org_id
-- Note: Add any view updates here if needed

-- Step 7: Add comments for documentation
COMMENT ON COLUMN users.organization_id IS 'Foreign key reference to the organization this user belongs to';

-- Add comments for other tables if columns exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'vendors' AND column_name = 'organization_id') THEN
        EXECUTE 'COMMENT ON COLUMN vendors.organization_id IS ''Foreign key reference to the organization that owns this vendor''';
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'contracts' AND column_name = 'organization_id') THEN
        EXECUTE 'COMMENT ON COLUMN contracts.organization_id IS ''Foreign key reference to the organization that owns this contract''';
    END IF;
END $$;