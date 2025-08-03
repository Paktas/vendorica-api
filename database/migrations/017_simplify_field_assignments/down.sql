-- Migration 017 Rollback: Restore field assignments complexity
-- Description: Add back the removed fields to framework_field_assignments table
-- Author: Development Team
-- Date: 2025-07-27

-- Step 1: Add back entity_id column
ALTER TABLE framework_field_assignments ADD COLUMN IF NOT EXISTS entity_id UUID;

-- Step 2: Add back assignment_reason column
ALTER TABLE framework_field_assignments ADD COLUMN IF NOT EXISTS assignment_reason TEXT;

-- Step 3: Add back priority column
DO $$
BEGIN
    -- Create enum type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_priority') THEN
        CREATE TYPE assignment_priority AS ENUM ('low', 'medium', 'high', 'critical');
    END IF;
    
    -- Add column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'framework_field_assignments' AND column_name = 'priority'
    ) THEN
        ALTER TABLE framework_field_assignments ADD COLUMN priority assignment_priority;
    END IF;
END $$;

-- Step 4: Add back due_date column
ALTER TABLE framework_field_assignments ADD COLUMN IF NOT EXISTS due_date DATE;

-- Step 5: Add back status column
DO $$
BEGIN
    -- Create enum type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_status') THEN
        CREATE TYPE assignment_status AS ENUM ('pending', 'in_progress', 'completed', 'not_applicable');
    END IF;
    
    -- Add column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'framework_field_assignments' AND column_name = 'status'
    ) THEN
        ALTER TABLE framework_field_assignments ADD COLUMN status assignment_status DEFAULT 'pending';
    END IF;
END $$;

-- Step 6: Add back completion_date column
ALTER TABLE framework_field_assignments ADD COLUMN IF NOT EXISTS completion_date DATE;

-- Step 7: Add back notes column
ALTER TABLE framework_field_assignments ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verification: Check restored columns
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'framework_field_assignments' 
    AND column_name IN ('entity_id', 'assignment_reason', 'priority', 'due_date', 'status', 'completion_date', 'notes');
    
    IF column_count = 7 THEN
        RAISE NOTICE 'Verification successful: All columns restored to framework_field_assignments table';
    ELSE
        RAISE WARNING 'Verification failed: Only % out of 7 columns restored', column_count;
    END IF;
END $$;