-- Migration 009: Fix users table UUID generation and column naming
-- Description: Add UUID auto-generation to users.id and rename organization_id to org_id if needed
-- Author: Development Team
-- Date: 2025-07-27

-- Step 1: Add DEFAULT uuid_generate_v4() to users.id column
-- This allows new users to be created without explicitly providing an ID
ALTER TABLE users 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Step 2: Rename organization_id to org_id if the column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'organization_id') THEN
        -- Rename the column to match the codebase
        ALTER TABLE users RENAME COLUMN organization_id TO org_id;
        
        -- Update any existing indexes
        DROP INDEX IF EXISTS idx_users_organization_id;
        CREATE INDEX idx_users_org_id ON users(org_id);
        
        -- Update comment
        COMMENT ON COLUMN users.org_id IS 'Reference to the organization this user belongs to';
    END IF;
END $$;

-- Step 3: Ensure vendors table also uses org_id (rename if needed)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vendors' AND column_name = 'organization_id') THEN
        -- Rename the column to match the codebase
        ALTER TABLE vendors RENAME COLUMN organization_id TO org_id;
        
        -- Update any existing indexes
        DROP INDEX IF EXISTS idx_vendors_organization_id;
        CREATE INDEX idx_vendors_org_id ON vendors(org_id);
        
        -- Update foreign key reference name in constraint
        ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_organization_id_fkey;
        ALTER TABLE vendors ADD CONSTRAINT vendors_org_id_fkey 
            FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE RESTRICT;
            
        -- Update comment
        COMMENT ON COLUMN vendors.org_id IS 'Reference to the organization this vendor belongs to';
    END IF;
END $$;

-- Step 4: Ensure framework tables use org_id consistently
DO $$
BEGIN
    -- Framework fields
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'framework_fields' AND column_name = 'organization_id') THEN
        ALTER TABLE framework_fields RENAME COLUMN organization_id TO org_id;
        DROP INDEX IF EXISTS idx_framework_fields_organization_id;
        CREATE INDEX idx_framework_fields_org_id ON framework_fields(org_id);
        ALTER TABLE framework_fields DROP CONSTRAINT IF EXISTS framework_fields_organization_id_fkey;
        ALTER TABLE framework_fields ADD CONSTRAINT framework_fields_org_id_fkey 
            FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE RESTRICT;
    END IF;
    
    -- Framework options
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'framework_options' AND column_name = 'organization_id') THEN
        ALTER TABLE framework_options RENAME COLUMN organization_id TO org_id;
        DROP INDEX IF EXISTS idx_framework_options_organization_id;
        CREATE INDEX idx_framework_options_org_id ON framework_options(org_id);
        ALTER TABLE framework_options DROP CONSTRAINT IF EXISTS framework_options_organization_id_fkey;
        ALTER TABLE framework_options ADD CONSTRAINT framework_options_org_id_fkey 
            FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE RESTRICT;
    END IF;
    
    -- Framework field assignments
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'framework_field_assignments' AND column_name = 'organization_id') THEN
        ALTER TABLE framework_field_assignments RENAME COLUMN organization_id TO org_id;
        DROP INDEX IF EXISTS idx_framework_assignments_organization_id;
        CREATE INDEX idx_framework_assignments_org_id ON framework_field_assignments(org_id);
        ALTER TABLE framework_field_assignments DROP CONSTRAINT IF EXISTS framework_field_assignments_organization_id_fkey;
        ALTER TABLE framework_field_assignments ADD CONSTRAINT framework_field_assignments_org_id_fkey 
            FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Step 5: Add documentation
COMMENT ON COLUMN users.id IS 'Auto-generated UUID primary key for user records';