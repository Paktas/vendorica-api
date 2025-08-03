-- Migration 011 Rollback: Restore legacy audit triggers
-- Description: Restore old database triggers (if rollback is needed)
-- WARNING: This will restore duplicate audit logging without IP tracking

-- Recreate the trigger function
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
    operation_type VARCHAR(10);
    old_data JSONB;
    new_data JSONB;
    user_context RECORD;
BEGIN
    -- Determine operation type
    IF TG_OP = 'DELETE' THEN
        operation_type := 'DELETE';
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        operation_type := 'UPDATE';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
    ELSIF TG_OP = 'INSERT' THEN
        operation_type := 'CREATE';
        old_data := NULL;
        new_data := to_jsonb(NEW);
    END IF;

    -- Get user context from current session
    BEGIN
        SELECT 
            (auth.jwt() ->> 'sub')::UUID as user_id,
            auth.jwt() ->> 'email' as user_email,
            auth.jwt() ->> 'role' as user_role
        INTO user_context;
    EXCEPTION WHEN OTHERS THEN
        user_context.user_id := NULL;
        user_context.user_email := 'system';
        user_context.user_role := 'system';
    END;

    -- Insert audit record
    INSERT INTO audit_trail (
        entity_type,
        entity_id,
        operation,
        old_values,
        new_values,
        user_id,
        user_email,
        user_role,
        description
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        operation_type,
        old_data,
        new_data,
        user_context.user_id,
        user_context.user_email,
        user_context.user_role,
        format('%s %s record in %s', operation_type, TG_TABLE_NAME, TG_TABLE_SCHEMA)
    );

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_vendors
    AFTER INSERT OR UPDATE OR DELETE ON vendors
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_contracts
    AFTER INSERT OR UPDATE OR DELETE ON contracts
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_framework_fields
    AFTER INSERT OR UPDATE OR DELETE ON framework_fields
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_framework_field_assignments
    AFTER INSERT OR UPDATE OR DELETE ON framework_field_assignments
    FOR EACH ROW EXECUTE FUNCTION log_audit_trail();