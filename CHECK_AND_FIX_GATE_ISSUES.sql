-- Check and Fix Gate ID Issues
-- Run this script to verify and fix gate configuration

-- Step 1: Check current gate configuration
SELECT 'Current Gate Configuration:' as step;
SELECT country, gateid, createddate, lastmodifieddate 
FROM gate 
ORDER BY country;

-- Step 2: Verify expected values
SELECT 'Expected Configuration:' as step;
SELECT 'AT' as country, 'listenbourg' as expected_gateid
UNION ALL
SELECT 'HR', 'borduria'
UNION ALL
SELECT 'SI', 'slovenia';

-- Step 3: Update Slovenia if needed
UPDATE gate 
SET gateid = 'slovenia', 
    lastmodifieddate = CURRENT_TIMESTAMP
WHERE country = 'SI' AND gateid != 'slovenia';

-- Step 4: Verify update
SELECT 'After Update:' as step;
SELECT country, gateid 
FROM gate 
WHERE country = 'SI';

-- Step 5: Check for any requests with old gate ID (for reference)
-- Note: These are historical and won't affect new requests
SELECT 'Requests with syldavia gateIdDest (historical):' as step;
SELECT COUNT(*) as count
FROM request r
WHERE r.gate_id_dest = 'syldavia';

-- Step 6: Check recent identifier requests status
SELECT 'Recent Identifier Requests Status:' as step;
SELECT 
    c.requestid,
    c.status as control_status,
    r.status as request_status,
    r.gate_id_dest,
    e.errorcode,
    e.errordescription
FROM control c
LEFT JOIN request r ON r.control_id = c.id
LEFT JOIN error e ON r.error_id = e.id
WHERE c.requesttype IN ('EXTERNAL_IDENTIFIERS_SEARCH', 'LOCAL_IDENTIFIERS_SEARCH')
ORDER BY c.createddate DESC
LIMIT 10;



