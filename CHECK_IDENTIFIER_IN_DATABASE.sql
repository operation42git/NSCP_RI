-- Check how identifier SI-LJ-5678CD / SILJ5678CD is stored in databases

-- ============================================
-- CROATIA DATABASE (eftihr schema)
-- ============================================
-- Connect to Croatia ROI database: psql -h psql-meta -U efti -d efti

-- Check used_transport_equipment table
SELECT 'Croatia - Used Transport Equipment:' as check_type;
SELECT 
    ute.id,
    ute.equipment_id,
    LENGTH(ute.equipment_id) as length,
    ute.registration_country,
    c.gate_id,
    c.platform_id,
    c.dataset_id
FROM eftihr.used_transport_equipment ute
JOIN eftihr.consignment c ON c.id = ute.consignment_id
WHERE ute.equipment_id LIKE '%5678CD%' 
   OR ute.equipment_id LIKE '%SI-LJ%' 
   OR ute.equipment_id LIKE '%SILJ%'
ORDER BY ute.equipment_id;

-- Check carried_transport_equipment table
SELECT 'Croatia - Carried Transport Equipment:' as check_type;
SELECT 
    cte.id,
    cte.equipment_id,
    LENGTH(cte.equipment_id) as length,
    c.gate_id,
    c.platform_id,
    c.dataset_id
FROM eftihr.carried_transport_equipment cte
JOIN eftihr.consignment c ON c.id = cte.consignment_id
WHERE cte.equipment_id LIKE '%5678CD%' 
   OR cte.equipment_id LIKE '%SI-LJ%' 
   OR cte.equipment_id LIKE '%SILJ%'
ORDER BY cte.equipment_id;

-- Test the actual search query that the system runs
SELECT 'Croatia - Test Search Query:' as check_type;
SELECT c.*
FROM eftihr.consignment c
LEFT JOIN eftihr.main_carriage_transport_movement mctm ON c.id = mctm.consignment_id
LEFT JOIN eftihr.used_transport_equipment ute ON c.id = ute.consignment_id
WHERE UPPER(ute.equipment_id) = UPPER('SILJ5678CD');  -- What system searches for (no dashes)
-- This will return 0 rows if data is stored as 'SI-LJ-5678CD'

-- ============================================
-- SLOVENIA DATABASE (eftislo schema)
-- ============================================
-- Connect to Slovenia ROI database: psql -h psql-meta -U efti -d efti

-- Check used_transport_equipment table
SELECT 'Slovenia - Used Transport Equipment:' as check_type;
SELECT 
    ute.id,
    ute.equipment_id,
    LENGTH(ute.equipment_id) as length,
    ute.registration_country,
    c.gate_id,
    c.platform_id,
    c.dataset_id
FROM eftislo.used_transport_equipment ute
JOIN eftislo.consignment c ON c.id = ute.consignment_id
WHERE ute.equipment_id LIKE '%5678CD%' 
   OR ute.equipment_id LIKE '%SI-LJ%' 
   OR ute.equipment_id LIKE '%SILJ%'
ORDER BY ute.equipment_id;

-- Check carried_transport_equipment table
SELECT 'Slovenia - Carried Transport Equipment:' as check_type;
SELECT 
    cte.id,
    cte.equipment_id,
    LENGTH(cte.equipment_id) as length,
    c.gate_id,
    c.platform_id,
    c.dataset_id
FROM eftislo.carried_transport_equipment cte
JOIN eftislo.consignment c ON c.id = cte.consignment_id
WHERE cte.equipment_id LIKE '%5678CD%' 
   OR cte.equipment_id LIKE '%SI-LJ%' 
   OR cte.equipment_id LIKE '%SILJ%'
ORDER BY cte.equipment_id;

-- Test the actual search query that the system runs
SELECT 'Slovenia - Test Search Query:' as check_type;
SELECT c.*
FROM eftislo.consignment c
LEFT JOIN eftislo.main_carriage_transport_movement mctm ON c.id = mctm.consignment_id
LEFT JOIN eftislo.used_transport_equipment ute ON c.id = ute.consignment_id
WHERE UPPER(ute.equipment_id) = UPPER('SILJ5678CD');  -- What system searches for (no dashes)
-- This will return 0 rows if data is stored as 'SI-LJ-5678CD'
