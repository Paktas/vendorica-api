# Migration 028: Disable RLS on Organizations and Vendors Tables

## Problem
After switching to custom authentication, organizations and vendors are not displaying in the UI because RLS policies prevent access when using the anonymous Supabase client.

## Solution
Disable RLS on the `organizations` and `vendors` tables to allow access with our custom authentication system, similar to what was done for the `fields` table in migration 026.

## Impact
- ✅ Organizations will be visible in the UI
- ✅ Vendors will be visible in the UI  
- ✅ Services can access data using the anonymous Supabase client
- ✅ Organization filtering still works based on user's organization_id

## Tables Affected
- `organizations` - RLS disabled
- `vendors` - RLS disabled

## Rollback
The rollback re-enables RLS on both tables.

## Dependencies
- Requires migration 026 (disable RLS on API tables)