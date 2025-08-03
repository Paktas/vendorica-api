-- Migration 007 Rollback: Revert framework_fields table schema
-- Description: Revert framework_fields table to previous schema
-- Author: Development Team
-- Date: 2025-07-26

-- Step 1: Drop the new tables
DROP TABLE IF EXISTS framework_field_assignments CASCADE;
DROP TABLE IF EXISTS framework_options CASCADE;
DROP TABLE IF EXISTS framework_fields CASCADE;

-- Step 2: Recreate original framework_fields table (from migration 001)
CREATE TABLE framework_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    field_type VARCHAR(50) NOT NULL DEFAULT 'text',
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Recreate original framework_options table (from migration 001)
CREATE TABLE framework_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    field_id UUID NOT NULL REFERENCES framework_fields(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create original triggers
CREATE TRIGGER update_framework_fields_updated_at
    BEFORE UPDATE ON framework_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_framework_options_updated_at
    BEFORE UPDATE ON framework_options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Create original indexes
CREATE INDEX idx_framework_fields_organization ON framework_fields(organization_id);
CREATE INDEX idx_framework_options_field ON framework_options(field_id);

-- Step 6: Enable RLS
ALTER TABLE framework_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_options ENABLE ROW LEVEL SECURITY;

-- Step 7: Create original RLS policies
CREATE POLICY "Users can view organization framework fields" ON framework_fields
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage organization framework fields" ON framework_fields
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can view organization framework options" ON framework_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM framework_fields 
            WHERE framework_fields.id = framework_options.field_id
            AND framework_fields.organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage organization framework options" ON framework_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM framework_fields 
            WHERE framework_fields.id = framework_options.field_id
            AND framework_fields.organization_id = (
                SELECT organization_id FROM users WHERE id = auth.uid()
            )
        )
    );