-- Migration 006 Rollback: Remove frameworks table and framework_id from framework_fields
-- Description: Drop frameworks table and remove framework_id column
-- Author: Development Team
-- Date: 2025-07-26

-- Step 1: Drop the framework_id column from framework_fields
ALTER TABLE framework_fields DROP COLUMN framework_id;

-- Step 2: Drop the frameworks table (this will cascade and remove all references)
DROP TABLE frameworks;