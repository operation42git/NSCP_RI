# eFTI Reference Implementation - Test Flow Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [UIL Query Flow](#uil-query-flow)
5. [Identifier Search Flow](#identifier-search-flow)
6. [Database Schema](#database-schema)
7. [Multi-Gate Setup Guide](#multi-gate-setup-guide)
8. [Test Scenarios](#test-scenarios)
9. [Limitations & Gap Analysis](#limitations--gap-analysis)

---

## Overview

The eFTI Reference Implementation demonstrates a decentralized architecture where:
- **Gates** act as national access points for competent authorities
- **Platforms** store eFTI datasets and identifiers
- **Authorities** (road controllers) query data using UIL or identifiers
- **Communication** between gates uses eDelivery (AS4/Domibus)
- **Communication** between gate and platform uses REST API or eDelivery

### Current Reference Setup
The reference implementation includes 3 fictional countries with gates and platforms:

| Country | Gate ID | Platform ID | Platform Name | Communication |
|---------|---------|-------------|---------------|---------------|
| Borduria (BO) | `borduria` | `acme` | ACME | REST API |
| Syldavia (SY) | `syldavia` | `massivedynamic` | Massive Dynamic | eDelivery |
| Listenbourg (LI) | `listenbourg` | `umbrellacorporation` | Umbrella Corporation | eDelivery |

---

## Architecture

### Component Overview

```
┌─────────────────┐
│   Authority     │ (Road Controller)
│  (Portal/API)   │
└────────┬────────┘
         │ REST API (OAuth2/JWT)
         │
┌────────▼────────┐
│      Gate       │
│  - REST API     │
│  - eDelivery    │
│  - RabbitMQ     │
│  - PostgreSQL   │
└────┬────────┬───┘
     │        │
     │        └──────────────┐
     │ REST/eDelivery        │ eDelivery (AS4)
     │                       │
┌────▼────────┐      ┌──────▼──────┐
│  Platform   │      │ Foreign Gate│
│  - Datasets │      │             │
│  - Identifiers│    └─────────────┘
└─────────────┘
```

### Communication Patterns

1. **Authority → Gate**: Asynchronous REST (polling pattern)
   - POST request returns `requestId`
   - GET request with `requestId` retrieves result

2. **Gate → Platform**: Synchronous REST or Asynchronous eDelivery
   - Configured per platform in gate configuration

3. **Gate → Gate**: Asynchronous eDelivery (AS4 via Domibus)
   - XML messages over AS4 protocol

4. **Internal Gate Processing**: RabbitMQ queues
   - `efti.receive-messages.q` - incoming eDelivery messages
   - `efti.send-messages.q` - outgoing messages

---

## Authentication Flow

### 1. Keycloak OAuth2 Authentication

**Endpoint**: `POST /realms/{realm}/protocol/openid-connect/token`

**Request Parameters**:
```
username: user_bo / user_sy / user_li
password: Azerty59*123
grant_type: password
client_id: gate
client_secret: {realm-specific-secret}
```

**Response**:
```json
{
  "access_token": "eyJhbGc...",
  "expires_in": 600,
  "refresh_expires_in": 900,
  "token_type": "Bearer"
}
```

### 2. Keycloak Configuration

Each gate has its own Keycloak realm:
- **Realm**: `eFTI_BO`, `eFTI_SY`, `eFTI_LI`
- **Client**: `gate` (confidential client)
- **Users**: Pre-configured with role `ROAD_CONTROLER`

**Keycloak Realms**:
| Realm | URL | User | Password | Role |
|-------|-----|------|----------|------|
| eFTI_BO | http://auth.gate.borduria.eu:8180 | user_bo | Azerty59*123 | ROAD_CONTROLER |
| eFTI_SY | http://auth.gate.syldavia.eu:8280 | user_sy | Azerty59*123 | ROAD_CONTROLER |
| eFTI_LI | http://auth.gate.listenbourg.eu:8380 | user_li | Azerty59*123 | ROAD_CONTROLER |

### 3. JWT Token Validation

The gate validates JWT tokens using:
- **KeycloakResourceRolesConverter**: Extracts roles from JWT
  - Reads `realm_access.roles` and `resource_access.{client}.roles`
  - Adds `ROLE_` prefix to each role
- **JwtAuthenticationConverter**: Sets principal from `preferred_username` claim

### 4. Authorization

**Roles**:
- `ROLE_ROAD_CONTROLER` - Road authority (can query UIL and identifiers)
- `ROLE_EXT_AAP` - External AAP interface (certificate-based auth)
- `ROLE_PLATFORM` - Platform systems (for REST API)

**Protected Endpoints**:
```java
@Secured(Roles.ROLE_ROAD_CONTROLER)
POST /v1/control/uil
GET /v1/control/uil

@Secured(Roles.ROLE_EXT_AAP)
POST /v1/aap/control/uil
GET /v1/aap/control/uil
```

### 5. Database Tables Checked

**Authentication does NOT check database tables** - it's purely Keycloak-based:
1. Client sends credentials to Keycloak
2. Keycloak validates against its internal user database
3. Keycloak returns JWT token
4. Gate validates JWT signature and extracts roles
5. Spring Security authorizes based on roles

---

## UIL Query Flow

### 1. POST UIL Query

**Endpoint**: `POST /v1/control/uil`

**Authentication**: Bearer token (JWT from Keycloak)

**Request Body**:
```json
{
  "gateId": "borduria",
  "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
  "platformId": "acme",
  "subsetId": "full"
}
```

**Response** (202 Accepted):
```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### 2. Internal Processing Flow

#### Step 1: Request Creation (Gate)
1. **Controller** (`ControlController.requestUil`)
   - Validates request
   - Extracts authority info from JWT
   
2. **Service** (`ControlService.createUilControl`)
   - Creates `ControlEntity` with status `PENDING`
   - Generates unique `requestId` (UUID)
   - Stores in database

**Database Tables Updated**:
```sql
-- Table: control
INSERT INTO control (
  requestid,        -- UUID
  requesttype,      -- 'LOCAL_UIL_SEARCH' or 'EXTERNAL_UIL_SEARCH'
  status,           -- 'PENDING'
  eftidatauuid,     -- datasetId
  gateid,           -- target gate
  platformid,       -- target platform
  subsetid,         -- 'full' or specific subset
  authority,        -- authority_id (FK)
  createddate,
  lastmodifieddate
) VALUES (...);

-- Table: request (UIL type)
INSERT INTO request (
  control,          -- FK to control.id
  status,           -- 'RECEIVED'
  request_type,     -- 'UIL'
  gateiddest,       -- destination gate
  createddate
) VALUES (...);
```

#### Step 2: Message Routing (RabbitMQ)
3. **RabbitMQ** - Message published to `efti.send-messages.q`
   ```json
   {
     "control": {...},
     "gateIdDest": "borduria",
     "platformId": "acme"
   }
   ```

4. **RabbitListenerService.listenSendMessage**
   - Determines target: PLATFORM or GATE
   - Routes to appropriate integration service

#### Step 3a: Local Platform Request (Same Gate)
5. **PlatformIntegrationService.handle**
   - Checks if platform uses REST API or eDelivery
   
6a. **REST API Path** (`PlatformRestService`)
   - Sends synchronous REST request to platform
   - Platform reads XML file from disk
   - Returns `SupplyChainConsignment` XML
   
6b. **eDelivery Path** (`DomibusIntegrationService`)
   - Builds `UILQuery` XML message
   - Sends via Domibus AS4
   - Platform receives via eDelivery, processes, responds

#### Step 3b: Foreign Gate Request
5. **GateIntegrationService.handle**
   - Builds `UILQuery` XML message
   - Sends via Domibus to foreign gate
   
6. **Foreign Gate** receives message
   - Creates new control with type `EXTERNAL_ASK_UIL_SEARCH`
   - Routes to its local platform
   - Receives response
   - Sends `UILResponse` back via eDelivery

#### Step 4: Response Handling
7. **UilRequestService.manageResponseReceived**
   - Parses `UILResponse` XML
   - Validates against XSD schema
   - Extracts consignment data

8. **Database Update**:
   ```sql
   -- Update request with response data
   UPDATE request
   SET status = 'SUCCESS',
       reponsedata = <consignment_xml_bytes>,
       lastmodifieddate = NOW()
   WHERE control = <control_id>;
   
   -- Update control status
   UPDATE control
   SET status = 'COMPLETE',
       lastmodifieddate = NOW()
   WHERE id = <control_id>;
   ```

### 3. GET UIL Query Result

**Endpoint**: `GET /v1/control/uil?requestId={requestId}`

**Authentication**: Bearer token

**Response** (200 OK):
```json
{
  "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "COMPLETE",
  "consignment": {
    // SupplyChainConsignment XML data
  }
}
```

**Status Values**:
- `PENDING` - Request created, not yet processed
- `IN_PROGRESS` - Being processed
- `SUCCESS` - Response received from platform
- `COMPLETE` - Final status, data available
- `ERROR` - Error occurred

### 4. UIL Structure

**UIL (Unique Identifier Locator)**:
```
UIL = gateId + platformId + datasetId
```

Example:
```
Gate: borduria
Platform: acme
Dataset: 12345678-ab12-4ab6-8999-123456789abc
```

### 5. Platform Data Storage

**Platform Simulator** stores datasets as XML files:
- **Location**: `/usr/src/myapp/files/` (in container)
- **Naming**: `{datasetId}.xml`
- **Format**: SupplyChainConsignment XML (consignment-common.xsd)

When UIL query received:
1. Platform extracts `datasetId` from UIL
2. Reads file: `files/{datasetId}.xml`
3. Parses XML to `SupplyChainConsignment` object
4. Filters by `subsetId` (if not "full")
5. Serializes to XML and sends in `UILResponse`

**Special Behavior**:
- If `datasetId` ends with "1" → Platform doesn't respond (timeout simulation)
- Random bad requests based on `bad-request-percentage` config

---

## Identifier Search Flow

### 1. POST Identifier Search

**Endpoint**: `POST /v1/control/identifiers`

**Request Body**:
```json
{
  "identifier": "ABC123",
  "identifierType": ["MEANS", "EQUIPMENT", "CARRIED"],
  "modeCode": 3,
  "dangerousGoodsIndicator": false,
  "registrationCountryCode": "HR"
}
```

**Response** (202 Accepted):
```json
{
  "requestId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

### 2. Identifier Database Schema

**Table: consignment** (identifiers database)
```sql
CREATE TABLE consignment (
  id                                        BIGINT PRIMARY KEY,
  gate_id                                   TEXT NOT NULL,
  platform_id                               TEXT NOT NULL,
  dataset_id                                TEXT NOT NULL,
  carrier_acceptance_datetime               TIMESTAMPTZ,
  delivery_event_actual_occurrence_datetime TIMESTAMPTZ,
  UNIQUE(gate_id, platform_id, dataset_id)  -- UIL uniqueness
);
```

**Table: main_carriage_transport_movement**
```sql
CREATE TABLE main_carriage_transport_movement (
  id                                        BIGINT PRIMARY KEY,
  consignment_id                            BIGINT REFERENCES consignment(id),
  mode_code                                 SMALLINT NOT NULL,  -- Transport mode
  dangerous_goods_indicator                 BOOLEAN,
  used_transport_means_id                   TEXT,               -- Vehicle ID
  used_transport_means_registration_country TEXT                -- Country code
);
```

**Table: used_transport_equipment**
```sql
CREATE TABLE used_transport_equipment (
  id                   BIGINT PRIMARY KEY,
  consignment_id       BIGINT REFERENCES consignment(id),
  sequence_number      INT NOT NULL,
  equipment_id         TEXT,               -- Container/trailer ID
  id_scheme_agency_id  TEXT,
  registration_country TEXT
);
```

**Table: carried_transport_equipment**
```sql
CREATE TABLE carried_transport_equipment (
  id                          BIGINT PRIMARY KEY,
  sequence_number             INT NOT NULL,
  equipment_id                TEXT,
  id_scheme_agency_id         TEXT,
  used_transport_equipment_id BIGINT REFERENCES used_transport_equipment(id)
);
```

### 3. Search Processing

1. **Local Search** - Gate queries its own identifier database
2. **Broadcast** - Gate sends `IdentifierQuery` to all connected gates
3. **Consolidation** - Gate collects responses and merges results
4. **Response** - Returns list of matching UILs

**Search Types**:
- **MEANS** - Search by vehicle ID (`used_transport_means_id`)
- **EQUIPMENT** - Search by equipment ID (`equipment_id` in `used_transport_equipment`)
- **CARRIED** - Search by carried equipment ID (`equipment_id` in `carried_transport_equipment`)

---

## Database Schema

### Gate Database (PostgreSQL)

**Main Tables**:

1. **control** - Control records for all requests
   - `id` (PK)
   - `requestid` (UUID) - Unique request identifier
   - `requesttype` - Type of request (LOCAL_UIL_SEARCH, EXTERNAL_UIL_SEARCH, etc.)
   - `status` - Current status (PENDING, IN_PROGRESS, COMPLETE, ERROR)
   - `eftidatauuid` - Dataset ID
   - `gateid` - Target gate ID
   - `platformid` - Target platform ID
   - `subsetid` - Requested subset
   - `authority` (FK) - Requesting authority
   - `error` (FK) - Error details if failed

2. **request** - Request tracking (polymorphic)
   - `id` (PK)
   - `control` (FK) - Parent control
   - `status` - Request status
   - `request_type` - Discriminator (UIL, IDENTIFIER)
   - `edeliverymessageid` - Domibus message ID
   - `reponsedata` (BYTEA) - Response XML (for UIL)
   - `identifiers` (JSONB) - Identifier results (for IDENTIFIER)
   - `gateiddest` - Destination gate
   - `retry` - Retry counter
   - `nextretrydate` - Next retry timestamp

3. **authority** - Authority information
   - `id` (PK)
   - `name` - Authority name
   - `country` - Country code
   - `nationaluniqueidentifier` - National ID
   - `isemergencyservice` - Emergency flag
   - `legalcontact` (FK) - Legal contact info
   - `workingcontact` (FK) - Working contact info

4. **error** - Error tracking
   - `id` (PK)
   - `errorcode` - Error code
   - `errordescription` - Error description

5. **gate** - Known gates registry
   - `id` (PK)
   - `gateid` - Gate identifier
   - `country` - Country code

### Identifiers Database (PostgreSQL)

Separate database for identifier registry (see [Identifier Search Flow](#identifier-search-flow) for schema).

### Domibus Database (MariaDB)

Domibus uses its own database for AS4 messaging:
- Message tracking
- Party management
- PModes (Processing Modes)
- User authentication

---

## Multi-Gate Setup Guide

### Prerequisites

1. **Docker & Docker Compose**
2. **Network**: Create shared network
   ```bash
   docker network create efti-network
   ```
3. **Host file entries**:
   ```
   127.0.0.1 auth.gate.borduria.eu
   127.0.0.1 auth.gate.syldavia.eu
   127.0.0.1 auth.gate.listenbourg.eu
   127.0.0.1 auth.gate.croatia.eu     # For HR gate
   127.0.0.1 auth.gate.slovenia.eu    # For SLO gate
   127.0.0.1 auth.gate.austria.eu     # For AT gate
   ```

### Current 3-Gate Setup (Reference)

**Deploy Script**: `deploy/local/efti-gate/deploy.sh`

**Containers**:
1. `rabbitmq` - Message broker
2. `keycloak` - Authentication
3. `psql` - Gate databases
4. `psql-meta` - Identifier databases
5. `efti-gate-BO` - Borduria gate (port 8880)
6. `efti-gate-LI` - Listenbourg gate (port 8881)
7. `efti-gate-SY` - Syldavia gate (port 8882)
8. `platform-ACME` - Borduria platform (port 8070)
9. `platform-UMBRELLA` - Listenbourg platform (port 8072)
10. `platform-MASSIVE` - Syldavia platform (port 8071)

### Adding New Gate (e.g., Croatia - HR)

#### 1. Keycloak Configuration

Create new realm export: `deploy/local/efti-gate/keycloak/hr-export.json`

```json
{
  "realm": "eFTI_HR",
  "enabled": true,
  "roles": {
    "realm": [
      {
        "name": "ROAD_CONTROLER"
      }
    ]
  },
  "users": [
    {
      "username": "user_hr",
      "enabled": true,
      "credentials": [
        {
          "type": "password",
          "value": "Azerty59*123"
        }
      ],
      "realmRoles": ["ROAD_CONTROLER"]
    }
  ]
}
```

#### 2. Gate Configuration

Create environment file: `deploy/local/efti-gate/gate/ENV/HR.env`

```bash
PROFILE=HR
PORT=8883
```

Create application config: `deploy/local/efti-gate/gate/application-HR.yml`

```yaml
server:
  port: ${PORT:8883}

gate:
  owner: croatia
  country: HR
  platforms:
    - platformId: platform-hr
      restApiBaseUrl: http://platform-HR:8073/api/gate-api

spring:
  datasource:
    url: jdbc:postgresql://psql:5432/efti_hr
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://auth.gate.croatia.eu:8480/realms/eFTI_HR

identifiers:
  datasource:
    url: jdbc:postgresql://psql-meta:5433/efti_identifiers_hr
```

#### 3. Database Setup

Create SQL files:
- `deploy/local/efti-gate/sql/5-create_tables_HR.sql`
  ```sql
  CREATE DATABASE efti_hr;
  CREATE DATABASE efti_identifiers_hr;
  ```

#### 4. Docker Compose

Add to `docker-compose.yml`:

```yaml
services:
  efti-gate-HR:
    env_file:
      - ./gate/ENV/HR.env
    image: openjdk:17
    depends_on:
      - keycloak
      - psql
    volumes:
      - ./gate:/usr/src/myapp
    working_dir: /usr/src/myapp
    command: java -jar -Dspring.profiles.active=${PROFILE} efti-gate.jar
    ports:
      - "8883:8883"
      - "8893:5005"
    networks:
      - efti

  platform-HR:
    image: openjdk:17
    depends_on:
      - keycloak
      - psql
    volumes:
      - ./platform:/usr/src/myapp
    working_dir: /usr/src/myapp
    command: java -jar -Dspring.profiles.active=HR platform-simulator.jar --port=8073
    ports:
      - "8073:8073"
    networks:
      - efti
```

#### 5. Platform Configuration

Create: `deploy/local/efti-gate/platform/application-HR.yml`

```yaml
server:
  port: 8073

gate:
  owner: platform-hr
  gate: croatia
  restApiBaseUrl: http://efti-gate-HR:8883/api/platform
  cdaPath: /usr/src/myapp/files/

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://auth.gate.croatia.eu:8480/realms/eFTI_HR
```

#### 6. Domibus Setup (Optional - for eDelivery)

If using eDelivery between gates:

1. Create Domibus instance for HR
2. Configure PMode files
3. Register parties in Domibus
4. Update gate configuration with Domibus URL

---

## Test Scenarios

### Scenario 1: Single Gate UIL Query (Local)

**Objective**: Test local UIL query within one gate

**Setup**:
- Gate: Borduria (BO)
- Platform: ACME
- Dataset: Pre-loaded XML file

**Steps**:
1. Authenticate with Keycloak (user_bo)
2. POST UIL query to Borduria gate
   ```json
   {
     "gateId": "borduria",
     "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
     "platformId": "acme",
     "subsetId": "full"
   }
   ```
3. Receive requestId
4. Poll GET endpoint with requestId
5. Verify response contains consignment data

**Expected Result**: Status COMPLETE with XML consignment data

### Scenario 2: Cross-Gate UIL Query

**Objective**: Test UIL query across gates via eDelivery

**Setup**:
- Requesting Gate: Borduria (BO)
- Target Gate: Syldavia (SY)
- Platform: Massive Dynamic
- Dataset: Pre-loaded on Syldavia platform

**Steps**:
1. Authenticate with Borduria Keycloak
2. POST UIL query to Borduria gate with Syldavia UIL
   ```json
   {
     "gateId": "syldavia",
     "datasetId": "87654321-ba21-6ba4-9888-987654321cba",
     "platformId": "massivedynamic",
     "subsetId": "full"
   }
   ```
3. Borduria gate sends eDelivery message to Syldavia
4. Syldavia queries its platform
5. Syldavia responds via eDelivery
6. Poll Borduria GET endpoint
7. Verify response

**Expected Result**: Status COMPLETE with XML consignment data from Syldavia

### Scenario 3: Identifier Search (Multi-Gate)

**Objective**: Search for transport means across multiple gates

**Setup**:
- Requesting Gate: Borduria
- Identifier: Vehicle registration "ABC123"
- Expected matches: In Borduria, Syldavia, and Listenbourg

**Steps**:
1. Upload identifiers to all platforms
2. Authenticate with Borduria
3. POST identifier search
   ```json
   {
     "identifier": "ABC123",
     "identifierType": ["MEANS"],
     "modeCode": 3,
     "registrationCountryCode": "HR"
   }
   ```
4. Borduria searches locally and broadcasts to other gates
5. Poll GET endpoint
6. Verify consolidated results

**Expected Result**: List of UILs from all gates where identifier found

### Scenario 4: Multi-Country Setup (HR, SLO, AT)

**Objective**: Demonstrate 3 new countries with 4 users and 4 datasets

**Setup**:
| Gate | Platform | User | Role | Datasets |
|------|----------|------|------|----------|
| Croatia (HR) | platform-hr | user_hr | ROAD_CONTROLER | dataset-hr-001, dataset-hr-002 |
| Slovenia (SLO) | platform-slo | user_slo | ROAD_CONTROLER | dataset-slo-001 |
| Austria (AT) | platform-at | user_at | ROAD_CONTROLER | dataset-at-001 |
| Austria (AT) | platform-at | inspector_at | ROAD_CONTROLER | (same datasets) |

**Test Cases**:
1. **HR user queries HR dataset** (local)
2. **HR user queries SLO dataset** (cross-border)
3. **AT user queries HR dataset** (cross-border)
4. **Inspector_AT queries all datasets** (identifier search)

**Datasets**:
- `dataset-hr-001.xml` - Croatian truck transport
- `dataset-hr-002.xml` - Croatian container transport
- `dataset-slo-001.xml` - Slovenian rail transport
- `dataset-at-001.xml` - Austrian multimodal transport

---

## Limitations & Gap Analysis

### Current Limitations

#### 1. **Scalability**
- **Issue**: All components in single Docker Compose
- **Impact**: Not production-ready, limited to development/testing
- **Gap**: Need Kubernetes deployment with horizontal scaling

#### 2. **Authentication**
- **Issue**: Shared password for all users, no MFA
- **Impact**: Not secure for production
- **Gap**: Need proper user management, MFA, certificate-based auth

#### 3. **Data Persistence**
- **Issue**: Datasets stored as XML files on disk
- **Impact**: No database backing, limited query capabilities
- **Gap**: Need proper database storage with indexing

#### 4. **Identifier Registry**
- **Issue**: Manual upload of identifiers required
- **Impact**: No automatic synchronization
- **Gap**: Need automatic identifier extraction from datasets

#### 5. **Error Handling**
- **Issue**: Limited retry logic, manual intervention needed
- **Impact**: Failed requests may be lost
- **Gap**: Need robust retry mechanism, dead letter queues

#### 6. **Monitoring**
- **Issue**: No centralized logging or monitoring
- **Impact**: Difficult to troubleshoot issues
- **Gap**: Need ELK stack, Prometheus, Grafana

#### 7. **eDelivery Configuration**
- **Issue**: Complex Domibus setup, manual PMode configuration
- **Impact**: Difficult to add new gates
- **Gap**: Need automated PMode generation and party registration

#### 8. **Subset Support**
- **Issue**: Limited subset filtering implementation
- **Impact**: Always returns full dataset
- **Gap**: Need proper XPath-based subset extraction

#### 9. **Validation**
- **Issue**: Basic XSD validation only
- **Impact**: Invalid data may be stored
- **Gap**: Need business rule validation, semantic checks

#### 10. **Certificate Management**
- **Issue**: Test certificates, no rotation
- **Impact**: Security risk
- **Gap**: Need proper PKI, certificate lifecycle management

### Production Readiness Gaps

| Feature | Current State | Production Need | Priority |
|---------|---------------|-----------------|----------|
| High Availability | Single instance | Multi-instance with load balancer | HIGH |
| Database | PostgreSQL (single) | Clustered PostgreSQL or managed DB | HIGH |
| Message Queue | RabbitMQ (single) | RabbitMQ cluster or managed service | HIGH |
| Secrets Management | Plain text in config | Vault or K8s secrets | HIGH |
| API Rate Limiting | None | Rate limiting per user/authority | MEDIUM |
| Audit Logging | Basic | Comprehensive audit trail | HIGH |
| Data Retention | Indefinite | Configurable retention policies | MEDIUM |
| Backup/Recovery | None | Automated backup and disaster recovery | HIGH |
| Performance Testing | None | Load testing, stress testing | MEDIUM |
| Security Scanning | None | Vulnerability scanning, penetration testing | HIGH |

### Recommendations for Working Pilot

#### Phase 1: Core Functionality (3 Gates)
1. Deploy HR, SLO, AT gates using reference implementation
2. Create 4 users with ROAD_CONTROLER role
3. Prepare 4 test datasets (2 HR, 1 SLO, 1 AT)
4. Test local and cross-border UIL queries
5. Test identifier search across all gates

#### Phase 2: Domibus Integration
1. Set up Domibus for each gate
2. Configure PModes for inter-gate communication
3. Test eDelivery message exchange
4. Verify AS4 conformance

#### Phase 3: Monitoring & Operations
1. Deploy ELK stack for logging
2. Set up Prometheus + Grafana for metrics
3. Create operational runbooks
4. Establish support procedures

#### Phase 4: Security Hardening
1. Implement proper certificate management
2. Enable TLS for all communications
3. Conduct security audit
4. Implement rate limiting and DDoS protection

### Gap Analysis Summary

**For a working pilot with 3 gates (HR, SLO, AT)**:

✅ **Sufficient**:
- Basic UIL query functionality
- Cross-border communication
- Identifier search
- Authentication with Keycloak
- Database schema

⚠️ **Needs Improvement**:
- Error handling and retry logic
- Monitoring and logging
- Data validation
- Performance optimization

❌ **Critical Gaps**:
- Production-grade deployment (Kubernetes)
- High availability and failover
- Comprehensive security (certificates, secrets)
- Operational procedures and runbooks
- Disaster recovery

**Recommendation**: The current implementation is suitable for a **proof-of-concept pilot** but requires significant enhancements for production deployment.

---

## Appendix

### A. API Endpoints Summary

#### Authority Endpoints (Keycloak OAuth2)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/v1/control/uil` | Bearer | Submit UIL query |
| GET | `/v1/control/uil?requestId={id}` | Bearer | Get UIL query result |
| POST | `/v1/control/identifiers` | Bearer | Submit identifier search |
| GET | `/v1/control/identifiers?requestId={id}` | Bearer | Get identifier search result |

#### Platform Endpoints (Certificate or Mock Auth)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/platform/v0/whoami` | Cert/Mock | Get platform identity |
| PUT | `/api/platform/v0/consignments/{datasetId}` | Cert/Mock | Upload identifiers |

### B. Environment Variables

**Gate Configuration**:
```bash
PROFILE=BO|LI|SY|HR|SLO|AT
PORT=8880|8881|8882|8883|8884|8885
```

**Database URLs**:
```
jdbc:postgresql://psql:5432/efti_{gate}
jdbc:postgresql://psql-meta:5433/efti_identifiers_{gate}
```

**Keycloak URLs**:
```
http://auth.gate.{country}.eu:{port}/realms/eFTI_{GATE}
```

### C. Docker Network

All services must be on `efti-network`:
```bash
docker network create efti-network
```

### D. Useful Commands

**View logs**:
```bash
docker logs efti-gate-BO -f
docker logs platform-ACME -f
```

**Access database**:
```bash
docker exec -it psql psql -U efti -d efti_bo
```

**Check RabbitMQ**:
```
http://localhost:5672
User: guest / guest
```

**Check Keycloak**:
```
http://localhost:8180
User: admin / admin
```

---

## Conclusion

This documentation provides a comprehensive overview of the eFTI reference implementation test flow. For a working pilot with 3 gates (HR, SLO, AT), follow the [Multi-Gate Setup Guide](#multi-gate-setup-guide) and implement the [Test Scenarios](#test-scenarios).

The current implementation is suitable for development and testing but requires significant enhancements for production deployment as outlined in the [Limitations & Gap Analysis](#limitations--gap-analysis) section.

