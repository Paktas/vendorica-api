# Migration 029: Create Auth Password Reset Tokens Table

## Problem
Password reset tokens are currently generated as JWT-like tokens and only stored in memory/email links. This creates security vulnerabilities:
- Tokens cannot be revoked or invalidated
- No protection against replay attacks
- No audit trail of token usage
- Tokens can be used multiple times

## Solution
Create a dedicated `auth_password_reset_tokens` table to store tokens securely with proper expiry and single-use functionality.

## Database Changes

### New Table: `auth_password_reset_tokens`
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to users)  
- token_hash: VARCHAR(255) (SHA-256 hash of token)
- expires_at: TIMESTAMP (1 hour expiry)
- used_at: TIMESTAMP (NULL until used)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Indexes Created
- `user_id` - For user lookup
- `token_hash` - For token validation (unique)
- `expires_at` - For expiry checks
- Composite cleanup index for maintenance

### Security Features
- ✅ RLS disabled for custom auth compatibility
- ✅ Token hashing (SHA-256) for security
- ✅ Single-use tokens (marked as used)
- ✅ Automatic expiry (1 hour)
- ✅ Cleanup function for expired tokens

## Code Changes Required
After migration, update `api-middleware.cjs`:
1. **Token Generation**: Store hashed token in database
2. **Token Validation**: Check database for valid, unused tokens
3. **Token Usage**: Mark tokens as used after successful password reset

## Impact
- ✅ Secure token storage
- ✅ Single-use token functionality  
- ✅ Token revocation capability
- ✅ Better audit trail
- ✅ Protection against replay attacks

## Dependencies
- Requires migration 028 (RLS disabled on organizations/vendors)