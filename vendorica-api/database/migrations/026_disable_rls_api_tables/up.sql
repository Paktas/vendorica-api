-- Migration: Disable RLS on tables managed through API
-- 
-- Since we're using API-first architecture with authentication handled in Node.js middleware,
-- we need to disable RLS on tables that are managed through the API endpoints.
-- Security is enforced at the API layer instead of database layer.

-- Disable RLS on fields table
ALTER TABLE fields DISABLE ROW LEVEL SECURITY;

-- Disable RLS on field_options table
ALTER TABLE field_options DISABLE ROW LEVEL SECURITY;

-- Disable RLS on users table (already disabled, but ensuring consistency)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Note: We keep RLS enabled on sensitive tables that might still need it:
-- - vendors (can keep RLS if needed)
-- - contracts (can keep RLS if needed)
-- - organizations (can keep RLS if needed)

-- For tables where we disable RLS, security is enforced through:
-- 1. API authentication (JWT tokens)
-- 2. API-level authorization checks
-- 3. Organization-based filtering in API queries