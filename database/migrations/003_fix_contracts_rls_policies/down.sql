-- Migration 003 Rollback: Restore original contract RLS policy
-- Description: Remove granular policies and restore original broad policy
-- Author: Development Team
-- Date: 2024-12-31

-- Drop the granular policies
DROP POLICY IF EXISTS "Users can view contracts for their organization vendors" ON contracts;
DROP POLICY IF EXISTS "Users can create contracts for their organization vendors" ON contracts;
DROP POLICY IF EXISTS "Users can update contracts for their organization vendors" ON contracts;
DROP POLICY IF EXISTS "Users can delete contracts for their organization vendors" ON contracts;

-- Restore original broad policy (if it existed)
-- Note: This recreates the original policy that was problematic
CREATE POLICY "Users can access contracts for their organization vendors" ON contracts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vendors v, users u
            WHERE v.id = contracts.vendor_id
            AND u.id = auth.uid()
            AND u.organization_id = v.organization_id
        )
    );