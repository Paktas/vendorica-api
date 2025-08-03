# Migration 018: Add Organization Entity Type

## Overview
This migration updates the `framework_field_assignments` table to allow 'organization' as a valid value for the `entity_type` column.

## Problem
The current CHECK constraint on `entity_type` only allows 'vendor' and 'contract' values:
```sql
CHECK (entity_type IN ('vendor', 'contract'))
```

When trying to create field assignments with `entity_type = 'organization'`, the database throws:
```
new row for relation "framework_field_assignments" violates check constraint "framework_field_assignments_entity_type_check"
```

## Solution
Update the CHECK constraint to include 'organization' as a valid option:
```sql
CHECK (entity_type IN ('vendor', 'contract', 'organization'))
```

## Changes
### Updated Constraint:
- **Before**: `entity_type IN ('vendor', 'contract')`
- **After**: `entity_type IN ('vendor', 'contract', 'organization')`

## Impact
- **Non-breaking Change**: Existing data with 'vendor' and 'contract' remains valid
- **New Functionality**: Enables creation of field assignments for organizations
- **UI Support**: The frontend already supports organization selection
- **Service Layer**: TypeScript types already include 'organization'

## Benefits
1. **Enables Organization Field Assignments**: Users can now assign compliance fields to organizations
2. **Consistent with UI**: Database constraint matches frontend capabilities
3. **Type Safety**: Aligns database constraints with TypeScript type definitions
4. **Complete Feature**: Completes the organization support that was partially implemented

## Rollback Considerations
- The rollback migration will fail if there are existing assignments with `entity_type = 'organization'`
- This is by design to prevent data loss
- To rollback, first remove all organization assignments, then run the down migration