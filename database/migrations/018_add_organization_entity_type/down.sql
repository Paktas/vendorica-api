-- Migration 018 Rollback: Remove Organization Entity Type
-- Description: Restore entity_type constraint to original values (vendor, contract only)
-- Author: Development Team
-- Date: 2025-07-27

-- Step 1: Check if there are any existing 'organization' assignments
DO $$
DECLARE
    org_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count
    FROM framework_field_assignments 
    WHERE entity_type = 'organization';
    
    IF org_count > 0 THEN
        RAISE EXCEPTION 'Cannot rollback: % assignments with entity_type=''organization'' exist. Remove these assignments before rolling back.', org_count;
    END IF;
END $$;

-- Step 2: Drop existing CHECK constraint
ALTER TABLE framework_field_assignments DROP CONSTRAINT IF EXISTS framework_field_assignments_entity_type_check;

-- Step 3: Add original CHECK constraint (vendor, contract only)
ALTER TABLE framework_field_assignments ADD CONSTRAINT framework_field_assignments_entity_type_check
    CHECK (entity_type IN ('vendor', 'contract'));

-- Verification: Check constraint has been restored
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.check_constraints 
        WHERE constraint_name = 'framework_field_assignments_entity_type_check'
        AND check_clause NOT LIKE '%organization%'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'Verification successful: entity_type constraint restored to original values';
    ELSE
        RAISE WARNING 'Verification failed: entity_type constraint may not be restored correctly';
    END IF;
END $$;