-- Migration 017: Simplify field assignments table
-- Description: Remove unnecessary fields from framework_field_assignments table
-- Author: Development Team
-- Date: 2025-07-27

-- Step 1: Remove entity_id column (no longer assign to specific entities, only by type)
ALTER TABLE framework_field_assignments DROP COLUMN IF EXISTS entity_id;

-- Step 2: Remove assignment_reason column
ALTER TABLE framework_field_assignments DROP COLUMN IF EXISTS assignment_reason;

-- Step 3: Remove priority column
ALTER TABLE framework_field_assignments DROP COLUMN IF EXISTS priority;

-- Step 4: Remove due_date column
ALTER TABLE framework_field_assignments DROP COLUMN IF EXISTS due_date;

-- Step 5: Remove status column
ALTER TABLE framework_field_assignments DROP COLUMN IF EXISTS status;

-- Step 6: Remove completion_date column
ALTER TABLE framework_field_assignments DROP COLUMN IF EXISTS completion_date;

-- Step 7: Remove notes column
ALTER TABLE framework_field_assignments DROP COLUMN IF EXISTS notes;

-- Verification: Check remaining columns
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'framework_field_assignments' 
    AND column_name IN ('entity_id', 'assignment_reason', 'priority', 'due_date', 'status', 'completion_date', 'notes');
    
    IF column_count = 0 THEN
        RAISE NOTICE 'Verification successful: All unnecessary columns removed from framework_field_assignments table';
    ELSE
        RAISE WARNING 'Verification failed: % unnecessary columns still exist', column_count;
    END IF;
END $$;

-- Final structure should be:
-- - id (UUID, primary key)
-- - framework_field_id (UUID, foreign key)
-- - entity_type (VARCHAR: vendor, contract, organization)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)