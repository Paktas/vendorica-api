# Migration 023: Add last_login Field to Users Table

## Overview
This migration adds a `last_login` timestamp field to the `users` table to track when users last successfully logged into the system.

## Changes Made
- Adds `last_login TIMESTAMP WITH TIME ZONE` column to the `users` table
- Column is nullable (users who have never logged in will have NULL value)
- Adds documentation comment explaining the field's purpose

## Business Impact
- Enables tracking of user login activity for security and analytics purposes
- Provides data for "Last Login" display in user profiles and administration interfaces
- Supports compliance requirements for user access monitoring

## Technical Details
- Field Type: `TIMESTAMP WITH TIME ZONE`
- Nullable: Yes (NULL indicates user has never logged in)
- Default Value: None (will be NULL for existing users)
- Updated by: Application logic during successful login

## Usage
The field will be automatically updated by the application during the login process in `src/components/auth/Login.tsx`.

## Rollback
The down migration will safely remove the `last_login` column if needed.

## Dependencies
- Requires migration 016 (add_users_updated_at_field) to be applied first