# Migration 022: Rename org_id to organization_id

## Purpose
Standardizes the column naming convention across the entire database by renaming `org_id` to `organization_id`. This eliminates confusion and potential errors caused by inconsistent naming.

## Changes

### 1. Column Renames:
- `users.org_id` → `users.organization_id`
- `vendors.org_id` → `vendors.organization_id` (if exists)
- `contracts.org_id` → `contracts.organization_id` (if exists)

### 2. RLS Policy Updates:
All Row Level Security policies that reference `org_id` are updated to use `organization_id`:
- Contracts policies (view, update, insert, delete)
- Fields policies (view, create, update, delete)
- Any other policies that reference the column

### 3. Index Updates:
- `idx_users_org_id` → `idx_users_organization_id`

### 4. Documentation:
Added column comments to clarify the purpose of `organization_id` columns.

## Impact
- **Breaking Change**: All application code that references `org_id` must be updated to use `organization_id`
- Affects TypeScript interfaces, service layer queries, and component code
- No data loss - only column names are changed

## Application Code Updates Required
After running this migration, update:
1. TypeScript interfaces (User, Vendor, Contract types)
2. Service layer code (all references to org_id)
3. Component code that directly references org_id
4. Any SQL queries in the codebase

## Testing
1. Verify all users can still log in
2. Verify organization filtering still works
3. Verify RLS policies are functioning correctly
4. Test CRUD operations on all affected tables

## Rollback
The down.sql script will revert all column names back to `org_id` and restore the original RLS policies.