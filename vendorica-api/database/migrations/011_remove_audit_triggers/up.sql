-- Migration 011: Remove legacy audit triggers
-- Description: Remove old database triggers that create duplicate audit entries without IP tracking
-- Author: Development Team
-- Date: 2025-07-27

-- Drop legacy audit triggers that are creating duplicate entries
DROP TRIGGER IF EXISTS audit_users ON users;
DROP TRIGGER IF EXISTS audit_vendors ON vendors;
DROP TRIGGER IF EXISTS audit_contracts ON contracts;
DROP TRIGGER IF EXISTS audit_framework_fields ON framework_fields;
DROP TRIGGER IF EXISTS audit_framework_field_assignments ON framework_field_assignments;

-- Drop the trigger function as it's no longer needed
DROP FUNCTION IF EXISTS log_audit_trail();

-- Verify triggers have been removed
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    n.nspname as schema_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname LIKE 'audit_%' 
  AND n.nspname = 'public'
  AND NOT t.tgisinternal;