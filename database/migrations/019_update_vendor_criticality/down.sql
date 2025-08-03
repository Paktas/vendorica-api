-- Migration Rollback: 019_update_vendor_criticality
-- Description: Rollback criticality column to critical_third_party
-- Author: Claude Code
-- Created: 2025-01-27

-- Step 1: Add back the old critical_third_party column
ALTER TABLE vendors 
ADD COLUMN critical_third_party VARCHAR(20) 
CHECK (critical_third_party IN ('yes', 'no', 'under_review'));

-- Step 2: Migrate data back to old format
-- Map 'Critical' back to 'yes' (we can't distinguish between original 'yes' and 'under_review')
-- Map 'NonCritical' back to 'no'
-- NULL values remain NULL
UPDATE vendors 
SET critical_third_party = CASE 
    WHEN criticality = 'Critical' THEN 'yes'
    WHEN criticality = 'NonCritical' THEN 'no'
    ELSE NULL
END;

-- Step 3: Drop the new column
ALTER TABLE vendors DROP COLUMN criticality;

-- Step 4: Restore original comment
COMMENT ON COLUMN vendors.critical_third_party IS 'Whether vendor is considered a critical third party';

-- Restore original table comment
COMMENT ON TABLE vendors IS 'Third-party vendors managed by organizations';