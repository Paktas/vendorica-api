-- Create incidents table for incident management with DORA compliance
-- DORA (Digital Operational Resilience Act) requirements considered:
-- - Incident classification and severity
-- - Timeline tracking for regulatory reporting
-- - Impact assessment and affected systems tracking
-- - Third-party/vendor involvement tracking
-- - Regulatory reporting requirements
-- - Resolution tracking with timestamps

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    
    -- Basic incident information
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Incident classification (DORA requirements)
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('Security', 'Data Breach', 'Operational', 'Compliance', 'System Outage', 'Third Party', 'Cyber Security', 'Other')),
    
    -- DORA compliance fields
    incident_type VARCHAR(50) DEFAULT 'Operational' CHECK (incident_type IN ('Operational', 'Security', 'Cyber Security', 'Third Party', 'Data Protection')),
    regulatory_reporting_required BOOLEAN DEFAULT FALSE,
    dora_classification VARCHAR(50) CHECK (dora_classification IN ('Major', 'Significant', 'Minor', NULL)),
    
    -- Timeline tracking (DORA requirements)
    reported_by UUID NOT NULL,
    assigned_to UUID,
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolution_started_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Impact assessment (DORA requirements)
    impact_assessment TEXT,
    business_impact VARCHAR(20) CHECK (business_impact IN ('Critical', 'High', 'Medium', 'Low', 'None')),
    affected_systems TEXT,
    affected_services TEXT,
    affected_customers INTEGER DEFAULT 0,
    estimated_financial_impact DECIMAL(15,2),
    
    -- Third-party and vendor tracking (DORA requirements)
    affected_vendors TEXT,
    third_party_involved BOOLEAN DEFAULT FALSE,
    third_party_notification_sent BOOLEAN DEFAULT FALSE,
    third_party_notification_date TIMESTAMP WITH TIME ZONE,
    
    -- Resolution and recovery (DORA requirements)
    root_cause TEXT,
    resolution_summary TEXT,
    recovery_time_objective INTEGER, -- in minutes
    recovery_point_objective INTEGER, -- in minutes
    actual_recovery_time INTEGER, -- in minutes
    
    -- Regulatory and compliance (DORA requirements)
    regulatory_notifications_sent BOOLEAN DEFAULT FALSE,
    regulatory_notification_date TIMESTAMP WITH TIME ZONE,
    compliance_review_required BOOLEAN DEFAULT FALSE,
    compliance_review_completed BOOLEAN DEFAULT FALSE,
    
    -- Communication and escalation
    stakeholders_notified BOOLEAN DEFAULT FALSE,
    escalation_level INTEGER DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 5),
    public_communication_required BOOLEAN DEFAULT FALSE,
    
    -- Lessons learned and improvement
    lessons_learned TEXT,
    improvement_actions TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    
    -- Technical details
    error_logs TEXT,
    system_logs TEXT,
    evidence_collected TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_incidents_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_incidents_reported_by FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_incidents_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Business logic constraints
    CONSTRAINT check_resolution_timeline CHECK (
        resolved_at IS NULL OR reported_at <= resolved_at
    ),
    CONSTRAINT check_closed_timeline CHECK (
        closed_at IS NULL OR 
        (resolved_at IS NOT NULL AND resolved_at <= closed_at)
    ),
    CONSTRAINT check_regulatory_notification CHECK (
        NOT regulatory_reporting_required OR 
        (regulatory_notifications_sent IS NOT NULL AND regulatory_notification_date IS NOT NULL)
    )
);

-- Create indexes for performance and common queries
CREATE INDEX idx_incidents_organization_id ON incidents(organization_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_category ON incidents(category);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX idx_incidents_reported_at ON incidents(reported_at);
CREATE INDEX idx_incidents_resolved_at ON incidents(resolved_at);
CREATE INDEX idx_incidents_dora_classification ON incidents(dora_classification);
CREATE INDEX idx_incidents_regulatory_reporting ON incidents(regulatory_reporting_required);
CREATE INDEX idx_incidents_third_party ON incidents(third_party_involved);

-- Composite indexes for common filtering scenarios
CREATE INDEX idx_incidents_org_status_severity ON incidents(organization_id, status, severity);
CREATE INDEX idx_incidents_org_category_reported ON incidents(organization_id, category, reported_at DESC);
CREATE INDEX idx_incidents_dora_reporting ON incidents(organization_id, dora_classification, regulatory_reporting_required);

-- Enable Row Level Security (RLS)
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see incidents from their organization
CREATE POLICY "Users can view incidents from their organization" ON incidents
    FOR SELECT USING (
        organization_id IN (
            SELECT u.organization_id FROM users u WHERE u.id = auth.uid()
        )
    );

-- Users can insert incidents for their organization
CREATE POLICY "Users can create incidents for their organization" ON incidents
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT u.organization_id FROM users u WHERE u.id = auth.uid()
        )
        AND reported_by = auth.uid()
    );

-- Users can update incidents from their organization (with some restrictions)
CREATE POLICY "Users can update incidents from their organization" ON incidents
    FOR UPDATE USING (
        organization_id IN (
            SELECT u.organization_id FROM users u WHERE u.id = auth.uid()
        )
    ) WITH CHECK (
        organization_id IN (
            SELECT u.organization_id FROM users u WHERE u.id = auth.uid()
        )
    );

-- Users can delete incidents from their organization (restricted to reporters or admins)
CREATE POLICY "Users can delete incidents from their organization" ON incidents
    FOR DELETE USING (
        organization_id IN (
            SELECT u.organization_id FROM users u WHERE u.id = auth.uid()
        )
        AND (
            reported_by = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM users u 
                WHERE u.id = auth.uid() 
                AND u.organization_id = incidents.organization_id
                -- Add admin role check here if roles are implemented
            )
        )
    );

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_incidents_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_incidents_updated_at 
    BEFORE UPDATE ON incidents 
    FOR EACH ROW EXECUTE FUNCTION update_incidents_updated_at_column();

-- Create trigger for automatic status transitions
CREATE OR REPLACE FUNCTION auto_update_incident_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only handle UPDATE operations (not INSERT)
    IF TG_OP = 'UPDATE' THEN
        -- Auto-set acknowledged_at when status changes from Open
        IF OLD.status = 'Open' AND NEW.status != 'Open' AND NEW.acknowledged_at IS NULL THEN
            NEW.acknowledged_at = NOW();
        END IF;
        
        -- Auto-set resolution_started_at when status changes to In Progress
        IF OLD.status != 'In Progress' AND NEW.status = 'In Progress' AND NEW.resolution_started_at IS NULL THEN
            NEW.resolution_started_at = NOW();
        END IF;
        
        -- Auto-set resolved_at when status changes to Resolved
        IF OLD.status != 'Resolved' AND NEW.status = 'Resolved' AND NEW.resolved_at IS NULL THEN
            NEW.resolved_at = NOW();
        END IF;
        
        -- Auto-set closed_at when status changes to Closed
        IF OLD.status != 'Closed' AND NEW.status = 'Closed' AND NEW.closed_at IS NULL THEN
            NEW.closed_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_incident_status_trigger
    BEFORE UPDATE ON incidents 
    FOR EACH ROW EXECUTE FUNCTION auto_update_incident_status();

-- Create trigger to prevent modification of critical fields
CREATE OR REPLACE FUNCTION prevent_critical_field_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent changes to organization_id and reported_by after creation
    IF TG_OP = 'UPDATE' THEN
        IF OLD.organization_id != NEW.organization_id THEN
            RAISE EXCEPTION 'Cannot change organization_id after incident creation';
        END IF;
        
        IF OLD.reported_by != NEW.reported_by THEN
            RAISE EXCEPTION 'Cannot change reported_by after incident creation';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_critical_field_changes_trigger
    BEFORE UPDATE ON incidents 
    FOR EACH ROW EXECUTE FUNCTION prevent_critical_field_changes();

-- Add helpful comments for documentation
COMMENT ON TABLE incidents IS 'Incident management table with DORA compliance features for operational resilience tracking';
COMMENT ON COLUMN incidents.dora_classification IS 'DORA incident classification: Major (>2h business disruption), Significant (1-2h), Minor (<1h)';
COMMENT ON COLUMN incidents.regulatory_reporting_required IS 'Whether this incident requires regulatory notification under DORA or other frameworks';
COMMENT ON COLUMN incidents.third_party_involved IS 'Whether the incident involves third-party services or vendors';
COMMENT ON COLUMN incidents.recovery_time_objective IS 'Target recovery time in minutes (RTO)';
COMMENT ON COLUMN incidents.recovery_point_objective IS 'Maximum acceptable data loss in minutes (RPO)';
COMMENT ON COLUMN incidents.actual_recovery_time IS 'Actual time taken to recover in minutes';
COMMENT ON COLUMN incidents.escalation_level IS 'Incident escalation level (1=Low, 5=Critical/Executive)';
COMMENT ON COLUMN incidents.business_impact IS 'Assessed business impact level';
COMMENT ON COLUMN incidents.affected_customers IS 'Number of customers affected by the incident';
COMMENT ON COLUMN incidents.estimated_financial_impact IS 'Estimated financial impact in currency units';