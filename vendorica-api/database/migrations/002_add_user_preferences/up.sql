-- Migration 002: Add user preference fields
-- Description: Add timezone and date_format columns to users table
-- Author: Development Team
-- Date: 2024-12-31

-- Add timezone column with default value
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL;

-- Add date_format column with constraint
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'MM/dd/yyyy' NOT NULL
CHECK (date_format IN ('MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MMM dd, yyyy', 'dd MMM yyyy'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone);
CREATE INDEX IF NOT EXISTS idx_users_date_format ON users(date_format);

-- Add column comments
COMMENT ON COLUMN users.timezone IS 'User preferred timezone (IANA timezone identifier)';
COMMENT ON COLUMN users.date_format IS 'User preferred date format for display';

-- Update any existing users without these values (should be handled by DEFAULT, but just in case)
UPDATE users 
SET timezone = 'UTC', date_format = 'MM/dd/yyyy' 
WHERE timezone IS NULL OR date_format IS NULL;