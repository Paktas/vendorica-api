-- Rollback script for incidents table migration

-- Drop triggers first
DROP TRIGGER IF EXISTS prevent_critical_field_changes_trigger ON incidents;
DROP TRIGGER IF EXISTS auto_update_incident_status_trigger ON incidents;
DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;

-- Drop functions
DROP FUNCTION IF EXISTS prevent_critical_field_changes();
DROP FUNCTION IF EXISTS auto_update_incident_status();
DROP FUNCTION IF EXISTS update_incidents_updated_at_column();

-- Drop the incidents table (this will cascade and remove indexes, policies, etc.)
DROP TABLE IF EXISTS incidents CASCADE;

-- Note: Foreign key constraints will be automatically removed when the table is dropped