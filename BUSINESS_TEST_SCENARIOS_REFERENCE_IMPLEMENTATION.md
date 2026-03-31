# Business Test Scenarios for eFTI Reference Implementation

## Overview

This document lists **business test scenarios** that can be performed with the current eFTI reference implementation. These are **manual/functional tests** that validate business workflows and use cases.

**Note**: These tests are based on what the current reference implementation **actually supports**, not what might be planned or desired.

---

## Test Environment Setup

### Prerequisites

1. **3 Gates** running (Borduria, Syldavia, Listenbourg)
2. **3 Platforms** running (ACME, Massive Dynamic, Umbrella Corporation)
3. **Keycloak** with realms configured
4. **Portal Application** running
5. **Test Datasets** uploaded to platforms

### Test Users

| User | Realm | Password | Role |
|------|-------|----------|------|
| `user_bo` | eFTI_BO | `Azerty59*123` | ROAD_CONTROLER |
| `user_sy` | eFTI_SY | `Azerty59*123` | ROAD_CONTROLER |
| `user_li` | eFTI_LI | `Azerty59*123` | ROAD_CONTROLER |

### Test Datasets

Ensure you have test datasets on platforms:
- Borduria platform (ACME): `12345678-ab12-4ab6-8999-123456789abc.xml`
- Syldavia platform (Massive Dynamic): `87654321-ba21-6ba4-9888-987654321cba.xml`
- Listenbourg platform (Umbrella Corporation): Additional test datasets

---

## Category 1: UIL Query Tests

### Test 1.1: Local UIL Query (Same Gate)

**Business Case**: Inspector needs to query a dataset stored on a local platform

**Objective**: Verify that a road controller can retrieve a full dataset using UIL when data is stored locally

**Setup**:
- Gate: Borduria
- Platform: ACME (local platform)
- User: `user_bo` from Borduria

**Steps**:
1. Login to portal as `user_bo`
2. Navigate to UIL Search page
3. Enter UIL information:
   - Gate ID: `borduria`
   - Platform ID: `acme`
   - Dataset ID: `12345678-ab12-4ab6-8999-123456789abc`
4. Select subset ID: `full` (or specific subset like `AT02`, `EU02`)
5. Submit query
6. Wait for status to change from `PENDING` → `IN_PROGRESS` → `COMPLETE`
7. View the returned dataset

**Expected Results**:
- ✅ Request is accepted immediately with `requestId`
- ✅ Status progresses through: PENDING → IN_PROGRESS → COMPLETE
- ✅ Full XML dataset is returned (or filtered by subset if specified)
- ✅ Data matches what's stored on platform
- ✅ Response time is fast (no cross-gate communication)

**Validation**:
- Dataset ID matches requested ID
- Platform ID matches
- Gate ID matches
- Data content is correct
- If subset ID specified, only relevant fields are present

---

### Test 1.2: Cross-Border UIL Query (Different Gate)

**Business Case**: Inspector in one country needs data stored in another country's platform

**Objective**: Verify cross-border data access via eDelivery

**Setup**:
- Requesting Gate: Borduria
- Target Gate: Syldavia
- Platform: Massive Dynamic (Syldavia's platform)
- User: `user_bo` from Borduria

**Steps**:
1. Login to portal as `user_bo` (Borduria)
2. Navigate to UIL Search page
3. Enter UIL information for **Syldavia**:
   - Gate ID: `syldavia`
   - Platform ID: `massivedynamic`
   - Dataset ID: `87654321-ba21-6ba4-9888-987654321cba`
4. Select subset ID: `full`
5. Submit query
6. Wait for status updates (this will take longer due to eDelivery)
7. View the returned dataset

**Expected Results**:
- ✅ Request is accepted immediately with `requestId`
- ✅ Status progresses: PENDING → IN_PROGRESS → COMPLETE
- ✅ Borduria gate sends eDelivery message to Syldavia gate
- ✅ Syldavia gate queries its platform
- ✅ Syldavia gate responds via eDelivery
- ✅ Full dataset is returned to Borduria
- ✅ Response time is longer than local query (due to eDelivery overhead)

**Validation**:
- Dataset ID matches requested ID
- Data comes from Syldavia platform
- Cross-gate communication works via eDelivery
- Data integrity maintained across borders

---

### Test 1.3: UIL Query with Subset Filtering

**Business Case**: Inspector needs only specific fields based on country regulation profile

**Objective**: Verify that subset filtering works correctly

**Setup**:
- Gate: Borduria
- Platform: ACME
- User: `user_bo`
- Subset ID: `AT02` (Austrian subset) or `EU02` (EU subset)

**Steps**:
1. Login as `user_bo`
2. Navigate to UIL Search
3. Enter UIL information
4. Select subset ID: `AT02` (instead of `full`)
5. Submit query
6. Wait for response
7. Compare returned data with full dataset

**Expected Results**:
- ✅ Response contains only fields annotated with `subset id="AT02"` in XSD
- ✅ Fields not in AT02 subset are filtered out
- ✅ XML is valid but contains fewer fields than full dataset
- ✅ Filtering happens at platform level

**Validation**:
- Check which fields are present
- Verify fields match XSD subset annotations
- Compare with full dataset to see what was filtered

**Available Subset IDs to Test**:
- `AT02`, `AT05`, `AT06`, `AT07`, `AT08` (Austria)
- `HR01`, `HR05a`, `HR05B`, `HR05c` (Croatia)
- `SI02`, `SI05`, `SI06` (Slovenia)
- `EU02`, `EU05a`, `EU05b`, `EU05c` (European Union)
- `identifier` (identifier subset only)
- `full` (complete dataset)

---

### Test 1.4: UIL Query with Multiple Subsets

**Business Case**: Inspector needs data that matches multiple subset requirements

**Objective**: Verify union filtering works (OR logic)

**Setup**:
- Gate: Borduria
- Platform: ACME
- Subset IDs: `["EU02", "identifier"]` or `["HR01", "identifier"]`

**Steps**:
1. Submit UIL query with multiple subset IDs
2. Wait for response
3. Analyze returned data

**Expected Results**:
- ✅ Response contains fields that belong to **ANY** of the requested subsets (union)
- ✅ Fields tagged with `EU02` OR `identifier` are included
- ✅ Fields tagged with neither are excluded

**Validation**:
- Verify union logic works correctly
- Check that all requested subset fields are present

---

### Test 1.5: UIL Query - Dataset Not Found

**Business Case**: Inspector queries for a dataset that doesn't exist

**Objective**: Verify error handling for missing data

**Steps**:
1. Submit UIL query with non-existent `datasetId`
2. Wait for response

**Expected Results**:
- ✅ Request is accepted (returns `requestId`)
- ✅ Status eventually becomes `ERROR`
- ✅ Error message indicates dataset not found
- ✅ Appropriate error code is returned

**Validation**:
- Error status is set correctly
- Error message is clear and actionable
- Error is logged for audit

---

### Test 1.6: UIL Query - Invalid Gate/Platform

**Business Case**: Inspector provides incorrect gate or platform ID

**Objective**: Verify validation of UIL components

**Steps**:
1. Submit UIL query with invalid `gateId` or `platformId`
2. Check response

**Expected Results**:
- ✅ Request validation fails
- ✅ Error returned immediately (before async processing)
- ✅ Clear error message indicating invalid parameter

---

## Category 2: Identifier Search Tests

### Test 2.1: Identifier Search - Local Only

**Business Case**: Inspector searches for vehicle/equipment ID in own country

**Objective**: Verify identifier search works for local ROI

**Setup**:
- Gate: Borduria
- User: `user_bo`
- Identifier: Pre-uploaded vehicle ID (e.g., "ABC123")

**Pre-requisite**: Upload identifier data to ROI first (via platform `saveIdentifiers` API)

**Steps**:
1. Login as `user_bo`
2. Navigate to Identifier Search page
3. Enter search criteria:
   - Identifier: `ABC123`
   - Identifier Type: `MEANS` (or `EQUIPMENT`, `CARRIED`)
   - Transport Mode: `3` (Road)
   - Registration Country: `HR` (optional)
   - Dangerous Goods: `false` (optional)
4. Submit search
5. Wait for results
6. Review returned list of UILs

**Expected Results**:
- ✅ Request accepted with `requestId`
- ✅ Status progresses to `COMPLETE`
- ✅ Returns list of `Consignment` objects matching identifier
- ✅ Each result contains:
   - **UIL components**: `gateId`, `platformId`, `datasetId`
   - **ROI data**: Acceptance date, delivery date, transport means info, equipment info
- ✅ Results from local gate only (no cross-gate search)

**Validation**:
- All results match search criteria
- UIL information is complete and correct
- ROI data is present for each result

---

### Test 2.2: Identifier Search - Multi-Gate (Broadcast)

**Business Case**: Inspector searches for identifier across multiple countries

**Objective**: Verify cross-gate identifier search via broadcast

**Setup**:
- Requesting Gate: Borduria
- Target Gates: Syldavia, Listenbourg
- Identifier: Same identifier exists in multiple gates

**Pre-requisite**: Same identifier must be uploaded to ROI in multiple gates

**Steps**:
1. Login as `user_bo` (Borduria)
2. Enter identifier search criteria
3. Submit search
4. Wait for results (takes longer due to cross-gate queries)
5. Review consolidated results

**Expected Results**:
- ✅ Request accepted with `requestId`
- ✅ Borduria searches local ROI first
- ✅ Borduria broadcasts `IdentifierQuery` to Syldavia and Listenbourg via eDelivery
- ✅ Each gate searches its own ROI
- ✅ Each gate responds with matching results
- ✅ Borduria consolidates all results
- ✅ Status becomes `COMPLETE`
- ✅ Returns list of UILs from **all gates** where identifier was found

**Validation**:
- Results from multiple gates are present
- Each result has correct gate indicator
- Consolidated list is complete
- No duplicate results

---

### Test 2.3: Identifier Search - Multiple Results (Same Gate)

**Business Case**: Same identifier used in multiple consignments

**Objective**: Verify multiple results for same identifier

**Setup**:
- Upload same identifier (e.g., vehicle "ABC123") to ROI multiple times with different dataset IDs

**Steps**:
1. Perform identifier search for "ABC123"
2. Review results

**Expected Results**:
- ✅ Returns multiple `Consignment` objects
- ✅ Each result has different `datasetId`
- ✅ All results show same identifier but different consignments
- ✅ ROI data (dates, equipment) may differ between results

**Validation**:
- Multiple results are returned
- Each result is unique (different dataset ID)
- All match search criteria

---

### Test 2.4: Identifier Search - With Filters

**Business Case**: Inspector wants to narrow down results using additional criteria

**Objective**: Verify filtering by mode, country, dangerous goods

**Setup**:
- Multiple identifiers exist in ROI with different attributes

**Test Scenarios**:

**Scenario A: Filter by Mode Code**
- Search: Identifier "ABC123" + Mode Code `3` (Road)
- Expected: Only road transport results

**Scenario B: Filter by Registration Country**
- Search: Identifier "ABC123" + Registration Country `HR`
- Expected: Only vehicles registered in Croatia

**Scenario C: Filter by Dangerous Goods**
- Search: Identifier "ABC123" + Dangerous Goods `true`
- Expected: Only consignments with dangerous goods

**Scenario D: Combined Filters**
- Search: Identifier "ABC123" + Mode `3` + Country `HR` + Dangerous Goods `false`
- Expected: Results matching ALL criteria

**Steps**:
1. Perform identifier search with single filter
2. Verify results match filter
3. Perform search with combined filters
4. Verify results match all filters

**Expected Results**:
- ✅ Filters work correctly individually
- ✅ Combined filters use AND logic (all must match)
- ✅ Results are appropriately filtered

---

### Test 2.5: Identifier Search - Case Insensitive

**Business Case**: Inspector searches with different case than stored

**Objective**: Verify case-insensitive matching

**Setup**:
- Identifier stored in ROI as: "ABC123"

**Test Cases**:
- Search: "abc123" (lowercase)
- Search: "ABC123" (uppercase)
- Search: "AbC123" (mixed case)

**Steps**:
1. Search with lowercase
2. Search with uppercase
3. Search with mixed case
4. Compare results

**Expected Results**:
- ✅ All case variations return same results
- ✅ Matching is case-insensitive
- ✅ Results are consistent

---

### Test 2.6: Identifier Search - No Results Found

**Business Case**: Inspector searches for identifier that doesn't exist

**Objective**: Verify handling of no-match scenario

**Steps**:
1. Search for identifier that doesn't exist in any ROI
2. Wait for response

**Expected Results**:
- ✅ Request accepted
- ✅ Status becomes `COMPLETE`
- ✅ Returns empty list (`identifiers: []`)
- ✅ No errors (empty result is valid)

---

## Category 3: Two-Step Workflow Tests (Identifier Search → UIL Query)

### Test 3.1: Complete Two-Step Workflow

**Business Case**: Inspector searches by identifier, reviews results with ROI info, then selects one to get full dataset

**Objective**: Verify end-to-end workflow from identifier search to full dataset retrieval

**Setup**:
- Identifier: "ABC123" exists in ROI
- Multiple consignments use this identifier

**Steps**:

**Step 1: Identifier Search**
1. Login as `user_bo`
2. Navigate to Identifier Search page
3. Search for identifier "ABC123"
4. Wait for results
5. Review list of results showing:
   - Gate ID, Platform ID, Dataset ID (UIL components)
   - Acceptance date, Delivery date
   - Transport means information
   - Equipment information

**Step 2: Review ROI Information**
6. Click "Display" or "Open" on one result
7. Portal navigates to identifiers display page
8. Review complete ROI information:
   - All dates
   - All transport movements
   - All equipment details
   - UIL components (gate, platform, dataset)

**Step 3: UIL Query**
9. Click "Go to UIL" button
10. Portal navigates to UIL search page
11. Form is **pre-filled** with:
    - Dataset ID: From identifier result
    - Gate ID: From identifier result
    - Platform ID: From identifier result
12. Verify pre-filled values are correct
13. Optionally change subset ID (default: `full`)
14. Submit UIL query
15. Wait for response
16. View **full dataset** (not just identifier subset)

**Expected Results**:
- ✅ Step 1: Identifier search returns multiple results with ROI info
- ✅ Step 2: ROI info page displays complete identifier subset data
- ✅ Step 3: UIL query form is pre-filled correctly
- ✅ Step 3: Full dataset is returned (contains more data than identifier subset)
- ✅ Full dataset includes all fields (not just identifiers)

**Validation**:
- UIL components extracted correctly from identifier result
- Pre-filled form has correct values
- Full dataset contains identifier data PLUS additional fields
- Complete workflow functions end-to-end

---

### Test 3.2: Two-Step Workflow - Cross-Border

**Business Case**: Inspector searches identifier, finds result in foreign gate, queries full dataset from foreign gate

**Setup**:
- Identifier exists in Syldavia's ROI
- Inspector is in Borduria

**Steps**:
1. In Borduria, search for identifier
2. Find result from Syldavia (foreign gate)
3. Click "Display" - verify ROI info from Syldavia
4. Click "Go to UIL" - UIL query will be for Syldavia dataset
5. Submit UIL query
6. Verify cross-border UIL query works

**Expected Results**:
- ✅ Identifier search finds result in foreign gate
- ✅ ROI info is displayed correctly
- ✅ UIL query is performed cross-border
- ✅ Full dataset is retrieved from foreign gate via eDelivery

---

## Category 4: Platform Data Upload Tests

### Test 4.1: Platform Saves Identifiers to ROI

**Business Case**: Platform uploads identifier data to gate's ROI

**Objective**: Verify platform can register identifiers in gate's ROI

**Setup**:
- Platform: ACME (connected to Borduria gate)
- Platform has dataset with identifiers

**Steps**:
1. Platform calls `PUT /api/platform/v0/consignments/{datasetId}`
2. Platform sends identifier subset data:
   - Dataset ID
   - Gate ID, Platform ID
   - Transport means ID
   - Equipment IDs
   - Dates (acceptance, delivery)
   - Transport mode
   - Dangerous goods indicator
3. Gate receives and saves to ROI database
4. Verify data is stored correctly

**Expected Results**:
- ✅ Platform request is accepted
- ✅ Gate saves data to ROI database
- ✅ Identifier data is accessible for identifier search
- ✅ Audit log is created

**Validation**:
- Query ROI database directly to verify data
- Perform identifier search with uploaded identifier
- Verify search finds the uploaded data

---

### Test 4.2: Platform Updates Existing Identifier Data

**Business Case**: Platform updates identifier information for existing dataset

**Setup**:
- Identifier already exists in ROI

**Steps**:
1. Platform uploads same dataset ID again with updated data
2. Verify data is updated (not duplicated)

**Expected Results**:
- ✅ Existing identifier is updated (not duplicated)
- ✅ UIL remains the same
- ✅ Updated data is reflected in identifier search

---

## Category 5: Cross-Gate Communication Tests

### Test 5.1: Gate A Queries Gate B's Data

**Business Case**: Borduria queries data stored in Syldavia

**Objective**: Verify gate-to-gate communication via eDelivery

**Setup**:
- Requesting: Borduria
- Target: Syldavia

**Steps**:
1. From Borduria portal, submit UIL query for Syldavia dataset
2. Monitor message flow:
   - Borduria → eDelivery → Syldavia
   - Syldavia → Platform → Syldavia
   - Syldavia → eDelivery → Borduria
3. Verify end-to-end communication

**Expected Results**:
- ✅ eDelivery messages are sent and received
- ✅ Message IDs are tracked
- ✅ Communication is secure (AS4 protocol)
- ✅ Response returns correctly

**Validation**:
- Check Domibus logs for message exchange
- Verify message IDs match
- Check delivery status

---

### Test 5.2: Gate Receives UIL Query from Foreign Gate

**Business Case**: Syldavia receives query from Borduria and responds

**Objective**: Verify gate can receive and process external queries

**Setup**:
- Querying: Borduria
- Receiving: Syldavia

**Steps**:
1. From Borduria, send UIL query for Syldavia dataset
2. Monitor Syldavia gate logs
3. Verify Syldavia:
   - Receives query via eDelivery
   - Processes query
   - Queries local platform
   - Sends response back via eDelivery

**Expected Results**:
- ✅ Syldavia receives query correctly
- ✅ Query is routed to local platform
- ✅ Response is sent back to requesting gate
- ✅ Message correlation works (response matches request)

---

### Test 5.3: Gate Receives Identifier Query from Foreign Gate

**Business Case**: Syldavia receives identifier search query from Borduria

**Setup**:
- Querying: Borduria
- Receiving: Syldavia

**Steps**:
1. From Borduria, submit identifier search
2. Verify Borduria broadcasts to Syldavia
3. Verify Syldavia:
   - Receives `IdentifierQuery` via eDelivery
   - Searches local ROI
   - Sends `IdentifierResponse` back
4. Verify consolidated results

**Expected Results**:
- ✅ Identifier query is broadcast correctly
- ✅ Foreign gate searches its ROI
- ✅ Results are consolidated correctly

---

## Category 6: Subset Filtering Tests

### Test 6.1: Compare Different Subsets from Same Dataset

**Business Case**: Same dataset filtered by different country regulations returns different fields

**Objective**: Verify subset filtering produces different results

**Setup**:
- Same dataset ID
- Test with multiple subset IDs

**Steps**:
1. Query dataset with subset `full`
2. Save result
3. Query same dataset with subset `AT02`
4. Query same dataset with subset `EU02`
5. Query same dataset with subset `identifier`
6. Compare all results

**Expected Results**:
- ✅ `full` - Contains all fields
- ✅ `AT02` - Contains only AT02-annotated fields (fewer fields)
- ✅ `EU02` - Contains only EU02-annotated fields (different fields)
- ✅ `identifier` - Contains only identifier subset fields (minimal)
- ✅ Each subset returns valid XML
- ✅ Field differences are clear

**Validation**:
- Count fields in each result
- Verify fields match XSD annotations
- Document which fields are present in each subset

---

### Test 6.2: Subset Filtering - Cross-Border

**Business Case**: Inspector in one country requests subset from another country's dataset

**Setup**:
- Requesting: Borduria
- Target: Syldavia
- Subset: `AT02` (Austrian subset)

**Steps**:
1. Submit cross-border UIL query with subset `AT02`
2. Verify filtering happens at target gate/platform
3. Verify only subset fields are returned

**Expected Results**:
- ✅ Cross-border query works with subset
- ✅ Filtering happens at target platform
- ✅ Only subset fields are transmitted back

---

## Category 7: Error Handling and Edge Cases

### Test 7.1: Request Timeout

**Business Case**: Platform doesn't respond within timeout period

**Setup**:
- Use dataset ID ending with "1" (triggers timeout in simulator)

**Steps**:
1. Submit UIL query
2. Wait for timeout

**Expected Results**:
- ✅ Request is accepted
- ✅ Status eventually becomes `TIMEOUT`
- ✅ Appropriate error message
- ✅ Request is retried (if configured)

---

### Test 7.2: Platform Unavailable

**Business Case**: Target platform is down

**Setup**:
- Stop target platform service

**Steps**:
1. Submit UIL query for unavailable platform
2. Monitor error handling

**Expected Results**:
- ✅ Request is accepted
- ✅ Status becomes `ERROR` after retry attempts
- ✅ Error message indicates platform unavailable
- ✅ Error is logged

---

### Test 7.3: Invalid XML Response

**Business Case**: Platform returns malformed XML

**Setup**:
- Configure platform to return invalid XML (if possible)

**Steps**:
1. Submit UIL query
2. Receive invalid response
3. Verify error handling

**Expected Results**:
- ✅ Invalid XML is detected
- ✅ Status becomes `ERROR`
- ✅ Error message indicates XML validation failure
- ✅ Request is not stored as successful

---

### Test 7.4: Concurrent Requests

**Business Case**: Multiple users submit requests simultaneously

**Steps**:
1. Submit 5-10 UIL queries simultaneously
2. Monitor processing
3. Verify all are handled

**Expected Results**:
- ✅ All requests are accepted
- ✅ Each gets unique `requestId`
- ✅ All are processed (may be queued)
- ✅ Results are returned correctly

---

## Category 8: Portal UI Tests

### Test 8.1: Login and Authentication

**Business Case**: User logs into portal application

**Steps**:
1. Navigate to portal URL
2. Enter credentials
3. Complete Keycloak login flow
4. Verify access to portal

**Expected Results**:
- ✅ Login redirects to Keycloak
- ✅ Keycloak validates credentials
- ✅ JWT token is received
- ✅ Portal loads after authentication
- ✅ User role is displayed (if UI shows it)

---

### Test 8.2: Portal - UIL Search Form

**Business Case**: User fills out UIL search form

**Steps**:
1. Navigate to UIL Search page
2. Fill form fields:
   - Dataset ID (UUID format)
   - Gate ID (dropdown)
   - Platform ID (dropdown)
3. Submit form
4. Verify form validation

**Expected Results**:
- ✅ Form validates UUID format for dataset ID
- ✅ Dropdowns show available gates/platforms
- ✅ Invalid input shows error messages
- ✅ Submit button is disabled until form valid
- ✅ After submit, form shows loading state

---

### Test 8.3: Portal - Identifier Search Form

**Business Case**: User fills out identifier search form

**Steps**:
1. Navigate to Identifier Search page
2. Fill form:
   - Identifier (text)
   - Identifier Type (multi-select)
   - Mode Code (dropdown)
   - Registration Country (dropdown)
   - Dangerous Goods (radio)
3. Submit form

**Expected Results**:
- ✅ Form validates identifier format
- ✅ Multi-select works correctly
- ✅ All optional fields are truly optional
- ✅ Form submits with correct data format

---

### Test 8.4: Portal - Result Display

**Business Case**: User views query results

**Steps**:
1. Submit query (UIL or Identifier)
2. Wait for status to become COMPLETE
3. View results in portal

**Expected Results**:
- ✅ Status updates are shown
- ✅ Results are displayed in readable format
- ✅ XML data is transformed to HTML (if using XSLT)
- ✅ Results are scrollable/paginated if large
- ✅ Download/view options are available

---

### Test 8.5: Portal - Auto-Polling

**Business Case**: Portal automatically checks request status

**Steps**:
1. Enable auto-polling (if configurable)
2. Submit query
3. Observe status updates

**Expected Results**:
- ✅ Portal polls status every X seconds
- ✅ Status updates automatically in UI
- ✅ No manual refresh needed
- ✅ Polling stops when status is COMPLETE or ERROR

---

### Test 8.6: Portal - Navigation Between Pages

**Business Case**: User navigates from identifier search to UIL search

**Steps**:
1. Perform identifier search
2. Click "Display" on result
3. Review ROI information page
4. Click "Go to UIL" button
5. Verify UIL form is pre-filled

**Expected Results**:
- ✅ Navigation works smoothly
- ✅ Data is passed correctly between pages
- ✅ Form pre-filling works
- ✅ Browser back/forward buttons work

---

## Category 9: Authentication and Authorization Tests

### Test 9.1: Valid User Login

**Business Case**: Authorized user logs in

**Steps**:
1. Login with valid credentials (`user_bo` / `Azerty59*123`)
2. Verify access

**Expected Results**:
- ✅ Login succeeds
- ✅ JWT token is valid
- ✅ User can access portal features
- ✅ User role is recognized

---

### Test 9.2: Invalid Credentials

**Business Case**: User enters wrong password

**Steps**:
1. Attempt login with wrong password
2. Verify error handling

**Expected Results**:
- ✅ Login fails
- ✅ Clear error message
- ✅ User is not authenticated
- ✅ Portal is not accessible

---

### Test 9.3: Token Expiration

**Business Case**: User session expires

**Steps**:
1. Login successfully
2. Wait for token expiration (or manually expire token)
3. Attempt to use portal

**Expected Results**:
- ✅ After expiration, requests fail with 401 Unauthorized
- ✅ User is redirected to login
- ✅ User can re-authenticate

---

### Test 9.4: Role-Based Access (If Implemented)

**Business Case**: Different roles have different access

**Note**: Current implementation has minimal role-based access. Only basic roles exist.

**Steps**:
1. Login as different users with different roles
2. Verify access to features

**Expected Results**:
- ✅ `ROAD_CONTROLER` can access UIL and Identifier queries
- ✅ Roles are extracted from JWT token
- ✅ Unauthorized requests are rejected

**Limitation**: Current implementation doesn't have role-based subset filtering or UI differences.

---

## Category 10: Data Integrity Tests

### Test 10.1: Data Consistency - UIL Query

**Business Case**: Verify data returned matches what's stored on platform

**Steps**:
1. Query dataset via UIL
2. Compare returned data with platform file
3. Verify integrity

**Expected Results**:
- ✅ Returned data matches source file
- ✅ No data corruption
- ✅ XML is well-formed and valid
- ✅ All requested fields are present (if in subset)

---

### Test 10.2: Data Consistency - Identifier Search

**Business Case**: Verify identifier search returns correct UIL information

**Steps**:
1. Perform identifier search
2. Extract UIL from result
3. Perform UIL query with extracted UIL
4. Verify dataset matches identifier result

**Expected Results**:
- ✅ UIL extracted from identifier search is correct
- ✅ UIL query with extracted UIL returns correct dataset
- ✅ Data consistency is maintained

---

### Test 10.3: Subset Filtering Consistency

**Business Case**: Verify same dataset with different subsets is consistent

**Steps**:
1. Query dataset with `full` subset
2. Query same dataset with specific subset
3. Verify subset fields are subset of full fields

**Expected Results**:
- ✅ Subset fields are all present in full dataset
- ✅ No new fields appear in subset that aren't in full
- ✅ Field values match between full and subset

---

## Category 11: Performance and Scalability Tests

### Test 11.1: Response Time - Local Query

**Business Case**: Measure performance of local queries

**Steps**:
1. Submit multiple local UIL queries
2. Measure response times
3. Calculate average

**Expected Results**:
- ✅ Response time is reasonable (< 5 seconds for local)
- ✅ Response time is consistent
- ✅ No significant degradation with multiple requests

**Metrics to Record**:
- Time from request submission to COMPLETE status
- Number of requests processed per minute

---

### Test 11.2: Response Time - Cross-Border Query

**Business Case**: Measure performance of cross-border queries

**Steps**:
1. Submit multiple cross-border UIL queries
2. Measure response times
3. Compare with local queries

**Expected Results**:
- ✅ Cross-border is slower than local (due to eDelivery)
- ✅ Response time is acceptable (< 30 seconds typical)
- ✅ eDelivery overhead is reasonable

**Metrics to Record**:
- Time from request to response
- eDelivery message latency

---

### Test 11.3: Concurrent Users

**Business Case**: Multiple users query simultaneously

**Steps**:
1. Have 3-5 users login
2. Each submits queries simultaneously
3. Monitor system behavior

**Expected Results**:
- ✅ All requests are accepted
- ✅ System handles concurrent load
- ✅ No request loss
- ✅ Response times remain acceptable

---

## Category 12: Audit and Logging Tests

### Test 12.1: Request Audit Trail

**Business Case**: Verify all requests are logged

**Steps**:
1. Submit various requests (UIL, Identifier)
2. Check audit logs
3. Verify logging

**Expected Results**:
- ✅ All requests are logged with:
  - Request ID
  - User/Authority
  - Timestamp
  - Request type
  - Parameters
- ✅ Logs are accessible for review

---

### Test 12.2: Cross-Gate Communication Logging

**Business Case**: Verify eDelivery messages are logged

**Steps**:
1. Perform cross-border query
2. Check Domibus logs
3. Check gate logs

**Expected Results**:
- ✅ eDelivery messages are logged
- ✅ Message IDs are tracked
- ✅ Request/response correlation is logged
- ✅ Communication errors are logged

---

## Category 13: Business Use Case Scenarios

### Test 13.1: Road Inspector Workflow

**Business Case**: Road inspector needs to check transport consignment

**Scenario**:
- Inspector sees vehicle on road
- Inspector knows vehicle registration number
- Inspector wants to check transport documents

**Steps**:
1. Inspector logs into portal
2. Searches by vehicle registration (identifier search)
3. Gets list of consignments using that vehicle
4. Reviews ROI information (dates, route, equipment)
5. Selects one consignment
6. Retrieves full dataset via UIL query
7. Reviews complete transport document

**Expected Results**:
- ✅ Complete workflow functions end-to-end
- ✅ Inspector can identify correct consignment
- ✅ Full document is accessible
- ✅ Data is sufficient for inspection purposes

**Note**: Actual business rules (cabotage, weight checks, etc.) are **NOT validated** - only data retrieval works.

---

### Test 13.2: Cross-Border Transport Inspection

**Business Case**: Inspector in Country A needs data from Country B

**Scenario**:
- Vehicle from Country B is inspected in Country A
- Data is stored in Country B's platform
- Inspector needs access to data

**Steps**:
1. Inspector in Borduria searches identifier from Syldavia vehicle
2. Identifier search broadcasts to Syldavia
3. Finds consignment in Syldavia's ROI
4. Inspector retrieves full dataset from Syldavia platform
5. Reviews complete transport document

**Expected Results**:
- ✅ Cross-border search works
- ✅ Data access is granted
- ✅ Complete document is retrieved
- ✅ Communication is secure

---

### Test 13.3: Multiple Consignments for Same Vehicle

**Business Case**: Same vehicle used in multiple transport operations

**Scenario**:
- Vehicle "ABC123" appears in 3 different consignments
- Inspector searches and gets all 3 results
- Inspector needs to identify which one is current

**Steps**:
1. Search identifier "ABC123"
2. Get multiple results
3. Review ROI information for each (dates, routes)
4. Identify current consignment based on dates
5. Retrieve full dataset for current consignment

**Expected Results**:
- ✅ Multiple results are returned
- ✅ ROI information helps identify correct consignment
- ✅ Inspector can select appropriate dataset

---

## Category 14: Integration Scenarios

### Test 14.1: Complete End-to-End Flow

**Business Case**: Full workflow from platform upload to inspector query

**Steps**:
1. **Platform uploads identifiers** to ROI
2. **Inspector searches by identifier**
3. **Inspector selects result** and reviews ROI info
4. **Inspector queries full dataset** via UIL
5. **Inspector reviews complete document**

**Expected Results**:
- ✅ All steps work together
- ✅ Data flows correctly through system
- ✅ No data loss or corruption
- ✅ Complete workflow is functional

---

### Test 14.2: Multi-Gate Integration

**Business Case**: All three gates participate in identifier broadcast

**Setup**:
- All three gates running
- Same identifier exists in all three ROI databases

**Steps**:
1. From Borduria, search identifier
2. Verify broadcast to Syldavia and Listenbourg
3. Verify responses from all gates
4. Verify consolidated results

**Expected Results**:
- ✅ All gates receive broadcast
- ✅ All gates respond
- ✅ Results are consolidated correctly
- ✅ Status shows results from each gate

---

## Test Execution Checklist

### Pre-Test Setup

- [ ] All services are running (gates, platforms, Keycloak, Domibus)
- [ ] Test datasets are uploaded to platforms
- [ ] Test identifiers are uploaded to ROI databases
- [ ] Keycloak users are configured
- [ ] Portal application is accessible
- [ ] Postman collection is ready (for API testing)

### Test Execution

- [ ] Execute tests in each category
- [ ] Document results (Pass/Fail/Observations)
- [ ] Record response times
- [ ] Capture screenshots/logs for failures
- [ ] Note any limitations or issues

### Post-Test Analysis

- [ ] Review all test results
- [ ] Identify patterns in failures
- [ ] Document system limitations
- [ ] Note missing functionality
- [ ] Provide recommendations

---

## Known Limitations (Not Testable)

These business scenarios **cannot be tested** with current implementation:

❌ **Cabotage Checks** - No business logic for cabotage validation
❌ **ADR Compliance Verification** - No ADR-specific validation rules
❌ **Customs Clearance Workflows** - No customs-specific processing
❌ **Weight/Dimension Validation** - No validation against limits
❌ **Driver License Verification** - No driver data or validation
❌ **Route Planning Validation** - No route validation
❌ **Time-Based Queries** - Cannot search by date ranges
❌ **Bulk Operations** - Cannot query multiple datasets at once
❌ **Real-time Notifications** - No push notifications, only polling
❌ **Role-Based Data Filtering** - Current roles don't affect data filtering

---

## Summary

The current reference implementation supports **data retrieval workflows**:

✅ **What Works**:
- UIL queries (local and cross-border)
- Identifier searches (local and multi-gate)
- Subset filtering by country/regulation profile
- Two-step workflow (identifier → UIL)
- Platform data upload to ROI
- Cross-gate communication via eDelivery
- Portal UI for querying and viewing results

❌ **What Doesn't Work** (Business Logic):
- Domain-specific validations (cabotage, ADR, customs)
- Business rule enforcement
- Workflow automation
- Decision support

**Focus**: The reference implementation demonstrates the **technical infrastructure** for data access, not business logic for specific inspection scenarios.







