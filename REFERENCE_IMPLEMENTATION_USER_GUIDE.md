# eFTI Reference Implementation - User Guide

## Overview

This document explains how the eFTI (electronic Freight Transport Information) reference implementation works from a user perspective. It describes the complete flow of how authorities (like road inspectors, customs officers, or ADR inspectors) can request and view transport consignment data.

The system allows authorized users to search for transport information using either:
- **UIL (Unique Identifier Locator)** - a specific dataset identifier
- **Identifiers** - transport equipment identifiers like container numbers, vehicle license plates, etc.

---

## 1. User Authentication and Login

### Detailed Portal Login Flow

When a user wants to access the system, they first need to log in through the user application (portal). The login process works as follows:

#### Step-by-Step Authentication Process

1. **User Accesses Portal**
   - User navigates to the portal URL (e.g., `http://portal.efti.fr:83`)
   - Portal application loads in the browser

2. **User Enters Credentials**
   - User enters username and password in the login form
   - Portal sends credentials to Keycloak authentication service

3. **Keycloak Authentication**
   - **Keycloak validates credentials** against the configured realm (e.g., `eFTI_HR`, `eFTI_BO`, `eFTI_SY`, `eFTI_LI`)
   - **Keycloak checks user roles** - Users must have the `ROAD_CONTROLER` role (or appropriate role for their function)
   - **Keycloak issues tokens**:
     - **Access Token** (JWT) - Contains user identity, roles, and permissions
     - **Refresh Token** - Used to obtain new access tokens when they expire
     - **ID Token** - Contains user identity information

4. **Token Storage and Usage**
   - Portal receives tokens from Keycloak
   - Portal stores tokens (typically in browser session storage or cookies)
   - **For API requests**: Portal automatically includes the access token in the `Authorization: Bearer <token>` header
   - **Token expiration**: Access tokens typically expire after 600 seconds (10 minutes)
   - **Auto-refresh**: Portal can automatically refresh tokens before expiration (30 seconds before expiry)

5. **Session Management**
   - Portal checks authentication status on page load by calling `/redirect_uri?info=json`
   - If user is authenticated, portal loads user information (username, roles)
   - If user is not authenticated, portal redirects to Keycloak login page
   - **Session timeout**: User sessions expire after 30 minutes of inactivity (configurable)

6. **API Request Authentication**
   - All API requests to `/api/*` endpoints require authentication
   - Portal automatically adds `Authorization: Bearer <access_token>` header to requests
   - Gate validates the token with Keycloak before processing requests
   - If token is invalid or expired, gate returns `401 Unauthorized` error

#### Authentication Configuration

The portal uses **Apache HTTP Server with mod_auth_openidc** module for authentication:

- **OIDC Provider**: Keycloak (e.g., `http://auth.gate.croatia.eu:8080/realms/eFTI_HR`)
- **Client ID**: `portal`
- **Client Secret**: Configured per realm
- **Redirect URI**: `http://portal.efti.fr:83/redirect_uri`
- **Session Timeout**: 1800 seconds (30 minutes)
- **Token Refresh**: 30 seconds before expiration

#### Keycloak Realms and Users

Keycloak uses "realms" to organize users. Each country or organization typically has its own realm. Within a realm, users are organized based on their roles.

**Example Realms**:
- `eFTI_HR` - Croatian realm
- `eFTI_BO` - Borduria realm
- `eFTI_SY` - Syldavia realm
- `eFTI_LI` - Listenbourg realm

**User Roles**:
- `ROAD_CONTROLER` - Road inspection authority
- Other roles may be configured per realm

**Authentication Errors**:
- **Invalid credentials**: Keycloak returns authentication error, portal displays login error message
- **User not found**: Keycloak returns authentication error
- **Token expired**: Portal automatically attempts token refresh; if refresh fails, user is redirected to login
- **Unauthorized access**: If user lacks required role, gate returns `403 Forbidden` error

**Important Limitation**: The reference implementation uses Keycloak for authentication, but it's not a full Identity and Access Management (IAM) system. In a production environment, some of the authentication and authorization checks should ideally be handled by the AAP (Access Authorization Point), which is not fully implemented in this reference version.

---

## 2. Request Generation

### Creating a Request

Once logged in, users can create requests to retrieve transport consignment data. There are two types of requests:

#### A. UIL Query Request

A UIL (Unique Identifier Locator) query is used when you know the exact dataset identifier. The request includes:

- **UIL Components**:
  - `gateId` - The gate (country) where the data is stored
  - `platformId` - The platform system that holds the data
  - `datasetId` - The unique identifier for the specific dataset
- **Subset ID** - This is crucial for filtering

### UIL Data Entry and Validation

#### Portal Form Validation

When a user enters UIL data in the portal, the system performs **client-side validation** before submitting:

**Dataset ID Validation**:
- **Format**: Must match UUID v4 format: `[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}`
- **Example valid format**: `12345678-ab12-4ab6-8999-123456789abc`
- **Required**: Field cannot be empty
- **Error messages**:
  - If empty: "this field is required"
  - If format incorrect: "this field doesnt match required format"

**Gate ID Validation**:
- **Format**: Must match pattern: `^[-@./#&+\w\s]*$` (alphanumeric, spaces, and special characters: `-@./#&+`)
- **Maximum length**: 255 characters
- **Required**: Field cannot be empty
- **Error messages**:
  - If empty: "this field is required"
  - If format incorrect: "gateId format incorrect."
  - If too long: "gateId max length is 255 characters."

**Platform ID Validation**:
- **Format**: Must match pattern: `^[-@./#&+\w\s]*$` (alphanumeric, spaces, and special characters: `-@./#&+`)
- **Maximum length**: 255 characters
- **Required**: Field cannot be empty
- **Error messages**:
  - If empty: "this field is required"
  - If format incorrect: "platformId format incorrect."
  - If too long: "platformId max length is 255 characters."

**Form Submission**:
- Portal validates all fields before allowing submission
- If any field has errors, form submission is blocked
- User must fix all errors before submitting
- Once form is valid, portal sends POST request to `/v1/control/uil` endpoint

#### Server-Side Validation

After the portal submits the request, the **gate performs additional server-side validation**:

**Validation Process**:
1. **Bean Validation**: Gate uses Jakarta Bean Validation to validate the UIL DTO
2. **Field Validation**: Each field is checked against its constraints:
   - `gateId`: Not null, not blank, max 255 chars, format pattern
   - `datasetId`: Not null, not blank, max 36 chars, UUID v4 format
   - `platformId`: Not null, not blank, max 255 chars, format pattern

**Validation Errors**:
- If validation fails, gate returns error immediately (before creating request)
- Error response includes:
  - `errorCode`: Error code enum (e.g., `UIL_GATE_MISSING`, `DATASET_ID_INCORRECT_FORMAT`)
  - `errorDescription`: Human-readable error message
  - `requestId`: `null` (no request created)
  - `status`: `ERROR`

**Common Validation Error Codes**:
- `UIL_GATE_MISSING` - "Missing parameter gateId"
- `UIL_UUID_MISSING` - "Missing parameter datasetId"
- `UIL_PLATFORM_MISSING` - "Missing parameter platformId"
- `GATE_ID_INCORRECT_FORMAT` - "gateId format incorrect."
- `DATASET_ID_INCORRECT_FORMAT` - "datasetId format is incorrect."
- `PLATFORM_ID_INCORRECT_FORMAT` - "platformId format incorrect."
- `GATE_ID_TOO_LONG` - "gateId max length is 255 characters."
- `DATASET_ID_TOO_LONG` - "datasetId max length is 36 characters."
- `PLATFORM_ID_TOO_LONG` - "platformId max length is 255 characters."

**Platform Existence Check**:
- For **local platforms** (same gate), gate checks if platform exists in configuration
- If platform does not exist, gate returns error:
  - `errorCode`: `PLATFORM_ID_DOES_NOT_EXIST`
  - `errorDescription`: "Platform with the given id does not exist."
- For **foreign gates**, this check is not performed (gate assumes platform exists)

#### What Happens When Data Does Not Exist

**Scenario 1: UIL Not Found in Local Registry**

If the UIL query is for a **local platform** (same gate), the gate first checks the Registry of Identifiers (ROI):

1. **ROI Lookup**: Gate queries ROI database:
   ```sql
   SELECT c FROM Consignment c 
   WHERE c.gateId = :gate 
     AND c.datasetId = :uuid 
     AND c.platformId = :platform
   ```

2. **If Not Found**:
   - Gate sets error: `DATA_NOT_FOUND_ON_REGISTRY`
   - Control status set to `ERROR`
   - If this is an external request (from another gate), gate sends error response back
   - If this is a user request, user receives error when polling

**Scenario 2: Dataset File Not Found on Platform**

When the platform receives a UIL request:

1. **Platform looks for dataset**:
   - First checks database: `SELECT * FROM consignment_xml WHERE dataset_id = :datasetId`
   - If not in database, falls back to file system: `{cdaPath}/{datasetId}.xml`

2. **If Dataset Not Found**:
   - Platform returns HTTP `404 Not Found` status
   - Gate receives error response
   - Gate sets request status to `ERROR`
   - Error code: `DATA_NOT_FOUND` or `NOT_FOUND`
   - Control status set to `ERROR`
   - User receives error when polling: `status: "ERROR"`, `errorCode: "DATA_NOT_FOUND"`

**Scenario 3: Foreign Gate Cannot Find Data**

When requesting data from a foreign gate:

1. **Foreign gate receives request** via Domibus
2. **Foreign gate checks its local registry** (same process as Scenario 1)
3. **If not found**:
   - Foreign gate sends error response via Domibus
   - Response status: `NOT_FOUND` (eDelivery status code)
   - Your gate receives error response
   - Your gate sets request status to `ERROR`
   - Error code: `DATA_NOT_FOUND_ON_REGISTRY`
   - User receives error when polling

**Error Response Format**:
```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "ERROR",
  "errorCode": "DATA_NOT_FOUND",
  "errorDescription": "Data not found."
}
```

**User Experience**:
- Portal displays error message to user
- Error is shown in the request status table
- User can see error code and description
- User can retry with corrected UIL if needed

#### B. Identifier Query Request

An identifier query is used when you know transport equipment identifiers (like container numbers, vehicle license plates) but not the dataset ID. The request includes:

- **Identifier** - The equipment identifier (e.g., container number "ABCD1234567")
- **Identifier Type** - What kind of identifier it is (see supported types below)
- **Transport Mode** - Road (3), Rail (2), Maritime (1), or Air (4)
- **Registration Country** - Country where the equipment is registered
- **Dangerous Goods Indicator** - Whether dangerous goods are involved
- **Subset ID** - For filtering the response

### Supported Identifier Types

The system supports three types of transport identifiers:

1. **MEANS** (eFTI618) - **Transport Means Identifier**
   - Represents the vehicle or truck used for transport
   - Examples: Vehicle license plates, truck registration numbers
   - Maximum length: 17 characters

2. **EQUIPMENT** (eFTI374) - **Transport Equipment Identifier**
   - Represents containers, trailers, or other transport equipment
   - Examples: Container numbers (like "ABCD1234567"), trailer IDs
   - Maximum length: 17 characters

3. **CARRIED** (eFTI448) - **Carried Transport Equipment Identifier**
   - Represents equipment that is carried inside another piece of transport equipment
   - Examples: A container inside another container, nested equipment
   - Maximum length: 17 characters

**How to Use Identifier Types**:
- You can select **one or more** identifier types when searching
- If you don't specify any types, the system searches **all three types** by default
- The search is **case-insensitive** (you can use "MEANS", "means", "Means", etc.)
- The identifier value itself can be up to 17 characters long

**Example**: If you search for identifier "ABC123" with type "EQUIPMENT", the system will only look for containers or trailers with that ID. If you select both "MEANS" and "EQUIPMENT", it will search for both vehicles and containers with that identifier.

**Important: Two-Step Process for Identifier Queries**

Unlike UIL queries (which return the full dataset immediately), identifier queries work in two steps:

1. **Step 1: Search and Get Results List**
   - When you submit an identifier query, the system searches the Registry of Identifiers (ROI)
   - The search may find **multiple consignments** that match your identifier
   - You receive a list of matching consignments, each showing:
     - Gate ID (where the data is stored)
     - Platform ID (which platform has the data)
     - Dataset ID (the unique identifier for that consignment)
     - Acceptance date
     - Delivery date
     - Basic transport information

2. **Step 2: Select a Consignment to View Full Dataset**
   - From the results list, you **select one consignment** that you want to view
   - When you click on a result, the system:
     - Extracts the UIL (gate, platform, dataset ID) from the selected consignment
     - Creates a new request for the full dataset using that UIL
     - Applies the subset_id filtering you specified in the original query
     - Returns the complete filtered dataset for that specific consignment

**Why This Two-Step Process?**

- **One identifier can match multiple consignments**: The same container number or vehicle plate might appear in multiple transport movements
- **You need to choose which one to view**: The system shows you all matches, and you select the specific consignment you're interested in
- **Efficiency**: The system doesn't fetch full datasets for all matches (which could be many), only for the one you select

**Example Flow**:
```
1. User searches for identifier "ABC123" → System finds 3 matching consignments
2. User sees list: 
   - Consignment A (Gate: HR, Platform: HR-PLATFORM, Dataset: xxx-111)
   - Consignment B (Gate: SLO, Platform: SLO-PLATFORM, Dataset: yyy-222)
   - Consignment C (Gate: AT, Platform: AT-PLATFORM, Dataset: zzz-333)
3. User clicks on Consignment B → System requests full dataset for yyy-222
4. User receives filtered XML data for Consignment B
```

### What is Subset ID?

The **subset_id** is a critical parameter that determines what data will be returned. It represents a "country profile" or "regulation profile" that defines which fields are legally required or allowed to be shown.

**Examples of subset IDs**:
- `AT07`, `AT12` - Austrian regulation profiles (different regulations have different data requirements)
- `FI02` - Finnish regulation profile
- `BE01` - Belgian regulation profile
- `HR01` - Croatian regulation profile
- `full` - Complete dataset with all fields
- `identifier` - Basic identifier information only

**How it works**: Each country can define specific rules about which data fields must be included or can be omitted from the XML response. For example, Austrian regulation AT07 might require certain fields, while AT12 might require different fields. The platform uses these subset IDs to filter the XML data before returning it.

### API Endpoints

The portal communicates with the gate through REST API endpoints:

#### UIL Query Endpoints

**POST `/v1/control/uil`** - Create UIL Query Request
- **Authentication**: Required (Bearer token)
- **Authorization**: Requires `ROAD_CONTROLER` role
- **Request Body**:
  ```json
  {
    "gateId": "borduria",
    "platformId": "croatia eFTI platform",
    "datasetId": "12345678-ab12-4ab6-8999-123456789abc"
  }
  ```
- **Response Codes**:
  - `202 Accepted` - Request created successfully
  - `401 Unauthorized` - Authentication failed or token missing
  - `403 Forbidden` - User lacks required role
  - `500 Internal Server Error` - Server error
- **Response Body** (202):
  ```json
  {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "PENDING"
  }
  ```
- **Error Response** (if validation fails):
  ```json
  {
    "requestId": null,
    "status": "ERROR",
    "errorCode": "DATASET_ID_INCORRECT_FORMAT",
    "errorDescription": "datasetId format is incorrect."
  }
  ```

**GET `/v1/control/uil?requestId={requestId}`** - Get UIL Query Result
- **Authentication**: Required (Bearer token)
- **Authorization**: Requires `ROAD_CONTROLER` role
- **Query Parameters**:
  - `requestId` (required) - The request ID returned from POST request
- **Response Codes**:
  - `200 OK` - Request found, returns status and data (if available)
  - `401 Unauthorized` - Authentication failed
  - `403 Forbidden` - User lacks required role
  - `500 Internal Server Error` - Server error
- **Response Body** (200, when complete):
  ```json
  {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "COMPLETE",
    "data": "base64-encoded-xml-data"
  }
  ```
- **Response Body** (200, when pending):
  ```json
  {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "PENDING"
  }
  ```
- **Response Body** (200, when error):
  ```json
  {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "ERROR",
    "errorCode": "DATA_NOT_FOUND",
    "errorDescription": "Data not found."
  }
  ```

#### Identifier Query Endpoints

**POST `/v1/control/identifiers`** - Create Identifier Query Request
- **Authentication**: Required (Bearer token)
- **Authorization**: Requires `ROAD_CONTROLER` role
- **Request Body**:
  ```json
  {
    "identifier": "ABC123",
    "identifierType": ["EQUIPMENT", "MEANS"],
    "modeCode": "3",
    "registrationCountryCode": "HR",
    "dangerousGoodsIndicator": false
  }
  ```
- **Response Codes**: Same as UIL POST endpoint
- **Response Body**: Same format as UIL POST endpoint

**GET `/v1/control/identifiers?requestId={requestId}`** - Get Identifier Query Result
- **Authentication**: Required (Bearer token)
- **Authorization**: Requires `ROAD_CONTROLER` role
- **Response Body** (200, when complete):
  ```json
  {
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "COMPLETE",
    "identifiers": [
      {
        "gateIndicator": "HR",
        "status": "COMPLETE",
        "consignments": [
          {
            "gateId": "borduria",
            "platformId": "croatia eFTI platform",
            "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
            "carrierAcceptanceDatetime": "2024-01-15T10:30:00Z",
            "deliveryEventActualOccurrenceDatetime": "2024-01-16T14:20:00Z"
          }
        ]
      }
    ]
  }
  ```

### Request Processing

When a request is created:

1. **Request is stored in database** - The system creates a record in the `control` table with:
   - A unique `requestId` (UUID) - This is what you use to check the status
   - Request type (UIL or Identifier)
   - Status: `PENDING` (initially)
   - The UIL or identifier information
   - The subset_id(s) requested (defaults to `["full"]` if not specified)
   - Timestamp of creation
   - Authority information (from authenticated user)

2. **Response returns immediately** - The system doesn't wait for the data. Instead, it returns:
   ```json
   {
     "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
     "status": "PENDING"
   }
   ```

3. **Background processing begins** - The system processes the request asynchronously:
   - Request is added to RabbitMQ queue
   - Background worker picks up the request
   - Processing begins (ROI lookup, platform request, etc.)

### Checking Request Status

You can check the status of your request in two ways:

1. **Manual polling** - Periodically call the API with the `requestId` to check if data is ready
2. **Auto-polling** - The portal application can automatically check every few seconds (configurable)

#### Portal Auto-Polling Behavior

The portal implements automatic polling for pending requests:

**Configuration**:
- **Polling interval**: 2 seconds (2000ms)
- **Enabled by default**: Yes (can be disabled in user settings)
- **Storage**: Preference stored in browser's `localStorage`

**How It Works**:
1. Portal creates a timer that runs every 2 seconds
2. For each request with status `PENDING`, portal calls `GET /v1/control/uil?requestId={requestId}`
3. Portal updates the request status in the UI
4. If status changes from `PENDING` to another status, portal shows a success toast notification
5. Polling continues until all requests are no longer `PENDING`

**User Experience**:
- User sees request status update automatically
- No need to manually refresh the page
- Toast notification appears when request completes
- If request fails, error message is displayed

**Manual Polling**:
- User can manually click "Update" button to check status immediately
- Portal calls the same GET endpoint
- Status is updated in the UI

**Request Status Values**:
- `PENDING` - Request created, processing not started, or still in progress
- `IN_PROGRESS` - System is actively processing the request (internal status, may show as PENDING to user)
- `COMPLETE` - Data is ready and available
- `ERROR` - An error occurred (e.g., data not found, network issue, validation error)
- `TIMEOUT` - Request took too long and timed out (default timeout: 60 seconds)

**Status Transition Flow**:
```
PENDING → IN_PROGRESS → SUCCESS → COMPLETE
                    ↓
                  ERROR
                    ↓
                 TIMEOUT
```

**Status Mapping** (Internal to User-Facing):
- `RECEIVED`, `IN_PROGRESS`, `RESPONSE_IN_PROGRESS` → Displayed as `PENDING` to user
- `SUCCESS` → Displayed as `COMPLETE` to user
- `SEND_ERROR`, `ERROR` → Displayed as `ERROR` to user
- `TIMEOUT` → Displayed as `TIMEOUT` to user

### Identifier Validation

#### Portal Form Validation

When a user enters identifier search criteria:

**Identifier Value Validation**:
- **Format**: Must match pattern: `^[A-Za-z0-9]{1,17}$` (alphanumeric only, 1-17 characters)
- **Required**: Field cannot be empty
- **Error messages**:
  - If empty: "this field is required"
  - If format incorrect: "this field doesnt match required format"
- **Note**: Portal only allows alphanumeric characters, but server-side normalization handles dashes and spaces

**Identifier Type Validation**:
- **Allowed values**: `["MEANS", "EQUIPMENT", "CARRIED"]` (case-insensitive)
- **Multiple selection**: User can select one or more types
- **Default**: If no types selected, system searches all three types
- **Server-side**: Validates against enum values

**Transport Mode Validation**:
- **Format**: Single digit string: `"1"`, `"2"`, `"3"`, or `"4"`
- **Values**:
  - `"1"` - Maritime
  - `"2"` - Rail
  - `"3"` - Road
  - `"4"` - Air
- **Optional**: Field can be empty (no filter applied)
- **Server-side**: Validates format and value

**Registration Country Code Validation**:
- **Format**: ISO 3166-1 alpha-2 country code (2 uppercase letters)
- **Examples**: `"HR"`, `"AT"`, `"DE"`, `"FR"`
- **Optional**: Field can be empty (no filter applied)
- **Server-side**: Validates format

**Dangerous Goods Indicator Validation**:
- **Format**: Boolean value or `"NA"` (not applicable)
- **Required**: Field must have a value
- **Default**: `"NA"` if not specified
- **Server-side**: Validates value

#### Server-Side Validation

After portal submits identifier request:

**Validation Process**:
1. **Bean Validation**: Gate uses Jakarta Bean Validation
2. **Field Validation**: Each field is checked:
   - `identifier`: Not null, not blank, max 17 chars, alphanumeric pattern
   - `identifierType`: Valid enum values (MEANS, EQUIPMENT, CARRIED)
   - `modeCode`: Single digit if provided
   - `registrationCountryCode`: 2-letter country code if provided
   - `dangerousGoodsIndicator`: Boolean or "NA"

**Validation Error Codes**:
- `IDENTIFIER_MISSING` - "Identifier missing."
- `IDENTIFIER_TOO_LONG` - "Identifier too long"
- `IDENTIFIER_INCORRECT_FORMAT` - "Identifier incorrect format"
- `IDENTIFIER_TYPE_INCORRECT` - "Identifier type is incorrect"
- `MODE_CODE_INCORRECT_FORMAT` - "Mode Code Incorrect : must be one digit"
- `REGISTRATION_COUNTRY_INCORRECT` - "VehicleCountry incorrect"

**What Happens When Identifier Not Found**:

If identifier search returns no results:
- ROI search completes successfully but returns empty list
- Gate creates request with status `COMPLETE`
- Response contains empty `consignments` array
- User sees: "No results found" message in portal
- This is **not an error** - it's a valid result (identifier simply doesn't exist in registry)

### Limitations

- **Identifier types**: The system supports three specific identifier types (MEANS, EQUIPMENT, CARRIED) as defined in the eFTI schema. Other identifier types are not currently supported.
- **Identifier length**: All identifiers have a maximum length of 17 characters.
- **No real-time notifications**: The system uses polling (checking periodically) rather than push notifications when data is ready.
- **Identifier normalization**: The system normalizes identifiers (removes dashes, spaces, converts to uppercase) for matching, which means `"ABC-123"` will match `"ABC123"` in the database.

---

## 3. Internal Communication Components

To understand why requests take time and how the system processes them, it's helpful to know about two key components that handle internal communication:

### RabbitMQ - Internal Message Queue

**What it is**: RabbitMQ is an internal message queue system that acts like a "to-do list" for the gate.

**Why it's needed**: When you create a request, the system doesn't process it immediately. Instead:
1. Your request is added to a queue (like adding a task to a to-do list)
2. Background workers pick up requests from the queue one at a time
3. This allows the system to handle many requests without blocking

**What it does**:
- **Stores pending requests** - When you submit a request, it's added to a queue
- **Manages processing order** - Requests are processed in order (first come, first served)
- **Handles load** - If many requests come in, they wait in the queue until a worker is available
- **Enables asynchronous processing** - The system can work on requests in the background while you do other things

**Impact on users**: This is why you get a `requestId` immediately but need to check back later for results. The request is queued and processed when a worker becomes available.

### Domibus - Gate-to-Gate Communication

**What it is**: Domibus is the system that handles secure communication between different gates (countries) and between gates and platforms.

**Why it's needed**: When data is stored in another country's gate or platform, your gate needs to communicate with that foreign system securely. Domibus provides this secure communication channel.

**What it does**:
- **Secure messaging** - Uses the eDelivery (AS4) protocol for secure, reliable message exchange
- **Gate-to-gate communication** - When your gate needs data from another country's gate, Domibus handles the secure message exchange
- **Gate-to-platform communication** - Some platforms communicate via Domibus instead of direct REST API calls
- **Message reliability** - Ensures messages are delivered and tracks delivery status

**How it works**:
1. Your gate creates a request message
2. Domibus packages it securely and sends it to the target gate/platform
3. The receiving system processes the request
4. Domibus securely delivers the response back to your gate
5. Your gate processes the response and updates your request status

**Impact on users**: This is why requests to foreign gates or platforms may take longer - the message needs to travel securely through Domibus, be processed by the foreign system, and travel back. This adds time but ensures secure, reliable communication.

### Why These Components Matter

Understanding these components helps explain:
- **Why requests are asynchronous** - RabbitMQ queues requests for background processing
- **Why there are delays** - Domibus communication between gates takes time
- **Why you need to poll for status** - Processing happens in the background, so you check periodically
- **Why the system is reliable** - Both components ensure messages are processed and delivered correctly

**Note**: As a user, you don't need to interact with these components directly. They work automatically behind the scenes to process your requests and communicate with other systems.

---

## 4. Portal (Gate) Processing

### Registry of Identifiers (ROI) Lookup

When a request comes in, the portal (also called "gate") needs to figure out where the data is stored:

1. **For UIL queries**: The gate and platform are already specified, so the system knows where to look and can immediately request the full dataset

2. **For identifier queries**: The process is different and involves searching the Registry of Identifiers (ROI)

### Detailed Identifier Search Flow

Here's the complete step-by-step process when a user searches by identifiers:

#### Step 1: User Enters Search Criteria

The user enters:
- **Identifier value** (e.g., "ABC123", "HR-ABC-123")
- **Identifier Type(s)** - One or more of: MEANS, EQUIPMENT, CARRIED
- **Optional filters**: Transport mode, registration country, dangerous goods indicator

#### Step 2: Portal Searches ROI Database Tables

The portal searches the Registry of Identifiers (ROI), which consists of several database tables. The search uses **JPA Criteria API** to build dynamic queries.

**Main Tables Searched**:
- **`consignment` table**: Stores basic consignment information
  - `gate_id` - Which gate has the data
  - `platform_id` - Which platform has the data
  - `dataset_id` - The unique dataset identifier
  - `carrier_acceptance_datetime` - When the carrier accepted the consignment
  - `delivery_event_actual_occurrence_datetime` - When delivery occurred

- **`main_carriage_transport_movement` table**: Stores transport movement details
  - `used_transport_means_id` - Vehicle/truck identifier (searched when type is MEANS)
  - `used_transport_means_registration_country` - Vehicle registration country
  - `mode_code` - Transport mode (road, rail, maritime, air)
  - `dangerous_goods_indicator` - Whether dangerous goods are involved

- **`used_transport_equipment` table**: Stores equipment information
  - `equipment_id` - Container/trailer identifier (searched when type is EQUIPMENT)
  - `registration_country` - Equipment registration country

- **`carried_transport_equipment` table**: Stores nested equipment information
  - `equipment_id` - Carried equipment identifier (searched when type is CARRIED)

**How the Search Works**:
- If user selects **MEANS**: System searches `main_carriage_transport_movement.used_transport_means_id`
- If user selects **EQUIPMENT**: System searches `used_transport_equipment.equipment_id`
- If user selects **CARRIED**: System searches `carried_transport_equipment.equipment_id`
- If user selects **multiple types**: System searches all selected types and combines results (using `HashSet` to avoid duplicates)
- If user selects **no types**: System searches all three types by default

The search also applies any optional filters (transport mode, registration country, dangerous goods indicator) to narrow down results.

#### Exact Database Queries

The system uses **JPA Criteria API** to build queries dynamically. Here are the equivalent SQL queries that are executed:

**Query for MEANS Type Search**:
```sql
SELECT DISTINCT c.*
FROM consignment c
LEFT JOIN main_carriage_transport_movement m ON c.id = m.consignment_id
WHERE 
  -- Identifier matching (normalized: remove dashes, spaces, convert to uppercase)
  UPPER(REPLACE(REPLACE(m.used_transport_means_id, '-', ''), ' ', '')) = UPPER(REPLACE(:identifier, '[^A-Za-z0-9]', ''))
  -- Optional filters
  AND (:modeCode IS NULL OR m.mode_code = :modeCode)
  AND (:dangerousGoodsIndicator IS NULL OR m.dangerous_goods_indicator = :dangerousGoodsIndicator)
  AND (:registrationCountryCode IS NULL OR m.used_transport_means_registration_country = :registrationCountryCode)
```

**Query for EQUIPMENT Type Search**:
```sql
SELECT DISTINCT c.*
FROM consignment c
LEFT JOIN main_carriage_transport_movement m ON c.id = m.consignment_id
LEFT JOIN used_transport_equipment e ON c.id = e.consignment_id
WHERE 
  -- Identifier matching (normalized: remove dashes, spaces, convert to uppercase)
  UPPER(REPLACE(REPLACE(e.equipment_id, '-', ''), ' ', '')) = UPPER(REPLACE(:identifier, '[^A-Za-z0-9]', ''))
  -- Optional filters
  AND (:modeCode IS NULL OR m.mode_code = :modeCode)
  AND (:dangerousGoodsIndicator IS NULL OR m.dangerous_goods_indicator = :dangerousGoodsIndicator)
  AND (:registrationCountryCode IS NULL OR e.registration_country = :registrationCountryCode)
```

**Query for CARRIED Type Search**:
```sql
SELECT DISTINCT c.*
FROM consignment c
LEFT JOIN main_carriage_transport_movement m ON c.id = m.consignment_id
LEFT JOIN used_transport_equipment e ON c.id = e.consignment_id
LEFT JOIN carried_transport_equipment ct ON e.id = ct.used_transport_equipment_id
WHERE 
  -- Identifier matching (normalized: remove dashes, spaces, convert to uppercase)
  UPPER(REPLACE(REPLACE(ct.equipment_id, '-', ''), ' ', '')) = UPPER(REPLACE(:identifier, '[^A-Za-z0-9]', ''))
  -- Optional filters
  AND (:modeCode IS NULL OR m.mode_code = :modeCode)
  AND (:dangerousGoodsIndicator IS NULL OR m.dangerous_goods_indicator = :dangerousGoodsIndicator)
```

**Important Notes on Identifier Matching**:
- **Normalization**: Both the search identifier and database values are normalized before comparison:
  - All characters are converted to uppercase
  - Dashes (`-`) are removed
  - Spaces are removed
  - Only alphanumeric characters remain
- **Example**: Identifier `"HR-ABC-123"` is normalized to `"HRABC123"` for comparison
- **Case-insensitive**: Search is case-insensitive
- **Flexible matching**: This allows matching identifiers with different formatting (e.g., `"ABC-123"` matches `"ABC123"`)

**Query for UIL Lookup** (used when checking if UIL exists):
```sql
SELECT c.*
FROM consignment c
WHERE c.gate_id = :gate
  AND c.dataset_id = :uuid
  AND c.platform_id = :platform
LIMIT 1
```

**Result Processing**:
- Results from multiple identifier type searches are combined using a `HashSet` to eliminate duplicates
- Each result is a `Consignment` entity containing:
  - `gateId`, `platformId`, `datasetId` (the UIL components)
  - `carrierAcceptanceDatetime`
  - `deliveryEventActualOccurrenceDatetime`
- Results are returned as a list of `ConsignmentDto` objects

#### Step 3: ROI Returns List of Matching Consignments

The ROI search returns a list of all consignments that match the identifier. For each matching consignment, the system returns:

**Data Displayed in User Application**:
- **Gate ID** - Which gate (country) stores this consignment's data
- **Platform ID** - Which platform system has the data
- **Dataset ID** - The unique identifier for this specific consignment
- **Acceptance Date** - When the carrier accepted the consignment (from `carrier_acceptance_datetime`)
- **Delivery Date** - When delivery occurred (from `delivery_event_actual_occurrence_datetime`)

This data is displayed in a table format in the user application, with one row per matching consignment.

#### Step 4: User Selects a Consignment

If multiple consignments match the identifier:
- The user sees a list/table of all matches
- Each row shows the Gate ID, Platform ID, Dataset ID, and dates
- The user **clicks on one row** to select the consignment they want to view

If only one consignment matches:
- The user still needs to click/select it to proceed

#### Step 5: System Creates UIL Request to Platform

Once the user selects a consignment:
- The system extracts the **UIL** (Gate ID, Platform ID, Dataset ID) from the selected consignment
- The system creates a **new UIL query request** using this UIL
- The system applies the **subset_id** that was specified in the original identifier query
- This UIL request is processed exactly like a direct UIL query (see section on UIL queries)

#### Step 6: Platform Returns Full Dataset

The platform receives the UIL request and:
- Reads the full XML dataset for that specific consignment
- Applies filtering based on the subset_id
- Returns the filtered XML data
- The user application displays this data using XSLT transformation (see section on Display)

### Summary of ROI Tables

The ROI consists of these database tables that store identifier mappings:

- **`consignment` table**: Core consignment information and UIL (gate, platform, dataset ID)
- **`main_carriage_transport_movement` table**: Transport movement details and vehicle identifiers (MEANS)
- **`used_transport_equipment` table**: Equipment identifiers (EQUIPMENT)
- **`carried_transport_equipment` table**: Nested equipment identifiers (CARRIED)

**Important Limitation - ROI Implementation**: In the reference implementation, the ROI is implemented as a database table that stores identifier mappings. However, in a production environment, platforms will likely need to search their actual datasets directly rather than relying on a pre-populated registry. This means:
- Platforms will need to implement their own search functionality across their datasets
- Query performance may vary depending on how platforms implement their search
- The ROI approach in the reference implementation is an assumption and may not reflect production reality

### Requesting Data from Platform

Once the system knows which platform has the data:

1. **Gate sends request to platform** - The request includes:
   - The UIL (gate, platform, dataset ID)
   - The subset_id(s) - This is the key filtering parameter

2. **Platform receives the request** - The platform processes the request:

#### Platform Data Retrieval Process

**Step 1: Determine Request Type**
- If request is for **local platform** (same gate): Gate sends REST API request to platform
- If request is for **foreign platform**: Gate sends request via Domibus to foreign gate, which forwards to its platform

**Step 2: Platform Looks Up Dataset**

The platform searches for the dataset in this order:

1. **Database Lookup** (Primary):
   ```sql
   SELECT * FROM consignment_xml 
   WHERE dataset_id = :datasetId
   ```
   - Platform first checks database table `consignment_xml`
   - If found, retrieves XML content from `xml_content` column

2. **File System Lookup** (Fallback):
   - If not found in database, platform tries file system
   - File path: `{cdaPath}/{datasetId}.xml`
   - Example: `/usr/src/myapp/cda/12345678-ab12-4ab6-8999-123456789abc.xml`
   - Platform reads file content as string

**Step 3: Dataset Not Found**

If dataset is not found in either database or file system:
- Platform returns HTTP `404 Not Found` status
- Gate receives error response
- Gate sets request status to `ERROR`
- Error code: `DATA_NOT_FOUND`
- Control status set to `ERROR`
- User receives error when polling

**Step 4: Dataset Found - Apply Filtering**

If dataset is found:
- Platform reads XML content (from database or file)
- Platform parses XML to `SupplyChainConsignment` object using JAXB
- Platform applies subset filtering (see Platform Filtering Logic below)
- Platform serializes filtered XML back to string
- Platform returns filtered XML in response

**Step 5: Response Sent Back**

- **Local platform**: Returns XML directly via REST API response
- **Foreign platform**: Response sent via Domibus back to requesting gate
- Gate receives XML response
- Gate stores XML in database (`request.reponsedata` column as binary)
- Gate updates control status to `COMPLETE`
- Gate updates request status to `SUCCESS`

#### Platform API Endpoint

**GET `/api/gate-api/consignment/{datasetId}?subsetId={subsetId1}&subsetId={subsetId2}`**

- **Authentication**: None (platform API is unauthenticated, but may require headers)
- **Path Parameters**:
  - `datasetId` - The dataset UUID
- **Query Parameters**:
  - `subsetId` - One or more subset IDs (can be repeated)
- **Response Codes**:
  - `200 OK` - Dataset found and filtered successfully
  - `404 Not Found` - Dataset not found
  - `500 Internal Server Error` - Server error (e.g., XML parsing error)
- **Response Body** (200):
  - Content-Type: `application/xml;charset=UTF-8`
  - Body: Filtered XML string (SupplyChainConsignment)
- **Response Body** (404):
  - Empty body
- **Response Body** (500):
  - Error message as string

#### Error Scenarios

**Scenario 1: Dataset File Not Found**
- Platform searches database: Not found
- Platform searches file system: File does not exist
- Platform returns: `404 Not Found`
- Gate receives: Error response
- Gate sets: `status = ERROR`, `errorCode = DATA_NOT_FOUND`
- User sees: Error message in portal

**Scenario 2: XML Parsing Error**
- Platform finds dataset file
- Platform attempts to parse XML
- XML is malformed or invalid
- Platform throws: `TechnicalException`
- Platform returns: `500 Internal Server Error`
- Gate receives: Error response
- Gate sets: `status = ERROR`, `errorCode = PLATFORM_ERROR`
- User sees: Error message in portal

**Scenario 3: Subset Filtering Returns Empty**
- Platform finds dataset
- Platform applies subset filtering
- No fields match the requested subset IDs
- Platform returns: Empty XML or null
- Gate receives: Empty response
- Gate sets: `status = COMPLETE` (but data is empty)
- User sees: Empty document (all fields blank)

**Scenario 4: Platform Timeout**
- Gate sends request to platform
- Platform does not respond within timeout period
- Gate sets: `status = TIMEOUT`
- Control status: `TIMEOUT`
- User sees: Timeout error message

### Platform Filtering Logic

The platform has **hardcoded filtering rules** based on the subset_id. Here's how it works:

1. **XML Schema Definitions**: The system uses XSD schema files (`consignment-common.xsd` and `consignment-identifier.xsd`) that define the structure of transport data. Each field in these schemas has annotations that specify which subset IDs include that field.

2. **Filtering Process**:
   - Platform reads the full XML dataset
   - For each requested subset_id (e.g., "AT07"), the system checks which fields are annotated with that subset ID
   - Only fields that match the requested subset_id(s) are kept in the response
   - Fields not matching are removed from the XML

3. **Example**: If you request subset_id "AT07":
   - Fields annotated with `<subset id="AT07">` in the schema are included
   - Fields without this annotation are filtered out
   - The result is a filtered XML containing only AT07-compliant data

**Important**: The filtering rules are defined in the XSD schema files, not in the application code. To change what data is returned for a specific subset_id, you would need to update the schema annotations.

### XML Schema Used

The platform generates XML using the **consignment-common.xsd** schema. This is the main schema that defines the structure of eFTI consignment data. It includes:

- Consignor (sender) information
- Consignee (receiver) information
- Carrier information
- Transport movement details
- Transport equipment details
- Goods information
- Customs information (if applicable)
- Dangerous goods information (if applicable)

**Important Limitation - Schema Completeness**: The `consignment-common.xsd` schema used in the reference implementation is likely not the complete or final schema for eFTI datasets. This means:
- The schema may not include all possible data fields that exist in production eFTI datasets
- XSD validation may not be fully reliable for all production data
- Additional fields may exist in production datasets that are not defined in this schema
- The final production schema may differ significantly from the reference implementation schema

---

## 5. Response Forwarding

### Data Flow Back to User

Once the platform has filtered the data:

1. **Platform sends filtered XML** back to the gate
2. **Gate stores the response** in the database:
   - Updates the `request` table with the XML data (stored as binary/bytes)
   - Updates the `control` table status to `COMPLETE`
   - Links the response data to the original request

3. **Gate forwards to user application** - When the user checks the request status:
   - Gate retrieves the stored XML from the database
   - Converts it to a format the user application can use
   - Returns it with the request status

### Data Storage

The system stores data in several database tables:

**Main Tables**:
- **`control` table**: Stores the main request information
  - `requestid` - Unique identifier for the request
  - `requesttype` - Type of request (UIL or Identifier)
  - `status` - Current status (PENDING, IN_PROGRESS, COMPLETE, ERROR)
  - `eftidatauuid` - The dataset ID
  - `gateid` - Target gate
  - `platformid` - Target platform
  - `subsetid` - The subset ID(s) requested
  - `authority` - Reference to the authority making the request
  - Timestamps (created, modified)

- **`request` table**: Stores individual request instances
  - Links to `control` table
  - `status` - Request processing status
  - `reponsedata` - The actual XML response data (stored as binary)
  - `gateiddest` - Destination gate for routing
  - Error information (if any)

- **ROI Tables** (Registry of Identifiers): Multiple tables that map identifiers to datasets
  - `consignment` - Core consignment info and UIL (gate, platform, dataset ID)
  - `main_carriage_transport_movement` - Transport movement details and vehicle identifiers (MEANS)
  - `used_transport_equipment` - Equipment identifiers (EQUIPMENT)
  - `carried_transport_equipment` - Nested equipment identifiers (CARRIED)

**Data Format**: The actual consignment data is stored as XML (in binary format in the database). When retrieved, it's converted back to XML text format for the user application.

---

## 6. User Application Display

### XSLT Transformation to HTML

When the user application receives the XML data, it needs to display it in a human-readable format. This is done using XSLT (eXtensible Stylesheet Language Transformations):

1. **XML Data Received**: The user application gets the filtered XML from the gate
2. **XSLT Stylesheet Applied**: The application uses an XSLT file (`eCMR.xslt`) to transform the XML into HTML
3. **HTML Display**: The transformed HTML is shown in the user's browser

### Visual Format

The HTML output follows the **eCMR (electronic Consignment Note for Road transport)** format, which is a standardized visual layout for transport documents. The format includes sections for:

- Sender information
- Receiver information
- Delivery address
- Carrier information
- Transport details
- Goods description
- Weight and volume
- Signatures and stamps

### Handling Missing Data

**Important**: The HTML structure is always the same, regardless of what data is present in the XML. This means:

- **If a field exists in XML**: It appears in the corresponding HTML section
- **If a field is missing** (filtered out by subset_id rules): The HTML section remains, but the field appears empty

**Example**: If the subset_id filtering removed the "consignor" (sender) information:
- The "1. SENDER" section still appears in the HTML
- But all the fields within it (name, address, etc.) are empty
- The visual layout and structure remain consistent

This ensures that users always see the same document format, making it easier to understand and compare different consignments, even when different subset_ids result in different available data.

### Current Limitation: Transport Mode Support

**Important Note**: The current reference implementation only supports the **eCMR format** (for road transport). The system always uses the same XSLT transformation regardless of the transport mode.

**What should happen**:
- Road transport (modeCode=3) → Use eCMR format
- Rail transport (modeCode=2) → Use eCIM (electronic Consignment Note for Rail transport) format
- Other modes → Appropriate format for that mode

**Current behavior**: All consignments are displayed using the eCMR format, even if they are rail, maritime, or air transport. This is a limitation of the reference implementation.

---

## Summary of Data Flow

Here's a simplified overview of the complete flow:

```
1. User logs in → Keycloak validates → Token issued
                    ↓
2. User creates request (UIL or Identifier + subset_id)
                    ↓
3. Request stored in database → requestId returned
                    ↓
4. Request added to RabbitMQ queue → Background processing begins
                    ↓
5a. For UIL queries: Gate uses UIL directly → Proceeds to step 6
                    ↓
5b. For Identifier queries:
    - User enters identifier + type(s) (MEANS/EQUIPMENT/CARRIED)
    - Gate searches ROI database tables:
      * consignment table (UIL info)
      * main_carriage_transport_movement (MEANS search)
      * used_transport_equipment (EQUIPMENT search)
      * carried_transport_equipment (CARRIED search)
    - ROI returns list of matching consignments
    - User sees table with: Gate ID, Platform ID, Dataset ID, Acceptance Date, Delivery Date
                    ↓
5c. User selects one consignment from list → System extracts UIL (gate, platform, dataset ID)
                    ↓
6. Gate determines target (local platform or foreign gate)
                    ↓
7a. If local platform → Direct REST API or Domibus communication
7b. If foreign gate → Domibus secure message exchange
                    ↓
8. Platform/Gate receives request → Reads XML file → Filters based on subset_id
                    ↓
9. Response sent back via Domibus (if foreign) or REST API (if local)
                    ↓
10. Gate stores response in database → Updates status to COMPLETE
                    ↓
11. User checks request status → Gate retrieves XML from database
                    ↓
12. User application applies XSLT → Transforms XML to HTML
                    ↓
13. User views formatted data in browser
```

---

## Key Concepts Summary

### Query Types

- **UIL Query** = Direct request using a known dataset identifier (gate, platform, dataset ID). Returns full dataset immediately.
- **Identifier Query** = Search using transport equipment identifiers. Returns a list of matching consignments first, then user selects one to get the full dataset.

### Subset ID and Country Profiles

- **Subset ID** = A code that represents a specific country's regulation or legal requirement
- **Country Profile** = The set of rules (defined in XSD schemas) that determine which data fields are included for a given subset ID
- **Filtering** = The process of removing fields from XML that don't match the requested subset ID
- **Result** = Different subset IDs return different filtered XML, even from the same source dataset

### Data Storage

- **Platforms** store complete XML files (one file per dataset)
- **Gates** store request metadata and response data in database tables
- **ROI (Registry of Identifiers)** maps transport identifiers to their dataset locations
- **Responses** are stored as binary XML data in the database

### Display

- **XSLT transformation** converts XML to HTML for display
- **Visual format** always follows eCMR layout (standardized transport document format)
- **Missing fields** appear as empty spaces, maintaining consistent document structure
- **Current limitation**: Only eCMR format supported, regardless of transport mode

---

## Limitations and Considerations

1. **Authentication**: Uses Keycloak but not a full IAM system. Some authentication/authorization should ideally be handled by AAP (not fully implemented).

2. **Identifier Support**: Limited to specific identifier types and formats as defined in the schema.

3. **Transport Mode Display**: Only eCMR format is supported. Rail (eCIM), maritime, and air formats are not implemented.

4. **Real-time Updates**: Uses polling rather than push notifications for request status.

5. **Filtering Rules**: Hardcoded in XSD schema files. Changes require schema updates, not just code changes.

6. **Multiple Users**: Requires creating separate Keycloak profiles/realms for different user groups.

7. **ROI Implementation**: The Registry of Identifiers is implemented as a database table in the reference implementation. In production, platforms will likely need to search their actual datasets rather than relying on a pre-populated registry, which may affect query performance and require platform-specific search implementations.

8. **XSD Schema Completeness**: The `consignment-common.xsd` schema used is likely not the complete or final schema for eFTI datasets. This means XSD validation may not be fully reliable, and the schema may not include all possible data fields that exist in production eFTI datasets.

---

## Conclusion

The eFTI reference implementation provides a working example of how transport consignment data can be requested, filtered based on legal requirements (subset IDs), and displayed to authorized users. The system demonstrates the core concepts of decentralized data access, role-based filtering, and standardized document presentation, while acknowledging certain limitations that would need to be addressed in a production environment.

