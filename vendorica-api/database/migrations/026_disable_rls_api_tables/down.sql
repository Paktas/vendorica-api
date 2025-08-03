-- Rollback: Re-enable RLS on tables
-- Note: This doesn't restore the policies, just re-enables RLS

-- Re-enable RLS on fields table
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on field_options table  
ALTER TABLE field_options ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;