-- Migration Rollback: Re-enable RLS on organizations and vendors tables

-- Re-enable RLS on vendors table
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;