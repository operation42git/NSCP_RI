-- Fix Gate ID Mismatch Issue
-- This script updates the Slovenia gate ID to match the configuration

-- Check current state
SELECT country, gateid FROM gate ORDER BY country;

-- Update Slovenia gate ID from 'syldavia' to 'slovenia'
UPDATE gate 
SET gateid = 'slovenia', 
    lastmodifieddate = CURRENT_TIMESTAMP
WHERE country = 'SI' AND gateid = 'syldavia';

-- Verify the update
SELECT country, gateid FROM gate WHERE country = 'SI';
-- Expected result: SI | slovenia

-- Final verification - all gates should match their configurations:
-- AT: listenbourg (matches application-AT.yml: owner: listenbourg) ✅
-- HR: borduria (matches application-HR.yml: owner: borduria) ✅
-- SI: slovenia (matches application-SLO.yml: owner: slovenia) ✅



