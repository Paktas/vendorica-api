-- Migration: 019_update_vendor_criticality
-- Description: Rename critical_third_party to criticality with simplified enum values
-- Author: Claude Code
-- Created: 2025-01-27

-- Step 1: Add new criticality column with the new enum values
ALTER TABLE vendors 
ADD COLUMN criticality VARCHAR(20) 
CHECK (criticality IN ('Critical', 'NonCritical'));

-- Step 2: Migrate existing data
-- Map 'yes' and 'under_review' to 'Critical'
-- Map 'no' to 'NonCritical'
-- NULL values remain NULL
UPDATE vendors 
SET criticality = CASE 
    WHEN critical_third_party = 'yes' THEN 'Critical'
    WHEN critical_third_party = 'under_review' THEN 'Critical'  
    WHEN critical_third_party = 'no' THEN 'NonCritical'
    ELSE NULL
END;

-- Step 3: Drop the old column
ALTER TABLE vendors DROP COLUMN critical_third_party;

-- Step 4: Add comment for the new column
COMMENT ON COLUMN vendors.criticality IS 'Vendor criticality level following DORA standards (Critical/NonCritical)';

-- Update the schema documentation comment
COMMENT ON TABLE vendors IS 'Third-party vendors managed by organizations with DORA-compliant criticality levels';