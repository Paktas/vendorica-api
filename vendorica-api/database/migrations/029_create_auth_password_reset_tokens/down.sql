-- Migration Rollback: Remove auth_password_reset_tokens table

-- Drop the cleanup function
DROP FUNCTION IF EXISTS cleanup_expired_password_reset_tokens();

-- Drop the table (indexes will be dropped automatically)
DROP TABLE IF EXISTS auth_password_reset_tokens;