-- Migration 005 Rollback: Remove time_format column
-- Description: Remove time_format column and enum type
-- Author: Development Team
-- Date: 2024-12-31

-- Step 1: Drop the time_format column
ALTER TABLE users DROP COLUMN time_format;

-- Step 2: Drop the time_format enum type
DROP TYPE time_format;