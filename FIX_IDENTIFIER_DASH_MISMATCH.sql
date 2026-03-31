-- Fix Identifier Dash Mismatch Issue
-- This script updates equipment identifiers to remove dashes to match search format

-- ============================================
-- CROATIA DATABASE (eftihr schema)
-- ============================================
-- Connect to Croatia ROI database

-- Step 1: Check current state
SELECT 'Croatia - Before Update:' as step;
SELECT 
    equipment_id,
    COUNT(*) as count
FROM eftihr.used_transport_equipment
WHERE equipment_id LIKE '%5678CD%' OR equipment_id LIKE '%SI-LJ%' OR equipment_id LIKE '%SILJ%'
GROUP BY equipment_id;

-- Step 2: Update equipment IDs to remove dashes
UPDATE eftihr.used_transport_equipment 
SET equipment_id = REPLACE(equipment_id, '-', '')
WHERE equipment_id LIKE '%-%';

-- Step 3: Update carried transport equipment IDs too
UPDATE eftihr.carried_transport_equipment 
SET equipment_id = REPLACE(equipment_id, '-', '')
WHERE equipment_id LIKE '%-%';

-- Step 4: Verify update
SELECT 'Croatia - After Update:' as step;
SELECT 
    equipment_id,
    COUNT(*) as count
FROM eftihr.used_transport_equipment
WHERE equipment_id LIKE '%5678CD%' OR equipment_id LIKE '%SILJ%'
GROUP BY equipment_id;
-- Should show: SILJ5678CD

-- Step 5: Test search query
SELECT 'Croatia - Test Search:' as step;
SELECT c.gate_id, c.platform_id, c.dataset_id, ute.equipment_id
FROM eftihr.consignment c
JOIN eftihr.used_transport_equipment ute ON c.id = ute.consignment_id
WHERE UPPER(ute.equipment_id) = UPPER('SILJ5678CD');
-- Should return rows

-- ============================================
-- SLOVENIA DATABASE (eftislo schema)
-- ============================================
-- Connect to Slovenia ROI database

-- Step 1: Check current state
SELECT 'Slovenia - Before Update:' as step;
SELECT 
    equipment_id,
    COUNT(*) as count
FROM eftislo.used_transport_equipment
WHERE equipment_id LIKE '%5678CD%' OR equipment_id LIKE '%SI-LJ%' OR equipment_id LIKE '%SILJ%'
GROUP BY equipment_id;

-- Step 2: Update equipment IDs to remove dashes
UPDATE eftislo.used_transport_equipment 
SET equipment_id = REPLACE(equipment_id, '-', '')
WHERE equipment_id LIKE '%-%';

-- Step 3: Update carried transport equipment IDs too
UPDATE eftislo.carried_transport_equipment 
SET equipment_id = REPLACE(equipment_id, '-', '')
WHERE equipment_id LIKE '%-%';

-- Step 4: Verify update
SELECT 'Slovenia - After Update:' as step;
SELECT 
    equipment_id,
    COUNT(*) as count
FROM eftislo.used_transport_equipment
WHERE equipment_id LIKE '%5678CD%' OR equipment_id LIKE '%SILJ%'
GROUP BY equipment_id;
-- Should show: SILJ5678CD

-- Step 5: Test search query
SELECT 'Slovenia - Test Search:' as step;
SELECT c.gate_id, c.platform_id, c.dataset_id, ute.equipment_id
FROM eftislo.consignment c
JOIN eftislo.used_transport_equipment ute ON c.id = ute.consignment_id
WHERE UPPER(ute.equipment_id) = UPPER('SILJ5678CD');
-- Should return rows

-- ============================================
-- Also check means (vehicle) identifiers
-- ============================================

-- Croatia
UPDATE eftihr.main_carriage_transport_movement 
SET used_transport_means_id = REPLACE(used_transport_means_id, '-', '')
WHERE used_transport_means_id LIKE '%-%';

-- Slovenia
UPDATE eftislo.main_carriage_transport_movement 
SET used_transport_means_id = REPLACE(used_transport_means_id, '-', '')
WHERE used_transport_means_id LIKE '%-%';



