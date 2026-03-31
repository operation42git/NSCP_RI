# Croatia Pilot Testing Guide

## Quick Reference

### Ports (Same as Before)

| Service | Port | URL |
|---------|------|-----|
| **Croatia Gate (HR)** | 8880 | `http://localhost:8880` |
| **Austria Gate (AT)** | 8881 | `http://localhost:8881` |
| **Slovenia Gate (SLO)** | 8882 | `http://localhost:8882` |
| **Keycloak** | 8080 | `http://localhost:8080` |
| **Platform ACME (Croatia)** | 8070 | `http://localhost:8070` |
| **Platform MASSIVE (Slovenia)** | 8071 | `http://localhost:8071` |
| **Platform UMBRELLA (Austria)** | 8072 | `http://localhost:8072` |
| **PostgreSQL** | 9001 | `localhost:9001` |
| **RabbitMQ Management** | 15672 | `http://localhost:15672` |

**Note**: Ports remain the same as the original setup. Only the gate names and configurations changed.

---

## User Credentials

### Croatia (HR)

- **Username**: `user_hr`
- **Password**: `Azerty59*123`
- **Realm**: `eFTI_HR`
- **Role**: `ROAD_CONTROLER`
- **Keycloak URL**: `http://auth.gate.croatia.eu:8080/realms/eFTI_HR`

### Slovenia (SLO)

- **Username**: `user_slo`
- **Password**: `Azerty59*123`
- **Realm**: `eFTI_SLO`
- **Role**: `ROAD_CONTROLER`
- **Keycloak URL**: `http://auth.gate.slovenia.eu:8080/realms/eFTI_SLO`

### Austria (AT)

- **Username**: `user_at`
- **Password**: `Azerty59*123`
- **Realm**: `eFTI_AT`
- **Role**: `ROAD_CONTROLER`
- **Keycloak URL**: `http://auth.gate.austria.eu:8080/realms/eFTI_AT`

---

## Test Data

### Available Dataset IDs

The existing test data file is available:

- **Dataset ID**: `12345678-ab12-4ab6-8999-123456789abc`
- **Location**: `deploy/local/efti-gate/platform/cda/12345678-ab12-4ab6-8999-123456789abc.xml`
- **Platform**: `croatia eFTI platform` (Croatia)
- **Gate ID**: `croatia`

### Test Data for UIL Query

**Croatia Gate (HR)** - Local Query:
```json
{
    "gateId": "croatia",
    "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
    "platformId": "croatia eFTI platform",
    "subsetId": "full"
}
```

**Slovenia Gate (SLO)** - Local Query:
```json
{
    "gateId": "slovenia",
    "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
    "platformId": "slovenia eFTI platform",
    "subsetId": "full"
}
```

**Austria Gate (AT)** - Local Query:
```json
{
    "gateId": "austria",
    "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
    "platformId": "austria eFTI platform",
    "subsetId": "full"
}
```

### Test Data for Identifier Query

**Example 1: Vehicle Registration Search**
```json
{
    "modeCode": "3",
    "identifier": "HR-ABC-123",
    "identifierType": ["MEANS"],
    "registrationCountryCode": "HR",
    "dangerousGoodsIndicator": false,
    "eftiGateIndicator": ["HR", "SLO", "AT"]
}
```

**Example 2: Container Search**
```json
{
    "modeCode": "1",
    "identifier": "ABCD1234567",
    "identifierType": ["EQUIPMENT"],
    "registrationCountryCode": "HR",
    "dangerousGoodsIndicator": false,
    "eftiGateIndicator": ["HR", "SLO"]
}
```

**Example 3: Dangerous Goods Search**
```json
{
    "modeCode": "3",
    "identifier": "54321",
    "identifierType": ["EQUIPMENT"],
    "registrationCountryCode": "FR",
    "dangerousGoodsIndicator": true,
    "eftiGateIndicator": ["HR", "SLO", "AT"]
}
```

---

## Testing Steps

### Step 1: Start the System

```bash
cd deploy/local/efti-gate
docker-compose up -d
```

Wait for all services to start (30-60 seconds).

### Step 2: Verify Services

Check that all containers are running:
```bash
docker-compose ps
```

You should see:
- `efti-gate-HR` (port 8880)
- `efti-gate-SLO` (port 8882)
- `efti-gate-AT` (port 8881)
- `keycloak` (port 8080)
- `platform-ACME`, `platform-MASSIVE`, `platform-UMBRELLA`
- `psql`, `psql-meta`, `rabbitmq`

### Step 3: Test Authentication (Postman)

1. **Import Postman Collection**:
   - File: `utils/eFTI.postman_collection.json`
   - Environment: `utils/Docker.postman_environment.json`

2. **Test Croatia Authentication**:
   - Folder: `HR > Gate > Authentication HR`
   - Click "Send"
   - Should return `access_token` in response

3. **Test Other Gates**:
   - Repeat for `SLO > Gate > Authentication SLO`
   - Repeat for `AT > Gate > Authentication AT`

### Step 4: Test UIL Query

1. **Authenticate first** (use Authentication request)

2. **POST UIL Control** (Croatia):
   - Folder: `HR > Gate > POST UIL Control`
   - Body:
     ```json
     {
         "gateId": "croatia",
         "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
         "platformId": "croatia eFTI platform",
         "subsetId": "full"
     }
     ```
   - Click "Send"
   - Should return `requestId` and `status: "PENDING"`

3. **GET UIL Control** (Check Status):
   - Folder: `HR > Gate > GET UIL Control`
   - Query param: `requestId` (from previous response)
   - Click "Send"
   - Poll until `status: "COMPLETE"`
   - Response should contain consignment XML data

### Step 5: Test Identifier Query

1. **POST Identifier Control**:
   - Folder: `HR > Gate > POST Identifier Control`
   - Body:
     ```json
     {
         "modeCode": "3",
         "identifier": "54321",
         "identifierType": ["EQUIPMENT"],
         "registrationCountryCode": "FR",
         "dangerousGoodsIndicator": false,
         "eftiGateIndicator": ["HR", "SLO"]
     }
     ```
   - Click "Send"
   - Should return `requestId`

2. **GET Identifier Control**:
   - Folder: `HR > Gate > GET Identifier Control`
   - Query param: `requestId`
   - Poll until complete
   - Should return list of matching UILs

### Step 6: Test Cross-Gate Communication

1. **Query Slovenia from Croatia**:
   - Use Croatia authentication
   - POST UIL Control with:
     ```json
     {
         "gateId": "slovenia",
         "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
         "platformId": "slovenia eFTI platform",
         "subsetId": "full"
     }
     ```
   - This should trigger eDelivery communication between gates

---

## Using cURL (Alternative to Postman)

### 1. Get Access Token (Croatia)

```bash
curl -X POST "http://auth.gate.croatia.eu:8080/realms/eFTI_HR/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user_hr" \
  -d "password=Azerty59*123" \
  -d "grant_type=password" \
  -d "client_id=gate" \
  -d "client_secret=4ce0hW2Zqjxa7FR4hz1OshuHwSPGWFGO"
```

Save the `access_token` from the response.

### 2. POST UIL Query

```bash
curl -X POST "http://localhost:8880/v1/control/uil" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gateId": "croatia",
    "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
    "platformId": "croatia eFTI platform",
    "subsetId": "full"
  }'
```

### 3. GET UIL Status

```bash
curl -X GET "http://localhost:8880/v1/control/uil?requestId=YOUR_REQUEST_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Expected Responses

### Authentication Response
```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJ...",
    "expires_in": 600,
    "refresh_expires_in": 1800,
    "token_type": "Bearer",
    "scope": "profile email"
}
```

### UIL Query Response (PENDING)
```json
{
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "PENDING"
}
```

### UIL Query Response (COMPLETE)
```json
{
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "COMPLETE",
    "consignment": {
        // XML consignment data
    }
}
```

### Identifier Query Response
```json
{
    "requestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "COMPLETE",
    "identifiers": [
        {
            "gateId": "croatia",
            "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
            "platformId": "croatia eFTI platform",
            "deliveryDate": "2024-01-02T00:00:00+0000",
            "acceptanceDate": "2024-01-01T00:00:00+0000"
        }
    ]
}
```

---

## Troubleshooting

### Issue: Cannot authenticate
- **Check**: Keycloak is running (`docker ps | grep keycloak`)
- **Check**: Hosts file has entries for `auth.gate.croatia.eu`, etc.
- **Check**: Client secret matches in Postman environment

### Issue: UIL query returns ERROR
- **Check**: Dataset file exists in `deploy/local/efti-gate/platform/cda/`
- **Check**: Platform is running (`docker ps | grep platform`)
- **Check**: Gate can reach platform (network connectivity)

### Issue: Cross-gate communication fails
- **Check**: Domibus is running (if using eDelivery)
- **Check**: PMode files are loaded
- **Check**: RabbitMQ queues are created

### Issue: Port already in use
- **Check**: Previous containers are stopped: `docker-compose down`
- **Check**: No other services using ports 8880, 8881, 8882

---

## Next Steps

After successful testing:
1. Create Croatian test data XML files
2. Upload Croatian datasets to platforms
3. Test with Croatian-specific data (names, addresses, locations)
4. Verify portal displays Croatian translation




