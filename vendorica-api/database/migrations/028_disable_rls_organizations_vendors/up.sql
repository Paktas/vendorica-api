-- Migration: Disable RLS on organizations and vendors tables
-- This allows the custom authentication system to access these tables
-- Similar to migration 026 for fields table

-- Disable RLS on organizations table
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on vendors table  
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;