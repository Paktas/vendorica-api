-- Migration 012: Introduce Roles Table
-- Description: Create roles table and seed with default system roles
-- Author: Development Team
-- Date: 2025-07-27

-- Create roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT roles_name_check CHECK (name <> ''),
    CONSTRAINT roles_display_name_check CHECK (display_name <> '')
);

-- Create indexes for performance
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_is_active ON roles(is_active);
CREATE INDEX idx_roles_is_system ON roles(is_system);

-- Create update trigger for roles
CREATE TRIGGER update_roles_updated_at 
    BEFORE UPDATE ON roles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default system roles
INSERT INTO roles (name, display_name, description, is_system, is_active) VALUES 
(
    'user',
    'User', 
    'Standard user with basic access to assigned resources within their organization. Can view and manage their own data but cannot modify system settings or manage other users.',
    true,
    true
),
(
    'supervisor',
    'Supervisor',
    'Team leader with expanded permissions including user management within their organization. Can create, edit, and manage users, vendors, and contracts but cannot access system-wide administrative functions.',
    true,
    true
),
(
    'administrator',
    'Administrator',
    'Full system administrator with complete access to all features and data across all organizations. Can manage users, roles, system settings, and has access to all administrative functions.',
    true,
    true
);

-- Add table comment
COMMENT ON TABLE roles IS 'System roles that define user permissions and access levels';
COMMENT ON COLUMN roles.name IS 'Unique role identifier used in code (e.g., user, supervisor, administrator)';
COMMENT ON COLUMN roles.display_name IS 'Human-readable role name shown in UI';
COMMENT ON COLUMN roles.description IS 'Detailed description of role capabilities and permissions';
COMMENT ON COLUMN roles.is_system IS 'System roles cannot be deleted or have their name changed';
COMMENT ON COLUMN roles.is_active IS 'Inactive roles cannot be assigned to new users';

-- Verify roles were created correctly
SELECT 
    id,
    name,
    display_name,
    is_system,
    is_active,
    created_at
FROM roles 
ORDER BY 
    CASE name 
        WHEN 'administrator' THEN 1
        WHEN 'supervisor' THEN 2  
        WHEN 'user' THEN 3
        ELSE 4
    END;