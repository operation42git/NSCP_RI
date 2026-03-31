# Root Cause Analysis: Identifier Search Not Finding Data

## Data Flow Analysis

### 1. How Data Gets Stored in ROI Database

**Flow:**
1. XML file uploaded → Platform receives XML
2. `PlatformEftiSchemaUtils.commonToIdentifiers()` converts common XML to identifier format
   - **No normalization** - just namespace conversion and node filtering
3. `IdentifiersMapper.eDeliveryToEntity()` maps XML to database entities
   - **Line 132**: `usedTransportEquipment.setEquipmentId(equipment.getId().getValue());`
   - **Stores identifier EXACTLY as it appears in XML** - no normalization, no dash removal

**Key Finding:** The mapper stores identifiers **as-is** from XML. If XML has `SI-LJ-5678CD`, it's stored as `SI-LJ-5678CD`.

### 2. How Search Works

**Search Query** (`IdentifiersRepository.java:88`):
```java
predicates.add(cb.equal(cb.upper(equipmentJoin.get(VEHICLE_ID)), request.getIdentifier().toUpperCase()));
```

**What happens:**
- User enters: `SI-LJ-5678CD` → Frontend validation rejects dashes → User removes dashes → Search for: `SILJ5678CD`
- Database has: `SI-LJ-5678CD` (with dashes, as stored from XML)
- Query: `WHERE UPPER(equipment_id) = UPPER('SILJ5678CD')`
- Result: **NO MATCH** because `'SI-LJ-5678CD' != 'SILJ5678CD'`

### 3. Verification Needed

**You mentioned:** "the identifier db has the correct format (without dashes)"

**Please verify this by running:**

```sql
-- Croatia database (eftihr schema)
SELECT equipment_id, LENGTH(equipment_id) as len
FROM eftihr.used_transport_equipment
WHERE equipment_id LIKE '%5678CD%' OR equipment_id LIKE '%SI-LJ%' OR equipment_id LIKE '%SILJ%';

-- Slovenia database (eftislo schema)  
SELECT equipment_id, LENGTH(equipment_id) as len
FROM eftislo.used_transport_equipment
WHERE equipment_id LIKE '%5678CD%' OR equipment_id LIKE '%SI-LJ%' OR equipment_id LIKE '%SILJ%';
```

**Expected Results:**
- If database has `SILJ5678CD` (no dashes) → Search should work, issue is elsewhere
- If database has `SI-LJ-5678CD` (with dashes) → Search won't work, needs normalization fix

## Possible Root Causes

### Scenario A: Database Has Dashes (Most Likely)
- **Evidence:** Mapper stores identifiers as-is from XML
- **Root Cause:** XML contains `SI-LJ-5678CD`, stored as `SI-LJ-5678CD`, but search looks for `SILJ5678CD`
- **Fix:** Normalize search query to remove dashes before comparing

### Scenario B: Database Has No Dashes
- **Evidence:** You stated database has correct format
- **Possible Causes:**
  1. XML files themselves have identifiers without dashes
  2. Some normalization happens before storage (not found in code review)
  3. Data was manually updated/imported in normalized format
- **If this is true:** Search should work. Need to check:
  - Are there any filters applied that exclude the data?
  - Is the search query correct?
  - Are there JOIN conditions that might exclude results?
  - Is the data in the correct schema/database?

### Scenario C: Case Sensitivity or Other Character Issues
- **Possible:** Extra spaces, different dashes (en-dash vs hyphen), encoding issues
- **Check:** Run the SQL query above and inspect the actual characters

## Next Steps

1. **Verify database content** - Run the SQL queries above
2. **Check XML source files** - What format do they have?
3. **Check search query execution** - Add logging to see what query is actually executed
4. **Check JOIN conditions** - Verify all JOINs are LEFT JOINs and not excluding data

## Code Locations

- **Storage:** `implementation/registry-of-identifiers/src/main/java/eu/efti/identifiersregistry/IdentifiersMapper.java:132`
- **Search:** `implementation/registry-of-identifiers/src/main/java/eu/efti/identifiersregistry/repository/IdentifiersRepository.java:88`
- **Validation:** `implementation/commons/src/main/java/eu/efti/commons/dto/SearchWithIdentifiersRequestDto.java:29`



