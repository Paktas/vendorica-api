-- Migration 008 Rollback: Revert audit_trail operation check constraint to original state
-- Remove extended operations and restore original constraint

-- Drop the expanded check constraint
ALTER TABLE audit_trail DROP CONSTRAINT IF EXISTS audit_trail_operation_check;

-- Restore the original check constraint (only basic CRUD + VIEW operations)
ALTER TABLE audit_trail ADD CONSTRAINT audit_trail_operation_check 
  CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'VIEW'));

-- Verify the constraint was restored
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'audit_trail_operation_check';