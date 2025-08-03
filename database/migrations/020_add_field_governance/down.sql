-- Migration 020: Add Field Governance - Rollback
-- Description: Removes field governance system
-- Author: Development Team
-- Date: 2025-07-29

-- Step 1: Drop new RLS policies
DROP POLICY IF EXISTS "Users can view framework fields with governance" ON framework_fields;
DROP POLICY IF EXISTS "Field creation with governance rules" ON framework_fields;
DROP POLICY IF EXISTS "Field updates with governance rules" ON framework_fields;
DROP POLICY IF EXISTS "Field deletion with governance rules" ON framework_fields;

-- Step 2: Restore original RLS policies
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

-- Step 3: Drop indexes
DROP INDEX IF EXISTS idx_framework_fields_governance;
DROP INDEX IF EXISTS idx_framework_fields_org_custom;

-- Step 4: Remove columns
ALTER TABLE framework_fields DROP COLUMN IF EXISTS organization_id;
-- Note: is_toggleable column was removed as redundant
ALTER TABLE framework_fields DROP COLUMN IF EXISTS field_group;

-- Note: We don't remove the vendorica_admin role as it might be used elsewhere