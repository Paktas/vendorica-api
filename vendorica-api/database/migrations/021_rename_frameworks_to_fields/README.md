# Migration 021: Rename Frameworks to Fields

## Purpose
Renames framework-related database objects to focus on fields only, specifically DORA compliance fields. This migration simplifies the architecture by removing the frameworks abstraction layer.

## Changes
1. **Table Renames**:
   - `framework_fields` → `fields`
   - `framework_options` → `field_options`
   - `framework_field_assignments` → `field_assignments`

2. **Column Updates**:
   - `framework_id` → `legacy_framework_id` (deprecated)
   - `framework` → `domain` (set to 'DORA' for all fields)
   - `framework_field_id` → `field_id` (in assignments table)

3. **RLS Policy Updates**: All policies updated to use new table names
4. **Index Updates**: Indexes renamed to match new table structure
5. **Focus on DORA**: All fields set to DORA domain

## Impact
- **Breaking Change**: All application code referring to framework tables must be updated
- Simplifies data model by removing framework abstraction
- Focuses exclusively on DORA compliance fields
- Maintains all governance and permission controls

## Next Steps
After this migration:
1. Update TypeScript interfaces and types
2. Update service layer classes and methods
3. Update React components and views
4. Update navigation and menu items
5. Remove frameworks table in separate migration (if no longer needed)

## Rollback
The down.sql script will revert all table and column names back to the original framework-based structure.