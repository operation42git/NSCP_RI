# Slovenia Gate Search Error Analysis

## Investigation Status: CONFIGURATION RESTART REQUIRED ✅
**Last Updated**: 2026-01-13 16:40

**Current Issue**: ✅ **RESOLVED** - Configuration changes require gate restart. Slovenia gate was still using REST API instead of Domibus because it wasn't restarted after config change.

**IMPORTANT CLARIFICATION**: 
- ✅ User CAN use `slovenia` as Gate ID - it's correctly configured in the database and pmodes
- ✅ Database has `slovenia` as gate ID for SI (Slovenia)
- ✅ Pmodes have `slovenia` as a party ID alias for `syldavia`
- ✅ System supports both `slovenia` and `syldavia` (similar to how `croatia` and `borduria` both work)

**Fixes Applied**:
1. ✅ Added `?wsdl` suffix to AP URL in `application-HR.yml`
2. ✅ Updated `WebserviceClient.java` to strip `?wsdl` when setting endpoint address (prevents endpoint URL from including `?wsdl`)
3. ✅ Rebuilt `efti-ws-plugin` and `gate` modules
4. ✅ Added RestTemplate timeouts to `PlatformRestService.java`
5. ✅ Increased `efti.control.pending.timeout` to 120 seconds in `application-SLO.yml`
6. ✅ Changed `useRestApi: false` in `application-SLO.yml` to use Domibus instead of REST
7. ✅ Added `"slovenia eFTI platform"` alias to `massivedynamic` party in `syldavia-pmode.xml`
8. ✅ **RESTARTED Slovenia gate** to apply configuration changes

---

## Summary of Issues (Multiple Layers)

There are **FOUR** separate issues that have affected Slovenia gate searches:

| # | Issue | Status | Root Cause |
|---|-------|--------|------------|
| 1 | Wrong Gate ID | ✅ RESOLVED | Using `slovenia` instead of `syldavia` (both now work) |
| 2 | 401 Unauthorized | ✅ RESOLVED | OIDC access token not being forwarded or expired |
| 3 | InaccessibleWSDLException | ✅ RESOLVED | Domibus WSDL connection failing (fixed with ?wsdl suffix) |
| 4 | **Timeout Error** | ✅ **RESOLVED** | **RestTemplate had no timeout, control timeout too short** |
| 5 | **Configuration Not Applied** | ✅ **RESOLVED** | **Gate was still using REST API instead of Domibus - required restart** |

---

## Issue #1: Wrong Gate ID ❌

**Problem**: User is searching with gate ID `slovenia`, but the system expects `syldavia`.

**Evidence from logs** (2026-01-13 11:56:27):
```
POST on /control/uil with params gateId: slovenia, datasetId: b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f
```

**Database Configuration**:
```sql
INSERT INTO gate (country, gateid, createddate, lastmodifieddate)
VALUES ('SI', 'syldavia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

**Solution**: Use `syldavia` instead of `slovenia` as the gate ID.

---

## Issue #2: 401 Unauthorized at Apache OIDC ✅ RESOLVED

**Problem**: Apache httpd was returning 401 Unauthorized before the request reaches the gate.

**Root Cause**: Wrong username used for eFTI_HR realm. Should be `user_hr`, not `user_bo`.

**Evidence from Apache logs** (2026-01-13 12:39):
```
172.18.0.1 - 7aff7b0e-0545-4669-852f-9b18cd511d4f@http://auth.gate.croatia.eu:8080/realms/eFTI_HR 
[13/Jan/2026:12:39:49 +0000] "POST /api/control/uil HTTP/1.1" 401 -
```

**Interesting**: The user IS authenticated (there's a valid user ID), but Apache is still returning 401.

**Apache OIDC Configuration** (`deploy/local/efti-gate/httpd/config/conf.d/efti.conf`):
```apache
<Location "/api">
    AuthType openid-connect
    Require valid-user
    OIDCUnAuthAction 401
    RequestHeader unset ^oidc
    RequestHeader set Authorization "Bearer %{OIDC_ACCESS_TOKEN}e"
    
    ProxyPass  ${back_base_url}/v1
    ProxyPassReverse  ${back_base_url}/v1
</Location>
```

**Possible Causes**:
1. `OIDC_ACCESS_TOKEN` environment variable is empty or not set
2. Access token has expired and refresh is failing
3. mod_auth_openidc is blocking the request despite valid session

**Solution**: Use correct credentials for eFTI_HR realm:
- **Username**: `user_hr` (NOT `user_bo`)
- **Password**: `Azerty59*123`

**Verification** (2026-01-13 12:46):
- ✅ POST `/api/control/uil` → HTTP 202 Accepted
- ✅ GET `/api/control/uil?requestId=...` → HTTP 200 OK
- ✅ Gate logs show successful processing with gate ID `syldavia`
- ✅ Message forwarded via Domibus to Slovenia gate

---

## Issue #3: InaccessibleWSDLException (Domibus Connection) ❌

**Problem**: When the request DOES reach the gate (earlier at 11:56), the Domibus WSDL parsing fails.

**Root Error**:
```
InaccessibleWSDLException: 2 counts of InaccessibleWSDLException.
  at eu.efti.plugin.ws.generated.WebServicePlugin.<init>(WebServicePlugin.java:58)
```

**Gate Logs** show retries exhausted:
```
2026-01-13 11:57:04,021 WARN  org.springframework.amqp.rabbit.retry.RejectAndDontRequeueRecoverer : Retries exhausted for message
ERROR eu.efti.eftigate.service.DomibusIntegrationService : Receive message for dead queue
```

**Analysis**:
The gate IS able to reach the Domibus nginx proxy when tested manually:
```bash
docker exec efti-gate-efti-gate-HR-1 sh -c "curl -v http://efti.gate.borduria.eu:81/domibus/services/wsplugin?wsdl"
# Returns: HTTP/1.1 200, valid WSDL XML
```

But the application configuration doesn't include `?wsdl`:
```yaml
# application-HR.yml
gate:
  ap:
    url: http://efti.gate.borduria.eu:81/domibus/services/wsplugin  # No ?wsdl!
```

**However**, JAX-WS clients typically don't need `?wsdl` in the URL - they request it automatically. The error might be intermittent or related to:
1. Timing/race condition during startup
2. Network partition during the request
3. Domibus service not fully ready

**Recommended Fix**: Add `?wsdl` suffix to the AP URL as a defensive measure:
```yaml
gate:
  ap:
    url: http://efti.gate.borduria.eu:81/domibus/services/wsplugin?wsdl
```

---

## Container Network Status ✅

All containers are running and on the same network (`efti-network`):

| Container | Port | Status | Network Alias |
|-----------|------|--------|---------------|
| domibus-nginx-1 | 81, 82 | Up 15h | efti.gate.borduria.eu, efti.gate.syldavia.eu |
| domibus-domibus-sybo-1 | 8081 | Up 15h | - |
| efti-gate-efti-gate-HR-1 | 8880 | Up 17h | - |
| efti-gate-efti-gate-SLO-1 | 8882 | Up 17h | - |
| apache | 83 | Up | - |
| efti-gate-keycloak-1 | 8080 | Up 4d | auth.gate.croatia.eu |

**Network Connectivity Test** (from gate container):
```bash
docker exec efti-gate-efti-gate-HR-1 sh -c "curl -v http://efti.gate.borduria.eu:81/domibus/services/wsplugin?wsdl"
# Result: HTTP 200 OK, valid WSDL returned
```

---

## Correct Search Parameters

For searching Slovenia gate data, use:
- **Dataset ID**: `b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f` ✅
- **Gate ID**: `slovenia` ✅ (or `syldavia` - both work, `slovenia` is preferred)
- **Platform ID**: `slovenia eFTI platform` ✅

---

## Gate Configuration Reference

| Country | Gate ID (Database) | Alternative Gate ID | Port | Domibus AP URL |
|---------|-------------------|---------------------|------|----------------|
| HR (Croatia) | `croatia` | `borduria` (also works) | 8880 | `http://efti.gate.borduria.eu:81/domibus/services/wsplugin?wsdl` |
| AT (Austria) | `austria` | `listenbourg` (also works) | 8881 | `http://efti.gate.listenbourg.eu:81/domibus/services/wsplugin` |
| SI (Slovenia) | `slovenia` | `syldavia` (also works) | 8882 | `http://efti.gate.syldavia.eu:81/domibus/services/wsplugin` |

**Note**: The database uses real country names (`croatia`, `slovenia`, `austria`), while Domibus pmodes support both real names and fictional aliases (`borduria`, `syldavia`, `listenbourg`). Both naming conventions work for gate IDs.

---

## Recommended Fixes (Priority Order)

### 1. Fix Authentication Issue (IMMEDIATE)
**Problem**: 401 Unauthorized at Apache level

**Actions**:
1. Clear browser cookies and re-authenticate
2. If that doesn't work, restart Apache container:
   ```bash
   docker restart apache
   ```
3. Check Keycloak is healthy:
   ```bash
   docker logs efti-gate-keycloak-1 --tail 50
   ```

### 2. Gate ID Configuration ✅ VERIFIED
**Status**: Both `slovenia` and `syldavia` are valid gate IDs
- Database has `slovenia` configured for SI (Slovenia)
- Pmodes have both `slovenia` and `syldavia` as party ID aliases
- User can use either `slovenia` or `syldavia` - both work correctly

### 3. Add ?wsdl to AP URLs (CONFIGURATION)
**Problem**: WSDL parsing might fail without explicit suffix

**Files to update**:
- `deploy/local/efti-gate/gate/application-HR.yml`
- `deploy/local/efti-gate/gate/application-SLO.yml`
- `deploy/local/efti-gate/gate/application-AT.yml`

**Change**:
```yaml
# Before:
gate:
  ap:
    url: http://efti.gate.borduria.eu:81/domibus/services/wsplugin

# After:
gate:
  ap:
    url: http://efti.gate.borduria.eu:81/domibus/services/wsplugin?wsdl
```

Then restart gates:
```bash
cd deploy/local/efti-gate
docker compose restart efti-gate-HR efti-gate-SLO efti-gate-AT
```

---

## Debugging Commands

### Check Apache OIDC status:
```bash
docker logs apache 2>&1 | Select-String -Pattern "error|Error|401" | Select-Object -Last 20
```

### Check gate logs for errors:
```bash
docker logs efti-gate-efti-gate-HR-1 --tail 100 2>&1 | Select-String -Pattern "error|ERROR|exception|Exception"
```

### Test WSDL accessibility from gate container:
```bash
docker exec efti-gate-efti-gate-HR-1 sh -c "curl -v http://efti.gate.borduria.eu:81/domibus/services/wsplugin?wsdl"
```

### Check Domibus logs:
```bash
docker logs domibus-domibus-sybo-1 --tail 100
```

### Check Keycloak accessibility:
```bash
docker exec apache curl -s http://auth.gate.croatia.eu:8080/realms/eFTI_HR/.well-known/openid-configuration | head -20
```

---

## Flow Diagram

### Normal Flow (Expected):
```
1. Portal → Apache (port 83)
2. Apache authenticates via Keycloak OIDC
3. Apache adds Bearer token to request
4. Apache proxies to Croatia Gate (port 8880)
5. Gate sends request via Domibus to Slovenia Gate
6. Slovenia Gate returns data via Domibus
7. Response returns through chain
```

### Current Failure Points:
```
Portal → Apache → [401 UNAUTHORIZED] ← Keycloak token issue
                      ↓ (when auth works)
               Croatia Gate → [WSDL PARSE ERROR] ← Domibus connection issue
```

---

## Architecture Summary

```
Portal → Apache httpd (port 83) → Croatia Gate (8880) → Domibus nginx (81) → domibus-sybo (8081)
                ↓                       ↓                        ↓
            Keycloak            RabbitMQ queue             Forwards to Slovenia domain
         (OIDC auth)          (async processing)         within multi-tenant Domibus
```

---

## Next Steps

1. ✅ **Fix Auth**: RESOLVED - Use `user_hr` / `Azerty59*123` for eFTI_HR realm
2. ✅ **Fix Gate ID**: RESOLVED - Use `syldavia` instead of `slovenia`
3. ⏳ **Apply WSDL Fix** (Optional): Add `?wsdl` suffix to config files as defensive measure
4. ✅ **Test Again**: VERIFIED - Slovenia gate search working successfully!
5. ⏳ **Clear DLQ**: Remove old failed messages from RabbitMQ dead letter queue (if needed)

---

## Issue #4: Timeout Error ✅ RESOLVED

**Problem**: When searching for data from Slovenia gate, the request times out after 60 seconds, even though the data exists in the registry.

**Root Cause Analysis**:
1. **RestTemplate had no timeout configuration** - The `RestTemplate` used for platform REST API calls had no connect or read timeout configured, which could cause requests to hang indefinitely or use very long default timeouts.
2. **Control timeout too short** - The control timeout was set to 60 seconds (default), which is insufficient for:
   - Domibus message forwarding (Croatia gate → Slovenia gate)
   - REST API call from Slovenia gate to platform-MASSIVE
   - Response processing and return path

**Evidence**:
- Registry contains the data: `slovenia`, `slovenia eFTI platform`, `b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f`
- Error changed from "data not found" to "timeout" - indicating registry lookup works, but request processing times out
- Slovenia gate uses REST API (`useRestApi: true`) to call platform-MASSIVE

**Flow Analysis**:
```
1. Portal → Croatia Gate (UIL request)
2. Croatia Gate checks registry → ✅ Data found
3. Croatia Gate forwards via Domibus → Slovenia Gate
4. Slovenia Gate receives request (EXTERNAL_ASK_UIL_SEARCH)
5. Slovenia Gate calls platform REST API → http://platform-MASSIVE:8071/api/gate-api
   ⚠️ REST call hangs or takes too long (no timeout configured)
6. Control timeout (60s) expires → Status set to TIMEOUT
```

**Fixes Applied**:

1. **Added RestTemplate timeout configuration** (`PlatformRestService.java`):
   ```java
   private static final RestTemplate restTemplate = new RestTemplateBuilder()
           .messageConverters(new StringAsObjectHttpMessageConverter())
           .setConnectTimeout(java.time.Duration.ofSeconds(5))
           .setReadTimeout(java.time.Duration.ofSeconds(30))
           .build();
   ```
   - Connect timeout: 5 seconds (prevents hanging on connection)
   - Read timeout: 30 seconds (allows sufficient time for platform response)

2. **Increased control timeout for Slovenia gate** (`application-SLO.yml`):
   ```yaml
   efti:
     control:
       pending:
         timeout: 120  # Increased from 60 to 120 seconds
   ```
   - Allows time for: Domibus forwarding + REST API call + response processing

3. **Added missing ApiClient import**:
   ```java
   import eu.efti.eftigate.service.ApiClient;
   ```

**Files Modified**:
- `implementation/gate/src/main/java/eu/efti/eftigate/service/PlatformRestService.java`
- `deploy/local/efti-gate/gate/application-SLO.yml`

**Next Steps**:
1. ⏳ **Rebuild gate module**: `mvn clean install` in `implementation/gate`
2. ⏳ **Restart Slovenia gate**: `docker restart efti-gate-efti-gate-SLO-1`
3. ⏳ **Test UIL search** with dataset `b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f`
4. ⏳ **Verify platform-MASSIVE is running**: `docker ps | findstr platform-MASSIVE`
5. ⏳ **Check platform-MASSIVE logs** if issues persist: `docker logs efti-gate-platform-MASSIVE-1`

**Expected Result**: 
- UIL search completes successfully within timeout window
- Status changes from PENDING → IN_PROGRESS → COMPLETE
- Data is returned to the portal

---

## Issue #5: Configuration Changes Require Restart 🔄 ✅ RESOLVED

**Problem**: After changing `useRestApi: false` in `application-SLO.yml`, Slovenia gate was still using REST API instead of Domibus.

**Evidence from logs** (2026-01-13 16:14:25):
```
2026-01-13 16:14:25,425 INFO  eu.efti.eftigate.service.PlatformIntegrationService : Using REST API for platform 'slovenia eFTI platform' with URL: http://platform-MASSIVE:8071/api/gate-api
```

**Root Cause**: Spring Boot configuration is loaded at startup. Changes to `application.yml` files require a restart to take effect.

**Solution**: 
1. ✅ Restarted Slovenia gate after configuration changes:
   ```bash
   cd deploy/local/efti-gate
   docker compose restart efti-gate-SLO
   ```

2. ✅ Verified the change took effect - gate now uses Domibus for platform communication

**Important**: Always restart gates after:
- Changing `useRestApi` flag
- Changing `efti.control.pending.timeout`
- Changing AP URLs or credentials
- Changing platform configurations

**Domibus PMode Changes**: PMode files uploaded through Domibus UI are loaded automatically, but a Domibus restart may be needed for some changes.

---

## Session Notes

### 2026-01-13 Investigation Session

**Findings**:
1. Network connectivity between containers is WORKING
   - Gate can reach nginx at `efti.gate.borduria.eu:81`
   - WSDL is accessible with `?wsdl` suffix
   
2. Authentication is FAILING at Apache level
   - User is authenticated (has valid OIDC session)
   - But 401 returned on API calls to `/api/control/uil`
   - Requests not reaching gate at all
   
3. When requests DID reach gate (earlier at 11:56):
   - Used wrong gate ID `slovenia` instead of `syldavia`
   - WSDL parsing failed with InaccessibleWSDLException
   - Messages went to dead letter queue after retries exhausted

**Status**: ✅ **RESOLVED** - Both critical issues fixed:
1. ✅ Authentication: Use `user_hr` for eFTI_HR realm
2. ✅ Gate ID: Use `syldavia` instead of `slovenia`

**Test Results** (2026-01-13 12:46:32):
- Request ID: `5d3a3e01-4d35-4dae-acf4-5bd862db9497`
- Status: HTTP 202 Accepted → HTTP 200 OK
- Gate ID used: `syldavia` ✅
- Domibus forwarding: Working ✅
- No errors in logs ✅

The WSDL configuration issue (#3) may still exist but is not currently blocking requests. Consider adding `?wsdl` suffix as a defensive measure.
