# Migration 026: Disable RLS on API-Managed Tables

## Purpose
Disable Row Level Security (RLS) on tables that are managed through our API layer, since authentication and authorization are handled by the Node.js middleware.

## Changes
- Disables RLS on `fields` table
- Disables RLS on `field_options` table  
- Ensures RLS is disabled on `users` table

## Rationale
With our API-first architecture:
1. Authentication is handled by JWT tokens in the API layer
2. Authorization checks are performed in the API endpoints
3. Organization-based filtering is applied in API queries
4. Having RLS enabled causes conflicts when the API tries to access data

## Security Model
Security is maintained through:
- API authentication (Bearer tokens)
- API-level permission checks
- Organization-scoped queries in the API layer
- Audit trail logging for all operations

## Application
Run this migration to fix the "row-level security policy" errors when creating/updating fields.