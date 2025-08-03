-- Migration 005: Add time_format column to users table
-- Description: Add time_format preference with European-friendly default
-- Author: Development Team
-- Date: 2024-12-31

-- Step 1: Create time_format ENUM type
CREATE TYPE time_format AS ENUM ('h:mm a', 'h:mm A', 'H:mm', 'H:mm:ss');

-- Step 2: Add time_format column with European default (24-hour format)
ALTER TABLE users 
ADD COLUMN time_format time_format DEFAULT 'H:mm' NOT NULL;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN users.time_format IS 'User preferred time format: h:mm a (11:26 pm), h:mm A (11:26 PM), H:mm (23:26), H:mm:ss (23:26:59)';
COMMENT ON TYPE time_format IS 'Enum for time format preferences similar to WordPress settings';