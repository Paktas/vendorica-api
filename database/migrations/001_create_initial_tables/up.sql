-- Migration 001: Create initial tables
-- Description: Initial database schema creation with all core tables
-- Author: Development Team
-- Date: 2024-12-31

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT organizations_name_check CHECK (name <> '')
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'supervisor', 'administrator')),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT true,
    timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
    date_format VARCHAR(20) DEFAULT 'MM/dd/yyyy' NOT NULL
        CHECK (date_format IN ('MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'MMM dd, yyyy', 'dd MMM yyyy')),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT users_email_check CHECK (email <> ''),
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create vendors table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    vat_number VARCHAR(50),
    country_code VARCHAR(3),
    notes TEXT,
    last_assessed_at TIMESTAMP WITH TIME ZONE,
    critical_third_party VARCHAR(20) CHECK (critical_third_party IN ('yes', 'no', 'under_review')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT vendors_name_check CHECK (name <> '')
);

-- Create contracts table
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    contract_type VARCHAR(100),
    start_date DATE,
    risk_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT contracts_title_check CHECK (title <> '')
);

-- Create framework_fields table
CREATE TABLE framework_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    field_type VARCHAR(50) NOT NULL DEFAULT 'text',
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create framework_options table
CREATE TABLE framework_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    field_id UUID NOT NULL REFERENCES framework_fields(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL,
    label VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create framework_field_assignments table
CREATE TABLE framework_field_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    field_id UUID NOT NULL REFERENCES framework_fields(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(field_id, vendor_id)
);

-- Create audit_trail table
CREATE TABLE audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    operation VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_timezone ON users(timezone);
CREATE INDEX idx_users_date_format ON users(date_format);
CREATE INDEX idx_vendors_organization_id ON vendors(organization_id);
CREATE INDEX idx_vendors_name ON vendors(name);
CREATE INDEX idx_vendors_country_code ON vendors(country_code);
CREATE INDEX idx_contracts_vendor_id ON contracts(vendor_id);
CREATE INDEX idx_contracts_title ON contracts(title);
CREATE INDEX idx_framework_fields_organization_id ON framework_fields(organization_id);
CREATE INDEX idx_framework_options_organization_id ON framework_options(organization_id);
CREATE INDEX idx_framework_options_field_id ON framework_options(field_id);
CREATE INDEX idx_framework_assignments_organization_id ON framework_field_assignments(organization_id);
CREATE INDEX idx_framework_assignments_field_id ON framework_field_assignments(field_id);
CREATE INDEX idx_framework_assignments_vendor_id ON framework_field_assignments(vendor_id);
CREATE INDEX idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX idx_audit_trail_entity_type ON audit_trail(entity_type);
CREATE INDEX idx_audit_trail_entity_id ON audit_trail(entity_id);
CREATE INDEX idx_audit_trail_operation ON audit_trail(operation);
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at DESC);

-- Create update triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_framework_fields_updated_at BEFORE UPDATE ON framework_fields FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_framework_options_updated_at BEFORE UPDATE ON framework_options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_framework_assignments_updated_at BEFORE UPDATE ON framework_field_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();