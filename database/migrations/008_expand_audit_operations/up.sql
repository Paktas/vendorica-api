-- Migration 008: Expand audit_trail operation check constraint
-- Add support for LOGIN, LOGOUT, EXPORT, EDIT_START, EDIT_FINISH operations

-- Drop the existing check constraint
ALTER TABLE audit_trail DROP CONSTRAINT IF EXISTS audit_trail_operation_check;

-- Add the new check constraint with expanded operations
ALTER TABLE audit_trail ADD CONSTRAINT audit_trail_operation_check 
  CHECK (operation IN (
    'CREATE', 
    'UPDATE', 
    'DELETE', 
    'VIEW', 
    'LOGIN', 
    'LOGOUT', 
    'EXPORT', 
    'EDIT_START', 
    'EDIT_FINISH'
  ));

-- Verify the constraint was added
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'audit_trail_operation_check';