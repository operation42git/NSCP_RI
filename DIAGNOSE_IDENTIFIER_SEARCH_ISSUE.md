# Diagnosing Identifier Search Issue

## Problem

Search for `SILJ5678CD` (without dashes) doesn't find data that exists with identifier `SI-LJ-5678CD` (with dashes) in Croatia and Slovenia databases.

## Root Cause Analysis

### How Data is Stored

**Mapper Code** (`IdentifiersMapper.java:132`):
```java
usedTransportEquipment.setEquipmentId(equipment.getId().getValue());
```

**Result**: Data is stored **AS-IS** from XML. If XML has `SI-LJ-5678CD`, it's stored as `SI-LJ-5678CD` (with dashes).

### How Search Works

**Search Query** (`IdentifiersRepository.java:88`):
```java
predicates.add(cb.equal(cb.upper(equipmentJoin.get(VEHICLE_ID)), request.getIdentifier().toUpperCase()));
```

**Search Input**: User enters `SI-LJ-5678CD` → Validation rejects dashes → User removes dashes → Search for `SILJ5678CD`

**Result**: 
- Database has: `SI-LJ-5678CD` (with dashes)
- Search for: `SILJ5678CD` (without dashes)
- **They don't match!**

## Database Check Queries

### Check Croatia Database

```sql
-- Connect to Croatia ROI database (eftihr schema)
-- Database: efti, Schema: eftihr, Host: psql-meta:5432

-- Check if data exists with dashes
SELECT 
    c.gate_id,
    c.platform_id,
    c.dataset_id,
    ute.equipment_id,
    ute.registration_country,
    mctm.mode_code
FROM eftihr.consignment c
JOIN eftihr.used_transport_equipment ute ON c.id = ute.consignment_id
LEFT JOIN eftihr.main_carriage_transport_movement mctm ON c.id = mctm.consignment_id
WHERE ute.equipment_id LIKE '%5678CD%';

-- Test search query (what system actually runs)
SELECT c.*
FROM eftihr.consignment c
LEFT JOIN eftihr.main_carriage_transport_movement mctm ON c.id = mctm.consignment_id
LEFT JOIN eftihr.used_transport_equipment ute ON c.id = ute.consignment_id
WHERE UPPER(ute.equipment_id) = UPPER('SILJ5678CD');  -- Search value (no dashes)
-- This will return 0 rows if data is stored as 'SI-LJ-5678CD'
```

### Check Slovenia Database

```sql
-- Connect to Slovenia ROI database (eftislo schema)
-- Database: efti, Schema: eftislo, Host: psql-meta:5432

-- Check if data exists with dashes
SELECT 
    c.gate_id,
    c.platform_id,
    c.dataset_id,
    ute.equipment_id,
    ute.registration_country,
    mctm.mode_code
FROM eftislo.consignment c
JOIN eftislo.used_transport_equipment ute ON c.id = ute.consignment_id
LEFT JOIN eftislo.main_carriage_transport_movement mctm ON c.id = mctm.consignment_id
WHERE ute.equipment_id LIKE '%5678CD%';

-- Test search query
SELECT c.*
FROM eftislo.consignment c
LEFT JOIN eftislo.main_carriage_transport_movement mctm ON c.id = mctm.consignment_id
LEFT JOIN eftislo.used_transport_equipment ute ON c.id = ute.consignment_id
WHERE UPPER(ute.equipment_id) = UPPER('SILJ5678CD');  -- Search value (no dashes)
-- This will return 0 rows if data is stored as 'SI-LJ-5678CD'
```

## Solutions

### Solution 1: Normalize Data on Storage (Recommended)

Modify the mapper to remove dashes when storing:

**File**: `implementation/registry-of-identifiers/src/main/java/eu/efti/identifiersregistry/IdentifiersMapper.java`

```java
private static UsedTransportEquipment toUsedTransportEquipmentEntity(LogisticsTransportEquipment equipment) {
    UsedTransportEquipment usedTransportEquipment = new UsedTransportEquipment();
    // Remove dashes and other non-alphanumeric characters to match search format
    String equipmentId = equipment.getId().getValue();
    if (equipmentId != null) {
        equipmentId = equipmentId.replaceAll("[^A-Za-z0-9]", "");  // Remove dashes, spaces, etc.
    }
    usedTransportEquipment.setEquipmentId(equipmentId);
    // ... rest of code
}
```

**Pros**: 
- Future data will be normalized
- Consistent with search format

**Cons**: 
- Doesn't fix existing data
- Need to update existing records

### Solution 2: Normalize Search Query

Modify search to remove dashes before comparing:

**File**: `implementation/registry-of-identifiers/src/main/java/eu/efti/identifiersregistry/repository/IdentifiersRepository.java`

```java
default List<Consignment> findAllForEquipment(SearchWithIdentifiersRequestDto request) {
    return this.findAll((root, query, cb) -> {
        final List<Predicate> predicates = new ArrayList<>();
        Join<Consignment, MainCarriageTransportMovement> mainCarriageTransportMovementJoin = root.join(MOVEMENTS, JoinType.LEFT);
        Join<Consignment, UsedTransportEquipment> equipmentJoin = root.join(TRANSPORT_VEHICLES, JoinType.LEFT);
        
        // Normalize search value: remove dashes and non-alphanumeric
        String searchIdentifier = request.getIdentifier().replaceAll("[^A-Za-z0-9]", "");
        
        // Use REPLACE function to normalize database values for comparison
        Expression<String> normalizedEquipmentId = cb.function("REPLACE", String.class, 
            cb.upper(equipmentJoin.get(VEHICLE_ID)), 
            cb.literal("-"), 
            cb.literal(""));
        predicates.add(cb.equal(normalizedEquipmentId, searchIdentifier.toUpperCase()));
        
        // ... rest of code
    });
}
```

**Pros**: 
- Works with existing data
- No need to update database

**Cons**: 
- Database-specific (PostgreSQL REPLACE function)
- May impact performance (function on column)

### Solution 3: Update Existing Data

Update existing records to remove dashes:

```sql
-- Croatia database
UPDATE eftihr.used_transport_equipment 
SET equipment_id = REPLACE(equipment_id, '-', '')
WHERE equipment_id LIKE '%-%';

-- Slovenia database  
UPDATE eftislo.used_transport_equipment 
SET equipment_id = REPLACE(equipment_id, '-', '')
WHERE equipment_id LIKE '%-%';

-- Verify update
SELECT equipment_id FROM eftihr.used_transport_equipment WHERE equipment_id LIKE '%5678CD%';
SELECT equipment_id FROM eftislo.used_transport_equipment WHERE equipment_id LIKE '%5678CD%';
```

**Pros**: 
- Fixes existing data
- Simple solution

**Cons**: 
- Need to update both databases
- Future data still needs normalization

## Recommended Approach

**Combine Solutions 1 and 3**:
1. Update existing data (Solution 3)
2. Normalize on storage (Solution 1) to prevent future issues

## Check Logs

Look for search execution logs:

```bash
# If running in Docker
docker logs efti-gate-gate-1 --tail 100 | grep -i "identifier\|equipment\|search"

# Check for SQL queries
docker logs efti-gate-gate-1 --tail 100 | grep -i "select.*equipment"
```

Look for:
- Search query execution
- Number of results returned (should be 0 if mismatch)
- Any database errors



