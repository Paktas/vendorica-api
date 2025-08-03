-- Migration 003: Fix contract RLS policies
-- Description: Fix contract RLS policies to properly separate operations
-- Author: Development Team
-- Date: 2024-12-31
-- Original: sql/04_contracts_rls_fix.sql

-- Drop the existing overly broad policy
DROP POLICY IF EXISTS "Users can access contracts for their organization vendors" ON contracts;

-- CREATE separate policies for different operations

-- SELECT policy: Users can view contracts for vendors in their organization
CREATE POLICY "Users can view contracts for their organization vendors" ON contracts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM vendors v, users u
            WHERE v.id = contracts.vendor_id
            AND u.id = auth.uid()
            AND u.org_id = v.org_id
        )
    );

-- INSERT policy: Users can create contracts for vendors in their organization
CREATE POLICY "Users can create contracts for their organization vendors" ON contracts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors v, users u
            WHERE v.id = vendor_id  -- Reference the column directly, not the table
            AND u.id = auth.uid()
            AND u.org_id = v.org_id
        )
    );

-- UPDATE policy: Users can update contracts for vendors in their organization  
CREATE POLICY "Users can update contracts for their organization vendors" ON contracts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM vendors v, users u
            WHERE v.id = contracts.vendor_id
            AND u.id = auth.uid()
            AND u.org_id = v.org_id
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors v, users u
            WHERE v.id = vendor_id
            AND u.id = auth.uid()
            AND u.org_id = v.org_id
        )
    );

-- DELETE policy: Users can delete contracts for vendors in their organization
CREATE POLICY "Users can delete contracts for their organization vendors" ON contracts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM vendors v, users u
            WHERE v.id = contracts.vendor_id
            AND u.id = auth.uid()
            AND u.org_id = v.org_id
        )
    );