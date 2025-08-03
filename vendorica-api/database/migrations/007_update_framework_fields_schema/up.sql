-- Migration 007: Update framework_fields table schema
-- Description: Add missing columns to framework_fields table to match TypeScript interface
-- Author: Development Team
-- Date: 2025-07-26

-- Step 1: Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Drop and recreate framework_fields table with proper schema
DROP TABLE IF EXISTS framework_options CASCADE;
DROP TABLE IF EXISTS framework_field_assignments CASCADE;
DROP TABLE IF EXISTS framework_fields CASCADE;

-- Step 3: Create framework_fields table with correct schema
CREATE TABLE framework_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID REFERENCES frameworks(id) ON DELETE CASCADE,
    framework VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    field_type VARCHAR(20) NOT NULL DEFAULT 'text' 
        CHECK (field_type IN ('text', 'number', 'select', 'multiselect', 'boolean', 'date')),
    required BOOLEAN DEFAULT false,
    validation_rules JSONB,
    help_text TEXT,
    sort_order INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create framework_options table with correct schema
CREATE TABLE framework_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES framework_fields(id) ON DELETE CASCADE,
    option_value VARCHAR(255) NOT NULL,
    option_label VARCHAR(255) NOT NULL,
    framework_identifier VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create framework_field_assignments table
CREATE TABLE framework_field_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_field_id UUID NOT NULL REFERENCES framework_fields(id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('vendor', 'contract')),
    entity_id UUID,
    assignment_reason TEXT,
    assigned_by UUID REFERENCES users(id),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    due_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'not_applicable')),
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create indexes for performance
CREATE INDEX idx_framework_fields_framework_id ON framework_fields(framework_id);
CREATE INDEX idx_framework_fields_code ON framework_fields(code);
CREATE INDEX idx_framework_options_field_id ON framework_options(field_id);
CREATE INDEX idx_framework_field_assignments_field_id ON framework_field_assignments(framework_field_id);
CREATE INDEX idx_framework_field_assignments_entity ON framework_field_assignments(entity_type, entity_id);

-- Step 7: Create updated_at triggers
CREATE TRIGGER update_framework_fields_updated_at
    BEFORE UPDATE ON framework_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_framework_options_updated_at
    BEFORE UPDATE ON framework_options
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_framework_field_assignments_updated_at
    BEFORE UPDATE ON framework_field_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Enable RLS on all tables
ALTER TABLE framework_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_field_assignments ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
-- Framework fields policies
CREATE POLICY "Users can view all framework fields" ON framework_fields
    FOR SELECT USING (true);

CREATE POLICY "Only administrators can modify framework fields" ON framework_fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'administrator'
            AND users.status = 'active'
        )
    );

-- Framework options policies
CREATE POLICY "Users can view all framework options" ON framework_options
    FOR SELECT USING (true);

CREATE POLICY "Only administrators can modify framework options" ON framework_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'administrator'
            AND users.status = 'active'
        )
    );

-- Framework field assignments policies
CREATE POLICY "Users can view all framework field assignments" ON framework_field_assignments
    FOR SELECT USING (true);

CREATE POLICY "Only administrators can modify framework field assignments" ON framework_field_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'administrator'
            AND users.status = 'active'
        )
    );

-- Step 10: Add comments for documentation
COMMENT ON TABLE framework_fields IS 'Framework assessment fields for compliance requirements';
COMMENT ON COLUMN framework_fields.framework_id IS 'Reference to the parent framework';
COMMENT ON COLUMN framework_fields.framework IS 'Name of the framework (denormalized)';
COMMENT ON COLUMN framework_fields.code IS 'Unique code identifier for the field';
COMMENT ON COLUMN framework_fields.label IS 'Display label for the field';
COMMENT ON COLUMN framework_fields.help_text IS 'Help text to assist users in filling the field';
COMMENT ON COLUMN framework_fields.validation_rules IS 'JSON validation rules for the field';

COMMENT ON TABLE framework_options IS 'Predefined options for select/multiselect framework fields';
COMMENT ON TABLE framework_field_assignments IS 'Assignment of framework fields to vendors or contracts';