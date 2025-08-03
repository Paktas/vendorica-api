-- Migration 009 Rollback: Revert users table UUID generation and column naming changes
-- Description: Remove UUID auto-generation from users.id and revert org_id back to organization_id
-- Author: Development Team
-- Date: 2025-07-27

-- Step 1: Remove DEFAULT uuid_generate_v4() from users.id column
ALTER TABLE users 
ALTER COLUMN id DROP DEFAULT;

-- Step 2: Rename org_id back to organization_id if the column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'org_id') THEN
        -- Rename the column back
        ALTER TABLE users RENAME COLUMN org_id TO organization_id;
        
        -- Update indexes
        DROP INDEX IF EXISTS idx_users_org_id;
        CREATE INDEX idx_users_organization_id ON users(organization_id);
    END IF;
END $$;

-- Step 3: Revert vendors table back to organization_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'org_id') THEN
        ALTER TABLE vendors RENAME COLUMN org_id TO organization_id;
        DROP INDEX IF EXISTS idx_vendors_org_id;
        CREATE INDEX idx_vendors_organization_id ON vendors(organization_id);
        ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_org_id_fkey;
        ALTER TABLE vendors ADD CONSTRAINT vendors_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Step 4: Revert framework tables back to organization_id
DO $$
BEGIN
    -- Framework fields
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'framework_fields' AND column_name = 'org_id') THEN
        ALTER TABLE framework_fields RENAME COLUMN org_id TO organization_id;
        DROP INDEX IF EXISTS idx_framework_fields_org_id;
        CREATE INDEX idx_framework_fields_organization_id ON framework_fields(organization_id);
        ALTER TABLE framework_fields DROP CONSTRAINT IF EXISTS framework_fields_org_id_fkey;
        ALTER TABLE framework_fields ADD CONSTRAINT framework_fields_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;
    END IF;
    
    -- Framework options
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'framework_options' AND column_name = 'org_id') THEN
        ALTER TABLE framework_options RENAME COLUMN org_id TO organization_id;
        DROP INDEX IF EXISTS idx_framework_options_org_id;
        CREATE INDEX idx_framework_options_organization_id ON framework_options(organization_id);
        ALTER TABLE framework_options DROP CONSTRAINT IF EXISTS framework_options_org_id_fkey;
        ALTER TABLE framework_options ADD CONSTRAINT framework_options_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;
    END IF;
    
    -- Framework field assignments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'framework_field_assignments' AND column_name = 'org_id') THEN
        ALTER TABLE framework_field_assignments RENAME COLUMN org_id TO organization_id;
        DROP INDEX IF EXISTS idx_framework_assignments_org_id;
        CREATE INDEX idx_framework_assignments_organization_id ON framework_field_assignments(organization_id);
        ALTER TABLE framework_field_assignments DROP CONSTRAINT IF EXISTS framework_field_assignments_org_id_fkey;
        ALTER TABLE framework_field_assignments ADD CONSTRAINT framework_field_assignments_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;
    END IF;
END $$;