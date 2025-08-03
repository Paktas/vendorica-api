# Migration 027: Create Incidents Table

## Overview
This migration creates the `incidents` table for comprehensive incident management with DORA (Digital Operational Resilience Act) compliance features.

## DORA Compliance Features
This table supports DORA requirements including:

### Incident Classification
- **Severity levels**: Critical, High, Medium, Low
- **DORA classification**: Major (>2h business disruption), Significant (1-2h), Minor (<1h)
- **Categories**: Security, Data Breach, Operational, Compliance, System Outage, Third Party, Cyber Security

### Timeline Tracking
- Reported, acknowledged, resolution started, resolved, and closed timestamps
- Automatic status transitions with timestamp updates
- Recovery time tracking (RTO/RPO vs actual)

### Impact Assessment
- Business impact assessment
- Affected systems, services, and customers
- Financial impact estimation
- Third-party involvement tracking

### Regulatory Compliance
- Regulatory reporting requirement flags
- Notification tracking and dates
- Compliance review requirements

### Operational Resilience
- Root cause analysis
- Resolution summaries
- Lessons learned documentation
- Improvement action tracking
- Follow-up requirements

## Key Features

### Automatic Triggers
- `updated_at` timestamp maintenance
- Automatic status transition timestamps
- Business logic validation

### Security
- Row Level Security (RLS) enabled
- Organization-scoped access
- User-based permissions for CRUD operations

### Performance
- Comprehensive indexing strategy
- Composite indexes for common query patterns
- Optimized for incident reporting and analysis

### Data Integrity
- Foreign key constraints to organizations and users
- Check constraints for valid status values
- Timeline validation constraints

## Usage Notes

### Required Fields
- `title`, `description`, `severity`, `category`
- `organization_id` (auto-populated from user context)
- `reported_by` (auto-populated from authenticated user)

### Optional DORA Fields
- `dora_classification` - for regulatory classification
- `regulatory_reporting_required` - compliance flag
- `third_party_involved` - vendor impact tracking
- Recovery metrics (RTO, RPO, actual recovery time)

### Status Workflow
1. **Open** → **In Progress** → **Resolved** → **Closed**
2. Automatic timestamp updates on status changes
3. Business logic prevents invalid transitions

## Migration Safety
- Safe to run on production
- No data migration required
- Estimated duration: < 2 minutes
- Creates new table without affecting existing data