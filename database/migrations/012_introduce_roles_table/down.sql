-- Migration 012 Rollback: Remove Roles Table
-- Description: Remove roles table and related objects
-- WARNING: This will delete all role data if migration 013+ have not been run

-- Drop the roles table (CASCADE will remove dependent objects)
DROP TABLE IF EXISTS roles CASCADE;

-- Verify roles table has been removed
SELECT 
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'roles';