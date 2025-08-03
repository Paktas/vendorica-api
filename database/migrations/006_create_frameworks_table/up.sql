-- Migration 006: Create frameworks table and update framework_fields
-- Description: Create frameworks table and link framework_fields to frameworks
-- Author: Development Team
-- Date: 2025-07-26

-- Step 1: Create frameworks table
CREATE TABLE frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add framework_id to framework_fields table
ALTER TABLE framework_fields 
ADD COLUMN framework_id UUID REFERENCES frameworks(id) ON DELETE CASCADE;

-- Step 3: Create index for performance
CREATE INDEX idx_framework_fields_framework_id ON framework_fields(framework_id);

-- Step 4: Seed with common compliance frameworks
INSERT INTO frameworks (name) VALUES
    ('DORA'),
    ('SOC 2'),
    ('ISO 27001'),
    ('GDPR'),
    ('HIPAA'),
    ('PCI DSS'),
    ('NIST Cybersecurity Framework'),
    ('COBIT'),
    ('Basel III'),
    ('MiFID II'),
    ('SOX'),
    ('FedRAMP'),
    ('NERC CIP'),
    ('FDA 21 CFR Part 11'),
    ('EU MDR'),
    ('ITAR');

-- Step 5: Enable RLS on frameworks table
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for frameworks
-- Users can view all frameworks
CREATE POLICY "Users can view all frameworks" ON frameworks
    FOR SELECT USING (true);

-- Only administrators can modify frameworks
CREATE POLICY "Only administrators can modify frameworks" ON frameworks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'administrator'
            AND users.status = 'active'
        )
    );

-- Step 7: Add comments for documentation
COMMENT ON TABLE frameworks IS 'Compliance and regulatory frameworks for vendor assessments';
COMMENT ON COLUMN frameworks.name IS 'Unique name of the compliance framework (e.g., SOC 2, ISO 27001)';
COMMENT ON COLUMN framework_fields.framework_id IS 'Reference to the parent framework for this field';