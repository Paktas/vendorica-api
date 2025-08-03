-- Migration: Create auth_password_reset_tokens table
-- Implements secure password reset token storage with proper expiry and single-use functionality

-- Create auth_password_reset_tokens table
CREATE TABLE auth_password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_auth_password_reset_tokens_user_id ON auth_password_reset_tokens(user_id);
CREATE INDEX idx_auth_password_reset_tokens_token_hash ON auth_password_reset_tokens(token_hash);
CREATE INDEX idx_auth_password_reset_tokens_expires_at ON auth_password_reset_tokens(expires_at);

-- Create index for cleanup of expired tokens
CREATE INDEX idx_auth_password_reset_tokens_cleanup ON auth_password_reset_tokens(expires_at, used_at);

-- Disable RLS to work with our custom authentication system
ALTER TABLE auth_password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Add comments for documentation
COMMENT ON TABLE auth_password_reset_tokens IS 'Stores password reset tokens with expiry and single-use functionality';
COMMENT ON COLUMN auth_password_reset_tokens.token_hash IS 'SHA-256 hash of the reset token for security';
COMMENT ON COLUMN auth_password_reset_tokens.expires_at IS 'Token expiration time (1 hour from creation)';
COMMENT ON COLUMN auth_password_reset_tokens.used_at IS 'Timestamp when token was used (NULL if unused)';

-- Optional: Create a function to clean up expired tokens (can be called by a cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_password_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM auth_password_reset_tokens 
  WHERE expires_at < NOW() - INTERVAL '24 hours'; -- Keep expired tokens for 24h for audit
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;