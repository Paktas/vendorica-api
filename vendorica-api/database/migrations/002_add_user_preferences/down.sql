-- Migration 002 Rollback: Remove user preference fields
-- Description: Remove timezone and date_format columns from users table
-- Author: Development Team
-- Date: 2024-12-31
-- WARNING: This will permanently delete user preference data!

-- Drop indexes first
DROP INDEX IF EXISTS idx_users_timezone;
DROP INDEX IF EXISTS idx_users_date_format;

-- Remove the columns
ALTER TABLE users DROP COLUMN IF EXISTS timezone;
ALTER TABLE users DROP COLUMN IF EXISTS date_format;