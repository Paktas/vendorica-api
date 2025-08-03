# Migration 008: Expand Audit Operations

## Description
This migration expands the `audit_trail` table's operation check constraint to include additional operations needed for comprehensive audit logging.

## Operations Added
- `LOGIN` - User authentication events
- `LOGOUT` - User session termination events  
- `EXPORT` - Data export operations
- `EDIT_START` - When user begins editing a record
- `EDIT_FINISH` - When user completes editing a record

## How to Apply

### Option 1: Manual SQL Execution
Connect to your PostgreSQL database and run:

```sql
-- Run the migration
\i database/migrations/008_expand_audit_operations/up.sql
```

### Option 2: Using psql
```bash
psql -d your_database_name -f database/migrations/008_expand_audit_operations/up.sql
```

### Option 3: Supabase Dashboard
1. Go to Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `up.sql`
3. Execute the SQL

## Verification
After applying, verify the constraint was updated:

```sql
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'audit_trail_operation_check';
```

Expected result should show the expanded operation list.

## Rollback
If needed, you can rollback using:

```sql
\i database/migrations/008_expand_audit_operations/down.sql
```

## Impact
- ✅ No data loss
- ✅ No downtime required  
- ✅ Backward compatible
- ✅ Enables full audit logging functionality including IP address tracking

## Related Changes
This migration enables the application code to properly log:
- User login/logout events with IP addresses
- Edit form lifecycle events
- Export operations
- All audit events now include IP address tracking