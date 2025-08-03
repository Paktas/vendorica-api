# Migration 017: Simplify Field Assignments

## Overview
This migration simplifies the `framework_field_assignments` table by removing unnecessary complexity that was not being used in the application.

## Problem
The field assignments table had many fields that added complexity without value:
- `entity_id` - We don't need to assign to specific entities, only by type
- `assignment_reason` - Not needed for the current use case
- `priority` - Not used in the workflow
- `due_date` - Not tracking deadlines for assignments
- `status` - Not tracking assignment status
- `completion_date` - Not tracking completion
- `notes` - Not needed for simple assignments

## Solution
Remove all unnecessary fields to create a clean, simple model focused on the core functionality:
- `framework_field_id` - Which field is being assigned
- `entity_type` - What type of entity (vendor, contract, organization)

## Changes
### Removed Columns:
1. **entity_id** - No longer assign to specific entities
2. **assignment_reason** - Simplified workflow doesn't need reasons
3. **priority** - Not using priority-based workflows
4. **due_date** - Not tracking deadlines
5. **status** - Not tracking assignment status
6. **completion_date** - Not tracking completion
7. **notes** - Simplified model doesn't need notes

### Final Schema:
```sql
framework_field_assignments (
  id UUID PRIMARY KEY,
  framework_field_id UUID REFERENCES framework_fields(id),
  entity_type VARCHAR CHECK (entity_type IN ('vendor', 'contract', 'organization')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## Impact
- **Breaking Change**: Existing data in removed columns will be lost
- **UI Simplification**: Forms become much simpler and focused
- **Code Cleanup**: Removes unused code paths and complexity
- **Performance**: Smaller table with fewer columns

## Benefits
1. **Cleaner UI** - Simplified forms with only essential fields
2. **Easier Maintenance** - Less code to maintain
3. **Better UX** - Users aren't confused by unused fields
4. **Focused Functionality** - Model matches actual use case