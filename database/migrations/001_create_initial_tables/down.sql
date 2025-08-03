-- Migration 001 Rollback: Drop initial tables
-- Description: Completely removes all tables and functions created in migration 001
-- Author: Development Team
-- Date: 2024-12-31
-- WARNING: This will delete ALL data in the database!

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS audit_trail CASCADE;
DROP TABLE IF EXISTS framework_field_assignments CASCADE;
DROP TABLE IF EXISTS framework_options CASCADE;
DROP TABLE IF EXISTS framework_fields CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Note: Extensions are not dropped as they might be used by other databases