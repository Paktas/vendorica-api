-- Migration 018: Add Organization Entity Type
-- Description: Update entity_type constraint to allow 'organization' value
-- Author: Development Team
-- Date: 2025-07-27

-- Step 1: Drop existing CHECK constraint
ALTER TABLE framework_field_assignments DROP CONSTRAINT IF EXISTS framework_field_assignments_entity_type_check;

-- Step 2: Add updated CHECK constraint that includes 'organization'
ALTER TABLE framework_field_assignments ADD CONSTRAINT framework_field_assignments_entity_type_check
    CHECK (entity_type IN ('vendor', 'contract', 'organization'));

-- Verification: Check constraint has been updated
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'framework_field_assignments_entity_type_check'
        AND check_clause LIKE '%organization%'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'Verification successful: entity_type constraint now includes organization';
    ELSE
        RAISE WARNING 'Verification failed: entity_type constraint may not include organization';
    END IF;
END $$;