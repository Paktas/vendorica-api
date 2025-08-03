# Migration 020: Add Field Governance

## Purpose
Implements hybrid field governance system with three field groups:
- **core_fields**: Vendorica Admin Only - DORA-mandated fields (e.g., EBA coded fields)
- **optional_fields**: Vendorica Admin (toggleable) - Non-mandatory DORA fields
- **custom_fields**: Customer/Org Level - Internal use fields (risk scores, tags, notes, etc.)

## Changes
1. Adds governance columns to framework_fields table:
   - field_group: Categorizes fields into core/optional/custom (replaces is_system_managed)
   - organization_id: Links custom fields to specific organizations
   - organization_id: Links custom fields to specific organizations
   
Note: EBA/regulatory codes for DORA fields are stored in the existing `code` field.

2. Updates RLS policies to enforce governance rules
3. Adds indexes for performance optimization
4. Includes data migration for existing fields

## Impact
- Existing fields will be categorized as custom_fields by default
- No breaking changes to existing functionality
- Enhanced permission model for field management

## Rollback
The down.sql script will:
1. Remove the new columns
2. Drop the new indexes
3. Restore original RLS policies