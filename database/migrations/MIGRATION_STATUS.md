# Database Migration Status

## Applied Migrations

| Version | Name | Status | Applied Date | Notes |
|---------|------|--------|--------------|-------|
| 001 | create_initial_tables | ⏸️ **NOT NEEDED** | - | Schema already exists from legacy setup |
| 002 | add_user_preferences | ✅ **APPLIED** | 2024-12-31 | timezone, date_format columns added |
| 003 | fix_contracts_rls_policies | ✅ **APPLIED** | 2024-12-31 | RLS policies fixed (org_id fields) |
| 004 | replace_user_is_active_with_status | ✅ **APPLIED** | 2025-07-26 | Replace is_active boolean with status ENUM |
| 005 | add_user_time_format | ✅ **APPLIED** | 2025-07-26 | Add time_format column with European default |
| 008 | expand_audit_operations | ✅ **APPLIED** | 2025-07-27 | Expand audit_trail operation constraint to include LOGIN, LOGOUT, EXPORT, EDIT_START, EDIT_FINISH |
| 025 | nextauth_tables | ❌ **REMOVED** | 2025-07-31 | NextAuth tables removed - custom authentication implemented instead |
| 026 | disable_rls_api_tables | ✅ **APPLIED** | 2025-07-31 | Disable RLS on fields and field_options tables for API access |

## Removed Migrations

| Version | Name | Status | Removed Date | Reason |
|---------|------|--------|--------------|-------|
| 026 | login_authentication_function | ❌ **REMOVED** | 2025-07-30 | Unused DB function - replaced by Node.js middleware authentication |

## Database State

**Current State**: Database has been migrated to new migration system
- migration system started with migration 002
- All future changes will use the new migration system

## Next Migration

Next migration should be numbered: **027**

Example for new changes:
```bash
mkdir database/migrations/027_your_next_change/
```

## Validation

✅ Users table has timezone and date_format columns  
✅ Contract RLS policies are properly separated  
✅ Migration system is operational  
✅ Legacy content preserved in archive  
✅ Audit trail operations expanded (LOGIN, LOGOUT, EXPORT, EDIT_START, EDIT_FINISH)  
✅ IP address logging fully functional  
✅ Custom authentication system implemented (Node.js middleware) - no NextAuth dependency  
✅ Audit trail disabled RLS for system logging  
✅ Fields and field_options tables RLS disabled for API access  

## Important Notes

1. **Never modify** migrations 002 and 003 - they are applied and immutable
2. **Always use new migration system** for future changes
3. **Archive legacy /sql folder** when ready
4. **Start with migration 004** for next database change