-- Migration script to update 'borduria' to 'croatia' in database tables
-- Run this script on the Croatia gate database (eftihr schema) and identifiers database

-- ============================================
-- GATE DATABASE (eftihr schema)
-- ============================================

-- Update gate table
UPDATE efti.gate 
SET gateid = 'croatia', 
    lastmodifieddate = CURRENT_TIMESTAMP
WHERE country = 'HR' AND gateid = 'borduria';

-- Update control table - gateid column
UPDATE efti.control 
SET gateid = 'croatia',
    lastmodifieddate = CURRENT_TIMESTAMP
WHERE gateid = 'borduria';

-- Update control table - fromgateid column (if it references borduria)
UPDATE efti.control 
SET fromgateid = 'croatia',
    lastmodifieddate = CURRENT_TIMESTAMP
WHERE fromgateid = 'borduria';

-- Update request table - gateiddest column
UPDATE efti.request 
SET gateiddest = 'croatia',
    lastmodifieddate = CURRENT_TIMESTAMP
WHERE gateiddest = 'borduria';

-- ============================================
-- IDENTIFIERS DATABASE (eftihr schema)
-- ============================================

-- Update consignment table - gate_id column
UPDATE consignment 
SET gate_id = 'croatia',
    lastmodifieddate = CURRENT_TIMESTAMP
WHERE gate_id = 'borduria';

-- ============================================
-- VERIFICATION QUERIES (run these to check results)
-- ============================================

-- Check gate table
-- SELECT * FROM efti.gate WHERE country = 'HR';

-- Check control table
-- SELECT COUNT(*) as borduria_count FROM efti.control WHERE gateid = 'borduria';
-- SELECT COUNT(*) as croatia_count FROM efti.control WHERE gateid = 'croatia';

-- Check request table
-- SELECT COUNT(*) as borduria_count FROM efti.request WHERE gateiddest = 'borduria';
-- SELECT COUNT(*) as croatia_count FROM efti.request WHERE gateiddest = 'croatia';

-- Check consignment table
-- SELECT COUNT(*) as borduria_count FROM consignment WHERE gate_id = 'borduria';
-- SELECT COUNT(*) as croatia_count FROM consignment WHERE gate_id = 'croatia';



