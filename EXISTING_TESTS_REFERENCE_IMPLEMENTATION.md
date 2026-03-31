# Existing Tests in eFTI Reference Implementation

## Overview

This document catalogs all existing tests in the current eFTI reference implementation. These are **automated unit and integration tests**, not business-case scenarios.

**Last Updated**: January 2025

---

## Test Categories

### 1. Backend Unit Tests (Java/JUnit)
### 2. Backend Integration Tests
### 3. Frontend Unit Tests (Angular/Jasmine)
### 4. Schema Validation Tests
### 5. Manual/Functional Tests (Postman)

---

## 1. Backend Unit Tests (Java/JUnit)

### 1.1 Gate Module (`implementation/gate`)

**Total Test Classes**: 34

#### Controller Tests (7 classes)

| Test Class | Purpose | Key Tests |
|------------|---------|-----------|
| `ControlControllerTest` | UIL query controller | POST/GET UIL endpoints |
| `IdentifiersControllerTest` | Identifier search controller | POST/GET identifier endpoints |
| `NoteControllerTest` | Follow-up notes controller | POST note endpoint |
| `ApIncomingControllerTest` | eDelivery incoming messages | Message reception |
| `AapControlControllerTest` | AAP UIL controller | AAP-specific UIL queries |
| `AapIdentifiersControllerTest` | AAP identifier controller | AAP-specific identifier searches |
| `AapNoteControllerTest` | AAP notes controller | AAP-specific notes |

#### Service Tests (20 classes)

| Test Class | Purpose | Test Count |
|------------|---------|------------|
| `ControlServiceTest` | Control entity management | Multiple |
| `UilRequestServiceTest` | UIL request processing | 27 tests |
| `IdentifiersRequestServiceTest` | Identifier request processing | 18 tests |
| `NotesRequestServiceTest` | Note request processing | 11 tests |
| `RequestServiceTest` | Generic request handling | 3 tests |
| `ValidationServiceTest` | Input validation | 4 tests |
| `RabbitSenderServiceTest` | RabbitMQ message sending | Multiple |
| `RabbitListenerServiceTest` | RabbitMQ message listening | Multiple |
| `DomibusIntegrationServiceTest` | eDelivery integration | Multiple |
| `ApIncomingServiceTest` | Incoming AP messages | Multiple |
| `EDeliveryMessageRouterTest` | Message routing logic | Multiple |
| `EftiAsyncCallsProcessorTest` | Async call processing | Multiple |
| `LogManagerTest` | Audit logging | Multiple |
| `EftiRequestUpdaterTest` | Request status updates | 2 tests |
| `IdentifiersControlUpdateDelegateServiceTest` | Identifier control updates | Multiple |
| `UilDtoValidatorTest` | UIL DTO validation | Multiple |
| `SearchWithIdentifiersRequestDtoValidatorTest` | Identifier search validation | Multiple |
| `EftiGateIdResolverTest` | Gate ID resolution | 2 tests |
| `GateToRequestTypeFunctionTest` | Request type mapping | 3 tests |
| `BaseServiceTest` | Base service functionality | Multiple |

#### Repository Tests (1 class)

| Test Class | Purpose |
|------------|---------|
| `ControlRepositoryTest` | Database operations for control entities |

#### Configuration Tests (1 class)

| Test Class | Purpose |
|------------|---------|
| `KeycloakResourceRolesConverterTest` | JWT role extraction from Keycloak tokens |

#### Batch Tests (1 class)

| Test Class | Purpose |
|------------|---------|
| `ControlBatchTest` | Batch processing of controls |

#### Utility Tests (2 classes)

| Test Class | Purpose |
|------------|---------|
| `MessageIdGeneratorTest` | Message ID generation |
| `EftiTestUtils` | Test utility functions |

#### Test Support (4 classes)

| Class | Purpose |
|-------|---------|
| `IntegrationTest` | Base class for integration tests |
| `RestIntegrationTest` | Base class for REST integration tests |
| `TestConfig` | Test configuration |
| `TestDataRandomSeedResettingTestExecutionListener` | Test data management |

---

### 1.2 Platform Gate Simulator (`implementation/platform-gate-simulator`)

**Total Test Classes**: 8

| Test Class | Purpose | Key Tests |
|------------|---------|-----------|
| `ControlControllerTest` | Platform control controller | UIL query handling |
| `IdentifiersControllerTest` | Platform identifier controller | Identifier upload/query |
| `IdentifierServiceTest` | Identifier service logic | Identifier processing |
| `ReaderServiceTest` | XML file reading | File reading, subset filtering |
| `ApIncomingServiceTest` | Incoming AP messages | eDelivery message handling |
| `SubsetUtilsTest` | Subset filtering | XML filtering by subset IDs |
| `MapperUtilsTest` | Data mapping utilities | DTO/Entity mapping |
| `AbstractTest` | Base test class | Test utilities |

**Notable Test**: `SubsetUtilsTest.parseBySubsetsWithSubsetTest()` - validates that subset filtering removes elements not in requested subset (e.g., `AT07` subset filters out `applicableServiceCharge`)

---

### 1.3 Registry of Identifiers (`implementation/registry-of-identifiers`)

**Total Test Classes**: 5

| Test Class | Purpose |
|------------|---------|
| `IdentifiersServiceTest` | Identifier service operations |
| `IdentifiersRepositoryTest` | Database repository operations |
| `IdentifiersQueryTest` | Identifier query logic |
| `IdentifiersMapperTest` | Data mapping |
| `AbstractServiceTest` | Base test utilities |

---

### 1.4 eDelivery AP Connector (`implementation/edelivery-ap-connector`)

**Total Test Classes**: 3

| Test Class | Purpose |
|------------|---------|
| `RequestUpdaterServiceTest` | Request status updates |
| `RequestSendingServiceTest` | Message sending via eDelivery |
| *(1 more class)* | Additional connector tests |

---

### 1.5 eFTI Logger (`implementation/efti-logger`)

**Total Test Classes**: 3

| Test Class | Purpose |
|------------|---------|
| `AuditRequestLogServiceTest` | Request audit logging |
| `AuditRegistryLogServiceTest` | Registry audit logging |
| `AbstractTestService` | Base test utilities |

**Support Class**: `TestAppender` - Custom log appender for testing

---

### 1.6 eFTI WS Plugin (`implementation/efti-ws-plugin`)

**Total Test Classes**: 1

| Test Class | Purpose |
|------------|---------|
| `WebserviceClientTest` | SOAP web service client |

---

### 1.7 Test Support Module (`implementation/test-support`)

**Support Class**: `TestData` - Provides test data generation utilities

---

## 2. Backend Integration Tests

### Integration Test Infrastructure

Located in: `implementation/gate/src/test/java/eu/efti/eftigate/testsupport/`

**Base Classes**:
- `IntegrationTest` - Uses Testcontainers for PostgreSQL, RabbitMQ
- `RestIntegrationTest` - Extends IntegrationTest for REST API tests

**Configuration**:
- `@Testcontainers` - Manages Docker containers for tests
- `@TestPropertySource` - Loads `application-it.yml` for integration tests
- PostgreSQL and RabbitMQ containers automatically started

**Test Scope**: Integration tests validate:
- Database operations (PostgreSQL)
- Message queue operations (RabbitMQ)
- REST API endpoints
- Service layer integration
- eDelivery message flow

---

## 3. Frontend Unit Tests (Angular/Jasmine)

Located in: `portal-mock/src/app/`

**Total Test Files**: 2

| Test File | Component | Purpose |
|-----------|-----------|---------|
| `app.component.spec.ts` | AppComponent | Root component initialization |
| `loader.component.spec.ts` | LoaderComponent | Loading indicator component |

**Framework**: Jasmine + Karma

**Note**: Minimal frontend test coverage in current implementation

---

## 4. Schema Validation Tests

Located in: `schema/xsd/testing/`

### 4.1 Identifier Query Test Cases

**File**: `identifier-query-test-cases.xml`

**Purpose**: Comprehensive test cases for identifier search functionality

**Test Groups**:

1. **Identifier Case Sensitivity and Type** (12 test cases)
   - Tests: `ABC-100`, `abc-100`, `DEF-100`, `def-100`
   - Validates: Case-insensitive identifier matching
   - Identifier types: MEANS, EQUIPMENT, CARRIED

2. **Identifier Type Filtering** (multiple test cases)
   - Tests different identifier type combinations
   - Validates correct filtering by type

3. **Mode Code Filtering** (multiple test cases)
   - Tests transport mode filtering
   - Mode codes: 1 (Maritime), 2 (Rail), 3 (Road), etc.

4. **Dangerous Goods Indicator** (multiple test cases)
   - Tests filtering by dangerous goods flag
   - Values: true/false

5. **Registration Country Filtering** (multiple test cases)
   - Tests filtering by country code
   - Example countries: AD, BA, HR, etc.

6. **Combinations** (complex test cases)
   - Tests multiple filter criteria together
   - Example: identifier + dangerousGoodsIndicator + modeCode + registrationCountryCode

**Test Structure**:
```xml
<dataGroup>
  <description>Test group description</description>
  <dataset>
    <id>UUID</id>
    <consignment>
      <!-- Test data -->
    </consignment>
  </dataset>
  <testCase>
    <query>
      <!-- Query parameters -->
    </query>
    <result>Expected UUID</result>
  </testCase>
</dataGroup>
```

**Schema**: `identifier-query-test-cases.xsd` defines the test case structure

### 4.2 Individual Test Case

**File**: `testcase CL654BG+FMC254.xml`

Specific test case for identifier `CL654BG+FMC254`

---

## 5. Manual/Functional Tests (Postman)

Located in: `utils/`

### 5.1 Postman Collection

**File**: `eFTI.postman_collection.json`

**Purpose**: Manual functional testing of REST APIs

**Test Categories** (inferred from typical Postman collections):
- Authentication (Keycloak token retrieval)
- UIL Query (POST/GET)
- Identifier Search (POST/GET)
- Follow-up Notes (POST)
- Platform API calls
- Cross-gate communication

### 5.2 Postman Environment

**File**: `Docker.postman_environment.json`

**Purpose**: Environment variables for local Docker deployment

**Typical Variables**:
- Gate URLs (Borduria, Syldavia, Listenbourg)
- Keycloak URLs
- Platform URLs
- Authentication credentials
- Test dataset IDs

### 5.3 Validation Script

**File**: `validate-examples.sh`

**Purpose**: Validates XML examples against XSD schemas

**Usage**: Ensures example XML files conform to schema definitions

---

## Test Coverage Summary

| Module | Unit Tests | Integration Tests | Total Classes |
|--------|------------|-------------------|---------------|
| Gate | 34 | Included in unit tests | 34 |
| Platform Simulator | 8 | - | 8 |
| Registry of Identifiers | 5 | - | 5 |
| eDelivery Connector | 3 | - | 3 |
| eFTI Logger | 3 | - | 3 |
| WS Plugin | 1 | - | 1 |
| Commons | 0 | - | 0 |
| Test Support | 1 | - | 1 |
| **Backend Total** | **55** | **~15** | **~70** |
| Frontend (Portal) | 2 | - | 2 |
| **Grand Total** | **57** | **~15** | **~72** |

---

## Key Test Scenarios Covered

### ✅ Covered by Automated Tests

1. **UIL Query Processing**
   - Local UIL queries (same gate)
   - External UIL queries (cross-gate)
   - UIL validation
   - UIL response handling
   - Error scenarios (not found, timeout, etc.)

2. **Identifier Search**
   - Search by transport means ID
   - Search by equipment ID
   - Search by carried equipment ID
   - Case-insensitive matching
   - Multi-criteria filtering (mode, country, dangerous goods)
   - Multi-gate broadcast

3. **Authentication & Authorization**
   - JWT token validation
   - Role extraction from Keycloak
   - Role-based endpoint access

4. **Message Processing**
   - RabbitMQ message sending/receiving
   - eDelivery message routing
   - Request status updates
   - Async processing

5. **Data Validation**
   - UIL DTO validation
   - Identifier search request validation
   - XML schema validation

6. **Subset Filtering**
   - XML filtering by subset IDs
   - Multiple subset combination (union)

7. **Database Operations**
   - Control entity CRUD
   - Request entity CRUD
   - Identifier registry queries

8. **Audit Logging**
   - Request logging
   - Registry access logging

### ❌ NOT Covered by Automated Tests

1. **Business-Case Scenarios**
   - Cabotage checks
   - ADR compliance verification
   - Customs clearance workflows
   - Road safety inspections
   - Weight/dimension checks

2. **Role-Based Subset Filtering**
   - Role-to-subset mapping (proposed in pilot guide, not implemented)
   - Different users seeing different data subsets

3. **Portal UI Functionality**
   - Role-based UI rendering
   - Data visualization
   - User workflows
   - Form validation

4. **End-to-End Scenarios**
   - Complete user journeys
   - Multi-step workflows
   - Cross-gate data flow validation

5. **Performance Testing**
   - Load testing
   - Stress testing
   - Scalability testing

6. **Security Testing**
   - Penetration testing
   - Vulnerability scanning
   - Certificate management

---

## Test Execution

### Running Backend Tests

```bash
# All tests
cd implementation
mvn clean test

# Specific module
cd implementation/gate
mvn test

# Specific test class
mvn test -Dtest=ControlServiceTest

# Integration tests only
mvn verify -P integration-test
```

### Running Frontend Tests

```bash
cd portal-mock
npm test

# With coverage
npm run test:coverage
```

### Running Schema Validation

```bash
cd utils
./validate-examples.sh
```

### Running Postman Tests

1. Import `eFTI.postman_collection.json` into Postman
2. Import `Docker.postman_environment.json` as environment
3. Ensure Docker containers are running
4. Execute collection or individual requests

---

## Test Data

### Test Datasets

**Location**: `deploy/local/efti-gate/platform/files/`

**Format**: XML files named by dataset UUID

**Examples** (from documentation):
- `12345678-ab12-4ab6-8999-123456789abc.xml` - Borduria test dataset
- `87654321-ba21-6ba4-9888-987654321cba.xml` - Syldavia test dataset

### Test Users

**Keycloak Realms**: eFTI_BO, eFTI_SY, eFTI_LI

**Users**:
- `user_bo` / `Azerty59*123` - Borduria road controller
- `user_sy` / `Azerty59*123` - Syldavia road controller
- `user_li` / `Azerty59*123` - Listenbourg road controller

**Roles**: `ROAD_CONTROLER`, `EXT_AAP`, `PLATFORM`

---

## Specific Test Scenarios Details

### 1. Platform Saving Datasets in ROI (Registry of Identifiers)

**Question**: Are there tests for `saveIdentifiers` method where platform can save a new dataset in ROI?

**Answer**: ✅ **YES** - Comprehensive tests exist!

**Location**: `implementation/registry-of-identifiers/src/test/java/eu/efti/identifiersregistry/service/IdentifiersServiceTest.java`

**Test Coverage**:

| Test Method | Purpose |
|------------|---------|
| `shouldCreateIdentifiers()` | Tests creating new identifiers in ROI |
| `shouldCreateIdentifiersAndIgnoreWrongsFields()` | Tests handling invalid data |
| `shouldCreateIfUilNotFound()` | Tests creating when UIL doesn't exist (new entry) |
| `shouldUpdateIfUILFound()` | Tests updating existing identifiers |
| `shouldFindByUil()` | Tests querying ROI by UIL |
| `shouldNotFindByUil()` | Tests querying non-existent UIL |
| `shouldSearch()` | Tests searching identifiers by criteria |

**Flow Tested**:
1. Platform sends `SaveIdentifiersRequest` to gate
2. Gate receives via `PlatformApiController.putConsignments()`
3. Gate routes to `IdentifiersRequestService.createOrUpdate()`
4. Gate calls `IdentifiersService.createOrUpdate()` (ROI module)
5. ROI saves/updates identifiers in database

**Additional Test Coverage**:
- `IdentifiersRequestServiceTest` - Tests request service layer
- `ApIncomingServiceTest.shouldManageIncomingNotificationForSaveIdentifierRequest()` - Tests eDelivery reception
- `EDeliveryMessageRouterTest` - Tests message routing to saveIdentifiers handler
- `PlatformApiControllerTest` (in integration tests) - Tests REST API endpoint

**Test Data Used**:
- Dataset ID: `12345678-ab12-4ab6-8999-123456789abc`
- Gate ID: `france`
- Platform ID: `ttf`
- Consignment data with transport events and carrier acceptance dates

---

### 2. Three Gates Setup

**Question**: Why does the current implementation have three gates? Are there tests where all three gates are used?

**Answer**: 

**Why Three Gates**:
The reference implementation uses **3 fictional countries** to demonstrate a multi-gate architecture:
- **Borduria (BO)** - Gate ID: `borduria`, Platform: `acme`, Communication: REST API
- **Syldavia (SY)** - Gate ID: `syldavia`, Platform: `massivedynamic`, Communication: eDelivery
- **Listenbourg (LI)** - Gate ID: `listenbourg`, Platform: `umbrellacorporation`, Communication: eDelivery

These are **fictional countries** (from Tintin comics and fictional references) used for demonstration purposes. The three-gate setup shows:
- Different communication patterns (REST vs eDelivery)
- Cross-gate communication scenarios
- Multi-country data exchange

**Are There Tests Using All Three Gates Together?**

**Answer**: ❌ **NO** - Individual tests use specific gates, but **no tests orchestrate all three gates together**.

**Gate Usage in Tests**:

| Test Class | Gates Used | Purpose |
|------------|------------|---------|
| `UilRequestServiceTest` | `listenbourg` (mostly) | Tests receiving requests from other gates |
| `IdentifiersRequestServiceTest` | `borduria` | Tests platform communication |
| `ControlServiceTest` | `borduria`, `france`, `finland` | Tests control creation |
| `RabbitListenerServiceTest` | `borduria` | Tests message processing |
| `GateToRequestTypeFunctionTest` | `fr.eu`, `be.eu` (France, Belgium) | Tests gate resolution |
| `EftiGateIdResolverTest` | `fr`, `be`, `de` (France, Belgium, Germany) | Tests multi-gate resolution |

**What's Missing**:
- No end-to-end integration test that:
  - Gate A queries Gate B
  - Gate B queries Gate C
  - All three gates participate in identifier broadcast
  - Complete cross-gate workflow

**Recommendation**: Add integration test that uses all three gates in a coordinated scenario.

---

### 3. Interoperability Tests

**Question**: Are there interoperability tests?

**Answer**: ❌ **NO** - No dedicated interoperability tests found.

**What Interoperability Tests Would Include**:
- Testing message format compatibility between different gate implementations
- Validating AS4/eDelivery protocol conformance
- Testing XML schema version compatibility
- Validating message exchange patterns across different systems
- Testing backward/forward compatibility

**What Exists Instead**:
- **Unit tests** for message serialization/deserialization
- **Integration tests** for eDelivery message routing
- **Schema validation tests** (XSD validation)

**Gap**: No tests validate that the implementation can interoperate with other eFTI gate implementations from different vendors.

**Recommendation**: Add interoperability test suite that:
- Validates AS4 conformance
- Tests message format compatibility
- Validates against eFTI specification requirements
- Tests with reference implementations from other vendors (if available)

---

### 4. Tests Where Another Gate Calls for Our Data

**Question**: Are there tests where other gate calls for our data?

**Answer**: ✅ **YES** - Multiple tests exist!

**Test Coverage**:

#### UIL Query Tests (Other Gate Requests Our Data)

| Test Class | Test Method | Purpose |
|------------|-------------|---------|
| `UilRequestServiceTest` | `receiveGateRequestFromOtherGateSucessTest()` | Tests receiving UIL query from foreign gate |
| `UilRequestServiceTest` | `manageResponseReceivedOtherGateTypeTest()` | Tests processing response for external gate query |
| `UilRequestServiceTest` | `receiveGateRequestFromOtherGateErrorNoDescriptionTest()` | Tests error handling for external gate queries |
| `UilRequestServiceTest` | `receiveGateRequestFromOtherGateErrorTest()` | Tests error responses to external gate |
| `ControlServiceTest` | `shouldCreateUilControlAndRespondWithErrorForExternalAsk_whileOnCurrentGateAndDataNotFoundOnlocalRegistry()` | Tests external gate query when data not found |

**Request Types Tested**:
- `EXTERNAL_ASK_UIL_SEARCH` - Another gate asks us to query local platform
- `EXTERNAL_UIL_SEARCH` - External gate UIL query

**Test Flow**:
1. Foreign gate (e.g., `listenbourg`) sends `UILQuery` via eDelivery
2. Our gate receives via `ApIncomingService`
3. Our gate routes to `UilRequestService.manageQueryReceived()`
4. Our gate queries local platform or ROI
5. Our gate responds with `UILResponse` back to foreign gate

**Example Test**:
```java
// From UilRequestServiceTest.receiveGateRequestFromOtherGateSucessTest()
final NotificationDto notificationDto = NotificationDto.builder()
    .content(NotificationContentDto.builder()
        .fromPartyId("http://efti.gate.listenbourg.eu")  // Foreign gate
        .body("<uilResponse...")  // UIL query from them
        .build())
    .build();

// Our gate processes the query and responds
uilRequestService.manageResponseReceived(notificationDto);
```

#### Identifier Query Tests (Other Gate Requests Our Data)

| Test Class | Test Method | Purpose |
|------------|-------------|---------|
| `IdentifiersRequestServiceTest` | `shouldManageMessageReceiveAndCreateNewControl_whenControlDoesNotExist()` | Tests receiving identifier query from foreign gate |
| `IdentifiersRequestServiceTest` | `shouldUpdateControlAndRequestStatus_whenResponseSentSuccessfullyForExternalRequest()` | Tests responding to external identifier query |

**Request Types Tested**:
- `EXTERNAL_ASK_IDENTIFIERS_SEARCH` - Another gate asks us to search our ROI
- `EXTERNAL_IDENTIFIERS_SEARCH` - External identifier query

**Test Flow**:
1. Foreign gate sends `IdentifierQuery` via eDelivery
2. Our gate receives and creates control with `EXTERNAL_ASK_IDENTIFIERS_SEARCH`
3. Our gate searches local ROI
4. Our gate responds with `IdentifierResponse`

#### Notes (Follow-up) Tests

| Test Class | Test Method | Purpose |
|------------|-------------|---------|
| `NotesRequestServiceTest` | Tests external note handling | Tests receiving notes from foreign gates |

**Message Reception Tests**:

| Test Class | Purpose |
|------------|---------|
| `ApIncomingServiceTest` | Tests receiving messages from external gates/platforms |
| `EDeliveryMessageRouterTest` | Tests routing incoming messages to correct handlers |

**What's Tested**:
- ✅ Receiving UIL queries from foreign gates
- ✅ Receiving identifier queries from foreign gates
- ✅ Receiving saveIdentifiers requests from platforms
- ✅ Responding to external gate requests
- ✅ Error handling for external requests
- ✅ Message routing for different message types

**What's NOT Fully Tested**:
- End-to-end workflow where:
  - Gate A requests data from Gate B
  - Gate B requests data from Gate C (chain scenario)
  - All gates participate in identifier broadcast (simultaneous multi-gate scenario)

---

### 5. Two-Step Workflow: Identifier Search → UIL Query

**Question**: How does the flow work when user is searching by identifiers, gets multiple options (with ROI info), then decides on one option and starts UIL query?

**Answer**: ✅ **This workflow exists in the portal UI, but is NOT covered by automated tests!**

**Flow Description**:

#### Step 1: Identifier Search
1. User searches by identifier (e.g., vehicle ID "ABC123")
   - Endpoint: `POST /v1/control/identifiers`
   - User submits form in portal (`IdentifiersSearchComponent`)

2. System searches ROI (Registry of Identifiers)
   - Local search in gate's ROI database
   - Broadcasts `IdentifierQuery` to other gates via eDelivery
   - Collects responses from all gates

3. System returns `IdentifierResponse` with multiple results
   - Response contains list of `Consignment` objects
   - Each `Consignment` contains:
     - **Identifier subset data** from ROI:
       - `gateId`, `platformId`, `datasetId` (UIL components)
       - `carrierAcceptanceDatetime`
       - `deliveryEventActualOccurrenceDatetime`
       - `mainCarriageTransportMovement[]` (transport means info)
       - `usedTransportEquipment[]` (equipment info)
     - **UIL information** (embedded in each consignment):
       - `gateId` - Target gate
       - `platformId` - Target platform
       - `datasetId` - Target dataset

**Example Response Structure**:
```json
{
  "requestId": "abc-123",
  "status": "COMPLETE",
  "identifiers": [
    {
      "gateIndicator": "HR",
      "status": "COMPLETE",
      "consignments": [
        {
          "gateId": "croatia",
          "platformId": "platform-hr",
          "datasetId": "11111111-1111-4111-8111-111111111111",
          "carrierAcceptanceDatetime": "2024-01-01T12:00:00Z",
          "deliveryEventActualOccurrenceDatetime": "2024-01-02T12:00:00Z",
          "mainCarriageTransportMovement": [...],
          "usedTransportEquipment": [...]
        },
        {
          "gateId": "croatia",
          "platformId": "platform-hr",
          "datasetId": "22222222-2222-4222-8222-222222222222",
          // ... more ROI data
        }
      ]
    }
  ]
}
```

#### Step 2: User Selection & ROI Info Display
4. Portal displays results with ROI information
   - `IdentifiersSearchComponent` shows list of results
   - Each result displays:
     - Gate ID, Platform ID, Dataset ID
     - Acceptance date, Delivery date
     - Transport means information
     - Equipment information
   - User can sort, filter, and view details

5. User clicks "Display" or "Open" on one result
   - Method: `IdentifiersSearchComponent.displayIdentifiers(identifiers)`
   - Saves identifier data to localStorage
   - Navigates to `/identifiers-display/:datasetId`
   - URL: `identifiers-display/11111111-1111-4111-8111-111111111111`

6. Portal displays full ROI information page
   - `IdentifiersDisplayComponent` loads identifier from localStorage
   - Shows complete identifier subset data:
     - Gate ID, Platform ID, Dataset ID
     - Dates (acceptance, delivery)
     - Transport movements (with sorting)
     - Transport equipment (with sorting)
   - **UIL information is visible** (gateId, platformId, datasetId)

#### Step 3: User Initiates UIL Query
7. User clicks "Go to UIL" button
   - Method: `IdentifiersDisplayComponent.goToUil()`
   - Extracts UIL components from identifier:
     ```typescript
     this.router.navigate(['/uil'], {
       queryParams: {
         id: this.identifiers.datasetId,      // From identifier result
         gate: this.identifiers.gateId,       // From identifier result
         platform: this.identifiers.platformId // From identifier result
       }
     });
     ```

8. Portal navigates to UIL search page with pre-filled data
   - `UilSearchComponent` receives query parameters
   - Pre-fills form fields:
     - `datasetId` = from identifier result
     - `gateId` = from identifier result
     - `platformId` = from identifier result

9. User submits UIL query
   - Endpoint: `POST /v1/control/uil`
   - Request body uses the UIL from identifier search result:
     ```json
     {
       "gateId": "croatia",           // From identifier result
       "datasetId": "11111111-1111-4111-8111-111111111111",  // From identifier result
       "platformId": "platform-hr",   // From identifier result
       "subsetId": ["full"]
     }
     ```

10. System processes UIL query (same as original UIL query test)
    - Creates control with `LOCAL_UIL_SEARCH` or `EXTERNAL_UIL_SEARCH`
    - Queries platform (REST or eDelivery)
    - Returns full dataset (not just identifier subset)

**Why This is NOT Tested as a Combined Flow**:

❌ **Missing Test Coverage**:
- **No end-to-end test** that combines identifier search + UIL query
- Tests cover identifier search separately
- Tests cover UIL query separately
- **No integration test** that:
  1. Performs identifier search
  2. Verifies response contains UIL info
  3. Extracts UIL from identifier result
  4. Uses that UIL to perform UIL query
  5. Verifies full dataset is returned

**Existing Test Coverage** (Separate):
- ✅ `IdentifiersServiceTest` - Tests ROI search and returning ConsignmentDto with UIL info
- ✅ `IdentifiersRequestServiceTest` - Tests identifier search request processing
- ✅ `ControlServiceTest.createUilControl()` - Tests UIL query creation
- ✅ `UilRequestServiceTest` - Tests UIL query processing

**What's Missing**:
- ❌ Integration test for: Identifier Search → Extract UIL → UIL Query
- ❌ Test that verifies identifier response contains complete UIL components
- ❌ Test that verifies portal can extract UIL from identifier result
- ❌ End-to-end test for the complete user workflow

**Recommendation**: Add integration test that:
1. Performs identifier search with known identifier
2. Verifies response contains `ConsignmentDto` objects with `gateId`, `platformId`, `datasetId`
3. Extracts UIL from first result
4. Performs UIL query using extracted UIL
5. Verifies full dataset is returned (not just identifier subset)

**Example Test Scenario**:
```java
@Test
void shouldPerformIdentifierSearchThenUilQuery() {
    // Step 1: Identifier search
    SearchWithIdentifiersRequestDto identifierSearch = SearchWithIdentifiersRequestDto.builder()
        .identifier("ABC123")
        .identifierType(List.of("MEANS"))
        .build();
    
    RequestIdDto identifierRequestId = controlService.createIdentifiersControl(identifierSearch);
    
    // Wait for identifier search to complete
    ControlDto identifierControl = controlService.getControlByRequestId(identifierRequestId.getRequestId());
    assertEquals(StatusEnum.COMPLETE, identifierControl.getStatus());
    
    // Step 2: Extract UIL from first identifier result
    List<ConsignmentDto> results = identifierControl.getIdentifiersResults().getConsignments();
    assertFalse(results.isEmpty());
    
    ConsignmentDto firstResult = results.get(0);
    String gateId = firstResult.getGateId();
    String platformId = firstResult.getPlatformId();
    String datasetId = firstResult.getDatasetId();
    
    // Step 3: Perform UIL query using extracted UIL
    UilDto uilDto = UilDto.builder()
        .gateId(gateId)
        .platformId(platformId)
        .datasetId(datasetId)
        .subsetIds(List.of("full"))
        .build();
    
    RequestIdDto uilRequestId = controlService.createUilControl(uilDto);
    
    // Step 4: Verify UIL query returns full dataset
    ControlDto uilControl = controlService.getControlByRequestId(uilRequestId.getRequestId());
    assertEquals(StatusEnum.COMPLETE, uilControl.getStatus());
    assertNotNull(uilControl.getEftiData());  // Full dataset, not just identifier subset
}
```

---

## Gaps and Recommendations

### Current Gaps

1. **Limited Frontend Testing**
   - Only 2 test files for Angular app
   - No E2E tests (Cypress/Playwright)

2. **No Business Logic Tests**
   - Tests focus on technical functionality
   - No domain-specific validation (cabotage, ADR, etc.)

3. **No Performance Tests**
   - No load/stress testing
   - No scalability validation

4. **Limited Integration Coverage**
   - eDelivery integration could be more comprehensive
   - Cross-gate scenarios need more coverage
   - **No tests using all three gates together** ⚠️

5. **No Role-Based Access Tests**
   - Role-to-subset mapping not tested
   - Different user perspectives not validated

6. **No Interoperability Tests** ⚠️
   - No AS4 conformance testing
   - No cross-vendor compatibility validation
   - No protocol specification compliance tests

### Recommendations

1. **Add Business-Case Tests**
   - Create test scenarios for cabotage checks
   - Add ADR compliance validation tests
   - Implement customs workflow tests

2. **Expand Frontend Testing**
   - Add component tests for all UI components
   - Implement E2E tests for user workflows
   - Add visual regression testing

3. **Implement Performance Testing**
   - Add JMeter or Gatling tests
   - Define performance benchmarks
   - Test multi-gate scalability

4. **Enhance Integration Testing**
   - Add more cross-gate scenarios
   - Test failure/recovery scenarios
   - Validate eDelivery message flow end-to-end

5. **Add Role-Based Tests**
   - Test role-to-subset mapping
   - Validate different user views
   - Test authorization boundaries

---

## Conclusion

The eFTI reference implementation has **solid technical test coverage** for:
- Core API functionality (UIL queries, identifier search)
- Message processing (RabbitMQ, eDelivery)
- Data validation and persistence
- Authentication and basic authorization

However, it **lacks business-case-specific tests** and **end-to-end scenario validation**. The tests focus on verifying that the technical infrastructure works, not that it solves specific business problems like cabotage checks or ADR compliance.

For a production pilot, additional tests should be added to validate:
- Business rules and domain logic
- Complete user workflows
- Role-based data access
- Performance under load
- Security and compliance requirements

