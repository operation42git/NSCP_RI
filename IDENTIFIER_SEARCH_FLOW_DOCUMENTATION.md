# Identifier Search Flow Documentation

## Overview

This document describes the complete flow for searching equipment identifiers in the eFTI system, including validation rules, search logic, and query conditions.

---

## 1. Field Rules and Validation

### 1.1 Identifier Field (`identifier`)

**Location**: `implementation/commons/src/main/java/eu/efti/commons/dto/SearchWithIdentifiersRequestDto.java`

**Validation Rules**:
- **Required**: Yes (`@NotBlank`)
- **Maximum Length**: 17 characters (`@Length(max = 17)`)
- **Format Pattern**: `^[A-Za-z0-9]*$` (alphanumeric only, **NO DASHES OR SPECIAL CHARACTERS**)
- **Case Sensitivity**: Search is case-insensitive (converted to uppercase in queries)
- **Error Message**: `IDENTIFIER_INCORRECT_FORMAT` if pattern doesn't match

**Example Valid Values**:
- ✅ `SI-LJ-5678CD` → **INVALID** (contains dashes)
- ✅ `SILJ5678CD` → **VALID** (alphanumeric only)
- ✅ `ABC123` → **VALID**
- ✅ `12345678901234567` → **VALID** (17 chars max)

**Example Invalid Values**:
- ❌ `SI-LJ-5678CD` → Contains dashes (`-`)
- ❌ `ABC-123` → Contains dashes
- ❌ `ABC 123` → Contains spaces
- ❌ `ABC@123` → Contains special characters

### 1.2 Mode Code (`modeCode`)

**Validation Rules**:
- **Format Pattern**: `^\\d$` (single digit only)
- **Error Message**: `MODE_CODE_INCORRECT_FORMAT` if pattern doesn't match
- **Optional**: Yes

**Valid Values**: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`

### 1.3 Identifier Type (`identifierType`)

**Validation Rules**:
- **Allowed Values**: Must be one of `IdentifierType` enum values
- **Valid Types**:
  - `MEANS` - Transport means identifier (vehicle ID)
  - `EQUIPMENT` - Transport equipment identifier (container/trailer ID)
  - `CARRIED` - Carried transport equipment identifier (nested equipment)
- **Error Message**: `IDENTIFIER_TYPE_INCORRECT` if invalid
- **Optional**: Yes (if not provided, searches all types)

### 1.4 Registration Country Code (`registrationCountryCode`)

**Validation Rules**:
- **Format**: Must be a valid `CountryCode` enum value (ISO 2-letter country code)
- **Error Message**: `REGISTRATION_COUNTRY_INCORRECT` if invalid
- **Optional**: Yes
- **Purpose**: Filters results by the country where the equipment/vehicle is registered

**Examples**: `HR` (Croatia), `SI` (Slovenia), `FR` (France), `DE` (Germany)

### 1.5 Dangerous Goods Indicator (`dangerousGoodsIndicator`)

**Validation Rules**:
- **Type**: Boolean (`true`, `false`, or `null`)
- **Optional**: Yes
- **Purpose**: Filters results by whether dangerous goods are present

### 1.6 EFTI Gate Indicator (`eftiGateIndicator`)

**Validation Rules**:
- **Type**: List of `CountryIndicator` enum values
- **Error Message**: `GATE_INDICATOR_INCORRECT` if invalid
- **Optional**: Yes
- **Purpose**: Specifies which gate(s)/ROI(s) to search. If not provided, searches ALL registered gates.

**Examples**: `["HR"]`, `["SI"]`, `["HR", "SI"]`, `["BO", "SY"]`

---

## 2. Where Data is Searched

### 2.1 Gate/ROI Selection Logic

**Location**: `implementation/gate/src/main/java/eu/efti/eftigate/service/gate/EftiGateIdResolver.java`

**Flow**:
1. **If `eftiGateIndicator` is provided**:
   - Resolves to specific gate IDs based on country indicators
   - Only searches those specified gates/ROIs
   - Example: `eftiGateIndicator: ["SI"]` → searches only Slovenia ROI

2. **If `eftiGateIndicator` is NOT provided**:
   - Searches **ALL registered gates/ROIs** in the system
   - This includes Croatia, Slovenia, and any other registered gates
   - **This is why you might see results from Croatia even when searching for Slovenia data**

3. **Local vs Remote Search**:
   - If the target gate matches the current gate (`gateProperties.getOwner()`):
     - Performs **local search** directly on local ROI database
   - Otherwise:
     - Sends `IdentifierQuery` via Domibus to remote gate
     - Remote gate searches its ROI database and responds

### 2.2 Database Tables Searched

**Location**: `implementation/registry-of-identifiers/src/main/resources/db.changelog/db.identifiers.changelog-1-initial.sql`

Each ROI (Registry of Identifiers) has its own database with the following tables:

#### Table: `consignment`
- Stores consignment metadata
- Links to transport movements and equipment
- Contains: `gate_id`, `platform_id`, `dataset_id` (UIL components)

#### Table: `main_carriage_transport_movement`
- Stores transport movement information
- Used for **MEANS** identifier searches
- Fields:
  - `used_transport_means_id` (vehicle ID)
  - `used_transport_means_registration_country`
  - `mode_code`
  - `dangerous_goods_indicator`

#### Table: `used_transport_equipment`
- Stores equipment identifiers
- Used for **EQUIPMENT** identifier searches
- Fields:
  - `equipment_id` (container/trailer ID) - **This is where "SI-LJ-5678CD" would be stored**
  - `registration_country` (e.g., "SI", "HR")
  - `id_scheme_agency_id`
  - `sequence_number`

#### Table: `carried_transport_equipment`
- Stores nested/carried equipment identifiers
- Used for **CARRIED** identifier searches
- Fields:
  - `equipment_id`
  - `id_scheme_agency_id`
  - `sequence_number`

---

## 3. Query Conditions and SQL Logic

### 3.1 Equipment Search Query (EQUIPMENT type)

**Location**: `implementation/registry-of-identifiers/src/main/java/eu/efti/identifiersregistry/repository/IdentifiersRepository.java`

**Method**: `findAllForEquipment(SearchWithIdentifiersRequestDto request)`

**Query Structure**:
```java
SELECT c FROM Consignment c
LEFT JOIN c.mainCarriageTransportMovements mainCarriageTransportMovementJoin
LEFT JOIN c.usedTransportEquipments equipmentJoin
WHERE 
    UPPER(equipmentJoin.equipmentId) = UPPER(:identifier)
    AND (if modeCode provided) mainCarriageTransportMovementJoin.modeCode = :modeCode
    AND (if dangerousGoodsIndicator provided) mainCarriageTransportMovementJoin.dangerousGoodsIndicator = :dangerousGoodsIndicator
    AND (if registrationCountryCode provided) equipmentJoin.registrationCountry = :registrationCountryCode
```

**Key Points**:
1. **Case-Insensitive Matching**: `cb.equal(cb.upper(equipmentJoin.get(VEHICLE_ID)), request.getIdentifier().toUpperCase())`
   - Both stored value and search value are converted to uppercase
   - This means `"SILJ5678CD"` will match `"silj5678cd"` or `"SILJ5678CD"`

2. **Registration Country Filter**:
   - If `registrationCountryCode` is provided: `equipmentJoin.registrationCountry = :registrationCountryCode`
   - If **NOT provided**: No country filter is applied, so results from ALL countries are returned

3. **Mode Code Filter**:
   - Applied via `buildCommonAttributesRequest()` method
   - Filters by `mainCarriageTransportMovementJoin.modeCode`

4. **Dangerous Goods Filter**:
   - Applied via `buildCommonAttributesRequest()` method
   - Filters by `mainCarriageTransportMovementJoin.dangerousGoodsIndicator`

### 3.2 Means Search Query (MEANS type)

**Method**: `findAllForMeans(SearchWithIdentifiersRequestDto request)`

**Query Structure**:
```java
SELECT c FROM Consignment c
LEFT JOIN c.mainCarriageTransportMovements mainCarriageTransportMovementJoin
WHERE 
    UPPER(mainCarriageTransportMovementJoin.usedTransportMeansId) = UPPER(:identifier)
    AND (if modeCode provided) mainCarriageTransportMovementJoin.modeCode = :modeCode
    AND (if dangerousGoodsIndicator provided) mainCarriageTransportMovementJoin.dangerousGoodsIndicator = :dangerousGoodsIndicator
    AND (if registrationCountryCode provided) mainCarriageTransportMovementJoin.usedTransportMeansRegistrationCountry = :registrationCountryCode
```

### 3.3 Carried Search Query (CARRIED type)

**Method**: `findAllForCarried(SearchWithIdentifiersRequestDto request)`

**Query Structure**:
```java
SELECT c FROM Consignment c
LEFT JOIN c.mainCarriageTransportMovements mainCarriageTransportMovementJoin
LEFT JOIN c.usedTransportEquipments equipmentJoin
LEFT JOIN equipmentJoin.carriedTransportEquipments carriedJoin
WHERE 
    UPPER(carriedJoin.equipmentId) = UPPER(:identifier)
    AND (if modeCode provided) mainCarriageTransportMovementJoin.modeCode = :modeCode
    AND (if dangerousGoodsIndicator provided) mainCarriageTransportMovementJoin.dangerousGoodsIndicator = :dangerousGoodsIndicator
    -- Note: No registrationCountryCode filter for CARRIED type
```

---

## 4. Complete Search Flow

### 4.1 Request Processing Flow

**Location**: `implementation/gate/src/main/java/eu/efti/eftigate/service/ControlService.java`

**Step-by-Step**:

1. **Request Received** (`POST /v1/control/identifiers`)
   - Validates `SearchWithIdentifiersRequestDto`
   - Creates `ControlDto` with request metadata

2. **Gate Resolution** (`createIdentifiersControl()`)
   - Calls `eftiGateIdResolver.resolve(searchWithIdentifiersRequestDto)`
   - Determines which gates/ROIs to search:
     - If `eftiGateIndicator` provided → specific gates
     - If NOT provided → ALL registered gates

3. **Search Execution**:
   - For each target gate:
     - **If local gate** (`destinationUrl.equalsIgnoreCase(gateProperties.getOwner())`):
       - Calls `eftiAsyncCallsProcessor.checkLocalRepoAsync()`
       - Directly queries local ROI database
     - **If remote gate**:
       - Creates `IdentifierQuery` XML message
       - Sends via Domibus to remote gate
       - Remote gate searches its ROI and responds

4. **Local ROI Search** (`EftiAsyncCallsProcessor.checkLocalRepoAsync()`)
   - Calls `identifiersService.search(identifiersRequestDto)`
   - Executes query based on `identifierType`:
     - `EQUIPMENT` → `findAllForEquipment()`
     - `MEANS` → `findAllForMeans()`
     - `CARRIED` → `findAllForCarried()`
     - If no type specified → searches all three types

5. **Response Consolidation**:
   - Collects results from all searched gates
   - Returns list of matching `ConsignmentDto` objects
   - Each contains UIL information (`gate_id`, `platform_id`, `dataset_id`)

### 4.2 Search Logic Summary

**When searching for `identifier: "SILJ5678CD"` with `identifierType: ["EQUIPMENT"]`:**

1. **Format Validation**: ✅ Passes (alphanumeric only)
2. **Gate Selection**:
   - If `eftiGateIndicator: ["SI"]` → searches only Slovenia ROI
   - If `eftiGateIndicator` NOT provided → searches ALL gates (Croatia, Slovenia, etc.)
3. **Query Execution**:
   ```sql
   SELECT * FROM consignment c
   JOIN used_transport_equipment ute ON c.id = ute.consignment_id
   WHERE UPPER(ute.equipment_id) = 'SILJ5678CD'
   ```
4. **Country Filter**:
   - If `registrationCountryCode: "SI"` → only Slovenia results
   - If NOT provided → results from all countries

---

## 5. Your Specific Issue Analysis

### Problem 1: Format Validation Error

**Identifier**: `SI-LJ-5678CD`

**Error**: `IDENTIFIER_INCORRECT_FORMAT`

**Root Cause**:
- The identifier contains dashes (`-`)
- Validation pattern is `^[A-Za-z0-9]*$` (alphanumeric only)
- Dashes are not allowed

**Solution**:
- Remove dashes: `SILJ5678CD`
- Or store the identifier without dashes in the database

### Problem 2: Finding Results in Croatia When Searching Slovenia

**Identifier**: `SILJ5678CD` (after removing dashes)

**Issue**: System shows Croatia in results even though the identifier doesn't exist in Croatia ROI

**Root Causes**:

1. **Missing `eftiGateIndicator`**:
   - If you don't specify `eftiGateIndicator: ["SI"]`, the system searches ALL registered gates
   - This includes Croatia ROI, even if the identifier doesn't exist there
   - **The system will still return a result entry for Croatia**, even if it's empty or has an error

2. **Missing `identifierType`**:
   - If `identifierType` is NOT provided or empty, the system searches ALL three types:
     - MEANS (vehicle ID in `used_transport_means_id`)
     - EQUIPMENT (equipment ID in `used_transport_equipment.equipment_id`)
     - CARRIED (carried equipment ID)
   - The identifier `SILJ5678CD` might exist as a **MEANS** (vehicle ID) in Croatia, not as EQUIPMENT
   - This would cause Croatia to appear in results even though you're looking for EQUIPMENT

3. **Response Structure**:
   - Even when a gate returns NO results, the system still creates a result entry:
     ```json
     {
       "gateIndicator": "HR",
       "consignments": [],  // Empty list
       "status": "SUCCESS" or "ERROR",
       "errorCode": null or "ID_NOT_FOUND",
       "errorDescription": null or "Id not found."
     }
     ```
   - So Croatia appears in the results list even with no matching consignments

4. **Missing `registrationCountryCode`**:
   - If `registrationCountryCode` is not set to `"SI"`, the query doesn't filter by country
   - Results from all countries are returned

**Why Croatia Shows Up Even Without Matching Data**:

Looking at `getIdentifiersResultDtos()` method (line 408-419 in `ControlService.java`):
- The system creates a result entry for **EVERY gate that was queried**
- Even if Croatia returns an empty list or error, it still appears in results
- The `gateIndicator` field shows which gate the result came from

**Possible Scenarios**:

1. **Croatia returns empty list**: 
   - `consignments: []`
   - `gateIndicator: "HR"`
   - Still appears in results

2. **Croatia returns error**:
   - `errorCode: "ID_NOT_FOUND"` or similar
   - `errorDescription: "Id not found."`
   - `gateIndicator: "HR"`
   - Still appears in results

3. **Identifier exists in different type**:
   - If `identifierType` is not specified, searches MEANS, EQUIPMENT, CARRIED
   - `SILJ5678CD` might exist as MEANS (vehicle) in Croatia, not EQUIPMENT
   - This would cause Croatia to show results

**Recommended Solution**:

```json
{
  "identifier": "SILJ5678CD",
  "identifierType": ["EQUIPMENT"],  // IMPORTANT: Specify type to avoid searching MEANS/CARRIED
  "registrationCountryCode": "SI",
  "eftiGateIndicator": ["SI"]  // IMPORTANT: Only search Slovenia ROI
}
```

This ensures:
- ✅ Format validation passes (no dashes)
- ✅ Only EQUIPMENT type is searched (not MEANS or CARRIED)
- ✅ Only Slovenia ROI is searched (`eftiGateIndicator: ["SI"]`)
- ✅ Only Slovenia-registered equipment is returned (`registrationCountryCode: "SI"`)
- ✅ Croatia won't appear in results at all

---

## 6. Why Croatia Appears in Results Even When Identifier Doesn't Exist

### The Key Issue

**Question**: Why does Croatia appear in search results even though `SILJ5678CD` doesn't exist in Croatia ROI?

**Answer**: The system returns a result entry for **EVERY gate that was queried**, regardless of whether matches were found.

### How Results Are Structured

When you search without `eftiGateIndicator`, the system:

1. **Queries ALL registered gates** (Croatia, Slovenia, etc.)
2. **Each gate returns a response**, even if empty:
   ```json
   {
     "gateIndicator": "HR",  // Croatia gate
     "consignments": [],      // Empty - no matches found
     "status": "SUCCESS",
     "errorCode": null,
     "errorDescription": null
   }
   ```
3. **All responses are included in final results**, including empty ones

### Code Reference

**Location**: `implementation/gate/src/main/java/eu/efti/eftigate/service/ControlService.java`

**Method**: `getIdentifiersResultDtos()` (lines 408-419)

```java
private List<IdentifierRequestResultDto> getIdentifiersResultDtos(final List<IdentifiersRequestDto> requestDtos) {
    final List<IdentifierRequestResultDto> identifierResultDtos = new LinkedList<>();
    requestDtos.forEach(requestDto -> identifierResultDtos.add(
            IdentifierRequestResultDto.builder()
                    .consignments(requestDto.getIdentifiersResults() != null 
                        ? mapperUtils.consignmentDtoToApiDto(requestDto.getIdentifiersResults().getConsignments()) 
                        : Collections.emptyList())  // Empty list if no results
                    .errorCode(requestDto.getError() != null ? requestDto.getError().getErrorCode() : null)
                    .errorDescription(requestDto.getError() != null ? requestDto.getError().getErrorDescription() : null)
                    .gateIndicator(eftiGateIdResolver.resolve(requestDto.getGateIdDest()))  // Shows "HR" for Croatia
                    .status(mapRequestStatus(requestDto.getStatus()))
                    .build())
    );
    return identifierResultDtos;
}
```

**Key Point**: Every `IdentifiersRequestDto` (one per gate queried) becomes a result entry, even if `consignments` is empty.

### Why This Happens

1. **System Design**: The system is designed to show which gates were queried and their responses
2. **Transparency**: Users can see that Croatia was searched, even if no results were found
3. **Error Handling**: If Croatia returns an error, it's still shown in results with `errorCode` and `errorDescription`

### How to Avoid Croatia in Results

**Option 1: Use `eftiGateIndicator`** (Recommended)
```json
{
  "identifier": "SILJ5678CD",
  "identifierType": ["EQUIPMENT"],
  "eftiGateIndicator": ["SI"]  // Only search Slovenia
}
```
- Croatia won't be queried at all
- Croatia won't appear in results

**Option 2: Filter Results Client-Side**
- Check `consignments` array length
- Only display results where `consignments.length > 0`
- Ignore entries with empty `consignments` arrays

**Option 3: Check for Errors**
- If `errorCode` is present (e.g., `"ID_NOT_FOUND"`), treat as "no results"
- Filter out entries with error codes

### Example Response Structure

When searching without `eftiGateIndicator`:

```json
{
  "requestId": "abc-123-def",
  "status": "COMPLETE",
  "identifiers": [
    {
      "gateIndicator": "SI",  // Slovenia - found results
      "consignments": [
        {
          "gateId": "SI",
          "platformId": "CDA",
          "datasetId": "uuid-123"
        }
      ],
      "status": "SUCCESS"
    },
    {
      "gateIndicator": "HR",  // Croatia - NO results, but still appears
      "consignments": [],      // Empty array
      "status": "SUCCESS"
    }
  ]
}
```

**Note**: Croatia appears with empty `consignments`, which might be confusing. This is expected behavior when querying multiple gates.

---

## 7. Database Query Examples

### Example 1: Search Equipment in Slovenia Only

**Request**:
```json
{
  "identifier": "SILJ5678CD",
  "identifierType": ["EQUIPMENT"],
  "registrationCountryCode": "SI",
  "eftiGateIndicator": ["SI"]
}
```

**Generated SQL** (conceptual):
```sql
SELECT c.* 
FROM consignment c
LEFT JOIN main_carriage_transport_movement mctm ON c.id = mctm.consignment_id
LEFT JOIN used_transport_equipment ute ON c.id = ute.consignment_id
WHERE UPPER(ute.equipment_id) = 'SILJ5678CD'
  AND ute.registration_country = 'SI'
  AND c.gate_id = 'SI'  -- Only Slovenia gate
```

### Example 2: Search All Gates Without Country Filter

**Request**:
```json
{
  "identifier": "SILJ5678CD",
  "identifierType": ["EQUIPMENT"]
}
```

**Generated SQL** (conceptual):
```sql
-- Searches ALL gates (Croatia, Slovenia, etc.)
SELECT c.* 
FROM consignment c
LEFT JOIN used_transport_equipment ute ON c.id = ute.consignment_id
WHERE UPPER(ute.equipment_id) = 'SILJ5678CD'
-- No country filter, so returns results from all countries
```

---

## 8. Troubleshooting Checklist

When identifier search doesn't work as expected:

- [ ] **Check identifier format**: No dashes, spaces, or special characters
- [ ] **Check identifier length**: Maximum 17 characters
- [ ] **Verify `eftiGateIndicator`**: Specify `["SI"]` to search only Slovenia ROI
- [ ] **Verify `registrationCountryCode`**: Set to `"SI"` to filter by Slovenia
- [ ] **Check database storage**: Verify `equipment_id` is stored correctly (without dashes)
- [ ] **Check `registration_country`**: Verify it's set to `"SI"` in the database
- [ ] **Check case sensitivity**: Search is case-insensitive, but verify exact match
- [ ] **Check identifier type**: Ensure `identifierType: ["EQUIPMENT"]` is set correctly

---

## 9. Key Files Reference

| File | Purpose |
|------|---------|
| `implementation/commons/src/main/java/eu/efti/commons/dto/SearchWithIdentifiersRequestDto.java` | Request DTO with validation rules |
| `implementation/registry-of-identifiers/src/main/java/eu/efti/identifiersregistry/repository/IdentifiersRepository.java` | Query logic for identifier searches |
| `implementation/gate/src/main/java/eu/efti/eftigate/service/ControlService.java` | Request routing and gate selection |
| `implementation/gate/src/main/java/eu/efti/eftigate/service/gate/EftiGateIdResolver.java` | Gate/ROI resolution logic |
| `implementation/gate/src/main/java/eu/efti/eftigate/service/EftiAsyncCallsProcessor.java` | Local ROI search execution |
| `implementation/registry-of-identifiers/src/main/java/eu/efti/identifiersregistry/entity/UsedTransportEquipment.java` | Equipment entity mapping |

---

## Summary

**Your specific case with `SI-LJ-5678CD`:**

1. **Format Issue**: Dashes are not allowed. Use `SILJ5678CD` instead.

2. **Croatia Results Issue**: This happens because:
   - Without `eftiGateIndicator`, system searches ALL gates
   - Without `registrationCountryCode`, no country filter is applied
   - Solution: Add both `eftiGateIndicator: ["SI"]` and `registrationCountryCode: "SI"`

3. **Query Logic**: The search uses case-insensitive matching on `equipment_id` field in `used_transport_equipment` table, with optional filters for country, mode code, and dangerous goods indicator.

