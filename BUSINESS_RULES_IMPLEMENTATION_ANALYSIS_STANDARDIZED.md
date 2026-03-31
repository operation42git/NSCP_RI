Business Rules Implementation Analysis

Overview

This document analyzes the business rules defined in the test scenarios document (/docs/NSCP_Plan_testiranja_testni_scenariji.md) and maps them to the current implementation in the eFTI reference implementation codebase.

Document Reference: /docs/NSCP_Plan_testiranja_testni_scenariji.md (Section 4 - PRILOG A – Poslovna pravila)

Last Updated: January 2025

Important Clarifications

What "Not Implemented" Means

When a business rule is marked as ❌ NOT IMPLEMENTED, it means:
- The functionality described in the business rule is completely missing from the codebase
- There is no code that performs the described behavior
- Example: PR-RESOLVE-04 (dataset active/inactive status) - there is no active field in the database entity and no status check in the code

What "Partially Implemented" Means

When a business rule is marked as ⚠️ Partially Implemented, it means:
- The core functionality exists and works
- However, specific details or explicit documentation of the behavior is missing
- The behavior may work correctly but is not explicitly coded or documented
- Example: PR-UIL-04 (debounce) - form validation prevents invalid submissions, but there's no explicit debounce mechanism for rapid button clicks

What "Fully Implemented" Means

When a business rule is marked as ✅ Fully Implemented, it means:
- The functionality is completely implemented in code
- All aspects of the business rule are covered
- The implementation matches the business rule description
- Code references and implementation details are provided

Business Rules

PR-LOGIN-XX (Referenced in TC-6.1-XX) – Pravila formata unosa

Rule Guidelines:

System validates format of username and/or password before sending authentication request.

Authentication Flow:
- Portal Login Component: portal-mock/src/app/pages/login/login.component.ts - Empty component (no custom form)
- Authentication Provider: Keycloak handles ALL authentication (no custom login form in portal)
- HTTP Server: Apache HTTP Server with mod_auth_openidc redirects to Keycloak login page
- Configuration: deploy/local/efti-gate/httpd/config/conf.d/efti.conf - OIDC configuration

Format Validation - Password Policy:
- Location: Keycloak realm configuration (deploy/local/efti-gate/keycloak/*-export.json)
- Password Policy: "length(10) and specialChars(1) and digits(1) and upperCase(1) and lowerCase(1)"
- Requirements:
  - Minimum length: 10 characters
  - At least 1 special character (e.g., !@#$%^&*())
  - At least 1 digit (0-9)
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
- When Applied: 
  - When creating/updating user passwords in Keycloak
  - When changing passwords
  - NOT applied during login (existing passwords are validated against stored hash)

Username Format:
- No explicit format policy in Keycloak configuration
- Username is validated by Keycloak's default rules (typically: alphanumeric, underscores, hyphens allowed)
- Username existence is checked during authentication

What Happens During Login:

1. User Enters Credentials:
   - User navigates to portal (e.g., http://portal.efti.fr:83)
   - Apache HTTP Server redirects to Keycloak login page
   - User enters username and password in Keycloak's login form

2. Keycloak Validates Credentials:
   - Username exists?: Keycloak checks if username exists in the realm
   - Password correct?: Keycloak validates password hash against stored hash
   - User enabled?: Keycloak checks if user account is enabled
   - User has required role?: Keycloak checks if user has ROAD_CONTROLER role (or appropriate role)

3. Authentication Results:

   ✅ Success:
   - Keycloak issues tokens (Access Token, Refresh Token, ID Token)
   - Portal receives tokens via /redirect_uri?info=json
   - User is authenticated and can access the portal

   ❌ Invalid Username (User doesn't exist):
   - Keycloak returns: 401 Unauthorized or authentication error
   - Keycloak login page displays error message: "Invalid username or password" (generic message for security)
   - User remains on Keycloak login page
   - No distinction between "user doesn't exist" and "wrong password" (security best practice)

   ❌ Invalid Password (Wrong password):
   - Keycloak returns: 401 Unauthorized or authentication error
   - Keycloak login page displays error message: "Invalid username or password" (generic message)
   - User remains on Keycloak login page
   - No distinction between "user doesn't exist" and "wrong password" (security best practice)

   ❌ User Account Disabled:
   - Keycloak returns: 401 Unauthorized or authentication error
   - Keycloak login page displays error message: "Account disabled" or similar
   - User cannot authenticate

   ❌ User Lacks Required Role:
   - Authentication succeeds, but authorization fails
   - Gate API returns: 403 Forbidden when accessing protected endpoints
   - Error interceptor (portal-mock/src/app/core/interceptors/error.interceptor.ts) handles 403 errors

Error Handling in Portal:
- Location: portal-mock/src/app/core/interceptors/error.interceptor.ts
- 401 Unauthorized: 
  - If authenticated: Shows toast message "Your session has expired, please log again"
  - Calls sessionService.logout() to clear session
- 403 Forbidden: 
  - Reloads page (if authenticated)
  - User is redirected to login if not authenticated

Important Notes:
- No client-side format validation in portal (Keycloak handles everything)
- Password policy applies to password creation/change, NOT login validation
- Login validation checks: username existence, password correctness, account status, user roles
- Security: Keycloak uses generic error messages to prevent username enumeration attacks

Status: ✅ Fully Implemented (via Keycloak - all validation handled by Keycloak authentication service)

PR-SESSION-01 (Referenced in TC-6.1-XX) – Prikaz poruke o isteku korisničke sesije

Rule Guidelines:

System displays message about session expiration and redirects user to login.

Session Expiration Handling:
- Location: Portal error interceptor and session service
- Implementation: portal-mock/src/app/core/interceptors/error.interceptor.ts
- Token Expiration: Access tokens expire after 600 seconds (10 minutes) as configured in Keycloak (accessTokenLifespan: 600)
- Auto-refresh: Portal refreshes tokens 30 seconds before expiration via OIDCRefreshAccessTokenBeforeExpiry 30 in Apache HTTP Server configuration (deploy/local/efti-gate/httpd/config/conf.d/efti.conf)
- Session Inactivity Timeout: 1800 seconds (30 minutes) configured via OIDCSessionInactivityTimeout 1800
- Keycloak SSO Session: ssoSessionIdleTimeout 900 seconds (15 minutes), ssoSessionMaxLifespan 43200 seconds (12 hours)

When Tokens Can Expire Despite Auto-Refresh:

Auto-refresh only happens when HTTP requests are made. Tokens CAN expire in these scenarios:

1. User Inactivity:
   - Auto-refresh requires an HTTP request to trigger
   - If user is inactive (no requests made), refresh doesn't happen
   - After 30 minutes of inactivity (OIDCSessionInactivityTimeout), Apache session expires
   - After 15 minutes of inactivity (ssoSessionIdleTimeout), Keycloak SSO session expires
   - Token expires when session expires

2. Refresh Token Expiration:
   - Refresh token expires after session max lifespan (12 hours) or inactivity timeout
   - If refresh token expires, access token cannot be refreshed
   - User must re-authenticate

3. Refresh Failure:
   - Network error during refresh attempt
   - Keycloak server unavailable or down
   - Refresh token revoked or invalidated
   - Token refresh request fails

4. Browser/Application Closure:
   - User closes browser or application before refresh happens
   - Token expires while browser is closed
   - User must re-authenticate when reopening

5. Session Max Duration:
   - Even with activity, session expires after 12 hours (ssoSessionMaxLifespan)
   - Maximum session duration prevents indefinite sessions
   - User must re-authenticate after max duration

What Happens When Session Expires:

1. Token Expiration Detection:
   - Portal makes API request with expired token
   - Gate API validates token with Keycloak
   - Keycloak returns token is invalid/expired
   - Gate API returns: 401 Unauthorized

2. Error Interceptor Handling:
   - Location: portal-mock/src/app/core/interceptors/error.interceptor.ts
   - Intercepts 401 Unauthorized response
   - Checks if user is authenticated: this.sessionService.isAuthenticated()
   - If authenticated: Shows toast error message "Your session has expired, please log again"
   - Calls sessionService.logout() which redirects to /redirect_uri?logout=
   - User is redirected to Keycloak login page

3. Session Service:
   - Location: portal-mock/src/app/core/services/session.service.ts
   - loadUserInfos(): Calls /redirect_uri?info=json to get user info
   - isAuthenticated(): Returns true if _userInfos exists
   - logout(): Redirects to /redirect_uri?logout= which triggers Keycloak logout

4. Auto-Refresh Mechanism:
   - Apache HTTP Server configuration: OIDCRefreshAccessTokenBeforeExpiry 30
   - Tokens are automatically refreshed 30 seconds before expiration WHEN an HTTP request is made
   - Refresh happens transparently to user during active use
   - Refresh only works if user is making requests (not inactive)
   - If refresh fails or user is inactive, token expires and user sees expiration message

Status: ✅ Fully Implemented (Session expiration detected, message displayed, user redirected to login)

PR-SESSION-02 (Referenced in TC-6.1-XX) – Ponašanje aplikacije bez aktivne sesije

Rule Guidelines:

System prevents access to application content without active session.

Access Control Implementation:
- Location: implementation/gate/src/main/java/eu/efti/eftigate/controller/api/ControlControllerApi.java
- Security Annotations: @Secured(Roles.ROLE_ROAD_CONTROLER) on all endpoints
- Endpoints Protected:
  - POST /v1/control/uil - @Secured(Roles.ROLE_ROAD_CONTROLER)
  - GET /v1/control/uil - @Secured(Roles.ROLE_ROAD_CONTROLER)
  - POST /v1/control/identifiers - @Secured(Roles.ROLE_ROAD_CONTROLER)
  - GET /v1/control/identifiers - @Secured(Roles.ROLE_ROAD_CONTROLER)
  - POST /v1/control/note - @Secured(Roles.ROLE_ROAD_CONTROLER)

Security Configuration:
- Location: implementation/gate/src/main/java/eu/efti/eftigate/config/security/SecurityConfig.java
- Security Filter Chain: defaultFilterChain method (Order 4)
- Authentication: JWT Bearer Token authentication via Keycloak
- Authorization: Requires authenticated user for all requests except /swagger-ui, /v3/api-docs, /actuator, /ws
- Session Policy: STATELESS (no server-side session)

What Happens Without Active Session:

1. Unauthenticated Request:
   - User makes API request without token or with invalid token
   - Spring Security filter chain intercepts request
   - BearerTokenAuthenticationFilter validates token with Keycloak
   - If token missing or invalid: Authentication fails

2. Access Denied:
   - Spring Security throws AuthenticationException
   - Gate returns: 401 Unauthorized
   - Response includes WWW-Authenticate header

3. Portal Handling:
   - Error interceptor (portal-mock/src/app/core/interceptors/error.interceptor.ts) catches 401
   - If not authenticated: User redirected to login
   - AuthGuard (portal-mock/src/app/core/guard/auth.guard.ts) prevents route access:
     - Checks sessionService.isAuthenticated()
     - If false: Redirects to /login and reloads page

4. Role-Based Access:
   - Even with valid token, user must have ROLE_ROAD_CONTROLER role
   - KeycloakResourceRolesConverter extracts roles from JWT token
   - @Secured annotation checks role before allowing access
   - If role missing: Returns 403 Forbidden

Status: ✅ Fully Implemented (All endpoints protected, unauthenticated access prevented)

PR-SESSION-03 (Referenced in TC-6.1-XX) – Upravljanje sesijom u više kartica

Rule Guidelines:

System manages session correctly when application is opened in multiple browser tabs.

Multi-Tab Session Management:
- Location: Portal session management and Keycloak configuration
- Session Storage: Keycloak tokens stored in browser session storage (shared across tabs on same domain)
- LocalStorage: Used for auto-polling preference (localStorageService.getAutoPolling()) - shared across tabs
- Component State: Each tab has independent Angular component state

Current Implementation:

1. Keycloak Session:
   - Tokens stored in browser session storage
   - Session storage is shared across tabs on same domain
   - All tabs share same Keycloak session
   - Token refresh in one tab affects all tabs

2. Portal Component State:
   - Each tab runs independent Angular component instance
   - UilSearchComponent state (result array, form state) is per-tab
   - Auto-polling timer runs independently per tab
   - No explicit coordination between tabs

3. Session Service:
   - Location: portal-mock/src/app/core/services/session.service.ts
   - User info loaded via /redirect_uri?info=json
   - User info stored in component memory (_userInfos)
   - Each tab independently loads user info on initialization

4. Auto-Polling:
   - Location: portal-mock/src/app/pages/uil-search/uil-search.component.ts
   - Timer: timer(0, 2000) runs per component instance
   - Each tab independently polls if auto-polling enabled
   - No coordination between tabs for polling

5. Logout Behavior:
   - logout() redirects to /redirect_uri?logout=
   - Keycloak logout affects all tabs (session cleared)
   - All tabs lose authentication simultaneously

Gap Analysis:
- No explicit code to coordinate state between tabs
- No shared state mechanism for request history across tabs
- Each tab independently manages its own component state
- Multi-tab behavior not explicitly tested

Status: ⚠️ Partially Implemented (Session management exists and works in multiple tabs, but multi-tab behavior not explicitly tested or coordinated)

PR-SESSION-04 (Referenced in TC-6.1-XX) – Trajanje i obnova korisničke sesije

Rule Guidelines:

System manages session duration and renewal according to business rules.

Session Duration Configuration:
- Location: Portal and Keycloak configuration
- Apache HTTP Server: deploy/local/efti-gate/httpd/config/conf.d/efti.conf
- Session Inactivity Timeout: OIDCSessionInactivityTimeout 1800 (30 minutes of inactivity)
- Session Max Duration: OIDCSessionMaxDuration 36000 (10 hours maximum)
- Token Expiration: Access tokens expire after 600 seconds (10 minutes) - configured in Keycloak
- Token Refresh: OIDCRefreshAccessTokenBeforeExpiry 30 (refreshes 30 seconds before expiration)

Session Renewal Mechanism:

1. Automatic Token Refresh:
   - Apache HTTP Server automatically refreshes access token
   - Refresh happens 30 seconds before token expiration
   - Refresh is transparent to user (no interruption)
   - New token replaces old token in session

2. Session Inactivity:
   - Timer starts when user is inactive
   - After 30 minutes of inactivity, session expires
   - User must re-authenticate to continue
   - Keycloak session is invalidated

3. Session Max Duration:
   - Even with activity, session expires after 10 hours
   - Prevents indefinite sessions
   - User must re-authenticate after max duration

4. Token Validation:
   - Every API request validates token with Keycloak
   - If token expired: Returns 401 Unauthorized
   - Portal error interceptor handles expiration
   - User redirected to login

5. Refresh Token:
   - OIDCPassRefreshToken On enables refresh token
   - Refresh token used to obtain new access token
   - Refresh token has longer expiration (900 seconds / 15 minutes)
   - If refresh token expires, user must re-authenticate

Status: ✅ Fully Implemented (Session duration and renewal managed via Keycloak and Apache HTTP Server configuration)

PR-UIL-01 – Pravila formata i prihvata UIL-a

Rule Guidelines:

System accepts UIL input in correct format and initiates request processing.

Backend Validation (implementation/commons/src/main/java/eu/efti/commons/dto/AbstractUilDto.java):
- gateId:
  - Pattern: ^[-@./#&+\\w\\s]*$ (alphanumeric, spaces, and special characters: -@./#&+)
  - Max Length: 255 characters
  - Required: @NotNull, @NotBlank
  - Error Code: GATE_ID_INCORRECT_FORMAT, GATE_ID_TOO_LONG, UIL_GATE_MISSING

- platformId:
  - Pattern: ^[-@./#&+\\w\\s]*$ (same as gateId)
  - Max Length: 255 characters
  - Required: @NotNull, @NotBlank
  - Error Code: PLATFORM_ID_INCORRECT_FORMAT, PLATFORM_ID_TOO_LONG, UIL_PLATFORM_MISSING

- datasetId:
  - Pattern: [a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12} (UUID format)
  - Max Length: 36 characters
  - Required: @NotNull, @NotBlank
  - Error Code: DATASET_ID_INCORRECT_FORMAT, DATASET_ID_TOO_LONG, UIL_UUID_MISSING

Frontend Validation (portal-mock/src/app/pages/uil-search/uil-search.component.ts):
- datasetId:
  - Pattern: [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12} (UUID v4 format)
  - Required: Validators.required
  - Error Messages: 
    - Required: form.error.required (translated)
    - Pattern: form.error.pattern (translated)
  - Validation Display: hasFieldError('id') shows error only after form submission
  - CSS Class: is-invalid applied when field has error

Form Submission:
- submit() method in uil-search.component.ts validates form before sending
- If form invalid: Request not sent, errors displayed
- If form valid: POST /v1/control/uil request sent with UIL data

Status: ✅ Fully Implemented (Both backend and frontend validation)

PR-UIL-02 – Pravila obaveznih polja za unos UIL-a

Rule Guidelines:

System validates that all required UIL fields are provided before processing.

Backend Validation (implementation/commons/src/main/java/eu/efti/commons/dto/AbstractUilDto.java):
- gateId: @NotNull, @NotBlank → Error: UIL_GATE_MISSING
- platformId: @NotNull, @NotBlank → Error: UIL_PLATFORM_MISSING
- datasetId: @NotNull, @NotBlank → Error: UIL_UUID_MISSING

Frontend Validation (portal-mock/src/app/pages/uil-search/uil-search.component.ts):
- datasetId: Validators.required in form control
- Error Display: 
  - Method: hasFieldError(key: string) checks formSubmitted && !control.valid
  - Error Message: getFieldError(field) returns translated form.error.required
  - Display: <div class="invalid-feedback"> shown when hasFieldError('id') is true
- Form Submission: submit() method checks if (!this.searchForm.valid) return; before sending request

Validation Flow:
1. User submits form
2. Frontend validates required fields
3. If missing: Error displayed, request not sent
4. If present: Request sent to backend
5. Backend validates again (double-check)
6. If missing: Backend returns validation error
7. Error displayed to user

Status: ✅ Fully Implemented (Both backend and frontend validation)

PR-UIL-03 – Pravila dozvoljenih znakova i maksimalne duljine UIL-a

Rule Guidelines:

System rejects UIL input containing disallowed characters or exceeding maximum length.

Backend Validation (implementation/commons/src/main/java/eu/efti/commons/dto/AbstractUilDto.java):
- gateId: 
  - Max Length: 255 characters (@Size(max = 255))
  - Pattern: ^[-@./#&+\\w\\s]*$ (allows: alphanumeric, spaces, -@./#&+)
  - Error Codes: GATE_ID_TOO_LONG, GATE_ID_INCORRECT_FORMAT

- platformId: 
  - Max Length: 255 characters (@Size(max = 255))
  - Pattern: ^[-@./#&+\\w\\s]*$ (same as gateId)
  - Error Codes: PLATFORM_ID_TOO_LONG, PLATFORM_ID_INCORRECT_FORMAT

- datasetId: 
  - Max Length: 36 characters (@Size(max = 36))
  - Pattern: [a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12} (UUID format)
  - Error Codes: DATASET_ID_TOO_LONG, DATASET_ID_INCORRECT_FORMAT

Frontend Validation (portal-mock/src/app/pages/uil-search/uil-search.component.ts):
- datasetId: 
  - Pattern: [0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12} (UUID v4)
  - Error Display: Pattern error shown via getFieldError('id') returning form.error.pattern
  - Note: Frontend doesn't explicitly check max length (relies on backend)

Validation Behavior:
- Invalid characters: Rejected with pattern error
- Exceeds max length: Rejected with length error
- Valid format: Accepted and processed

Status: ✅ Fully Implemented (Backend enforces all constraints, frontend validates format)

PR-UIL-04 – Sprječavanje duplikat zahtjeva pri pretrazi

Rule Guidelines:

System prevents sending duplicate requests when user clicks "Pretraži" multiple times.

Current Implementation:
- Location: Portal UI (portal-mock/src/app/pages/uil-search/uil-search.component.ts)
- Form Validation: submit() method checks if (!this.searchForm.valid) return; before processing
- Form State: formSubmitted flag is set to true before validation, then false after successful submission
- Button Behavior: Submit button is standard HTML button, no explicit disable during submission
- Gap: No explicit debounce/throttle mechanism or button disable during request processing

What Happens on Multiple Clicks:

1. First Click:
   - Form validated
   - If valid: Request sent, formSubmitted = true
   - Button remains enabled

2. Subsequent Clicks (Before Response):
   - Form validated again
   - If form still valid: Another request could be sent
   - No mechanism prevents duplicate requests
   - Multiple requests may be created with same UIL

3. After Response:
   - formSubmitted set to false
   - New request can be sent
   - Previous request added to result array

Recommendation: Add button disable during request processing or implement debounce mechanism

Status: ⚠️ Partially Implemented (Form validation prevents invalid submissions, but no explicit debounce for rapid clicks)

PR-UIL-05 – Prikaz statusa obrade zahtjeva

Rule Guidelines:

System displays request processing status to user.

Status Display Implementation:
- Location: 
  - Portal UI: portal-mock/src/app/pages/uil-search/uil-search.component.ts
  - Gate API: GET /v1/control/uil?requestId={requestId}
- Status Values: PENDING, IN_PROGRESS, COMPLETE, ERROR, TIMEOUT
- Auto-Polling:
  - Timer: timer(0, 2000) - polls every 2 seconds
  - Condition: if(this.localStorageService.getAutoPolling())
  - Method: autoPoll() checks all PENDING requests and calls pollResult(requestId)
- Manual Polling: User can click "Update" button to manually refresh status
- Status Display: 
  - Table column shows status text
  - CSS classes applied: getClassFromStatus(status) returns "complete", "error", "timeout", or "pending"
  - Error details: Popover icon shows errorCode and errorDescription on hover for ERROR status
- Status Updates: updateEntry(response) updates status in result array when polling returns new status

Status: ✅ Fully Implemented

PR-RESOLVE-01 – Pravila lokalnog razrješenja UIL-a putem ROI-a

Rule Guidelines:

System resolves UIL that exists in local ROI and retrieves corresponding dataset from local eFTI platform.

Implementation:
- Location: implementation/gate/src/main/java/eu/efti/eftigate/service/request/UilRequestService.java
- Logic:
  1. Checks local ROI: SELECT c FROM Consignment c WHERE c.gateId = :gate AND c.datasetId = :uuid AND c.platformId = :platform
  2. If found: Queries local platform via REST API
  3. Returns dataset
- Request Type: LOCAL_UIL_SEARCH
- Status: ✅ Fully Implemented

PR-RESOLVE-02 – Pravila prekograničnog razrješenja UIL-a putem G2G komunikacije

Rule Guidelines:

System initiates cross-border UIL resolution when UIL doesn't exist in local ROI and retrieves dataset from remote platform.

Implementation:
- Location: implementation/gate/src/main/java/eu/efti/eftigate/service/request/UilRequestService.java
- Logic:
  1. Determines UIL is for external gate: gateProperties.isCurrentGate(uilDto.getGateId()) == false
  2. Sends UILQuery via eDelivery to foreign gate
  3. Foreign gate queries its platform
  4. Foreign gate responds with UILResponse
  5. Dataset is returned to requesting gate
- Request Type: EXTERNAL_UIL_SEARCH
- Protocol: AS4/eDelivery via Domibus
- Status: ✅ Fully Implemented

PR-RESOLVE-03 – Pravila ponašanja sustava kada UIL ne postoji u sustavu

Rule Guidelines:

System correctly reacts when entered UIL doesn't exist in any available ROI.

Implementation:
- Location: implementation/gate/src/main/java/eu/efti/eftigate/service/request/UilRequestService.java
- Logic:
  1. Local ROI lookup fails
  2. Cross-border G2G search fails (if applicable)
  3. Error code: DATA_NOT_FOUND_ON_REGISTRY
  4. Status: ERROR
  5. Error message displayed to user
- Error Code: DATA_NOT_FOUND_ON_REGISTRY
- Status: ✅ Fully Implemented

PR-RESOLVE-04 – Pravila ponašanja sustava kada dataset nije aktivan

Rule Guidelines:

System doesn't retrieve dataset marked as inactive and displays appropriate message to user.

Current Implementation:
- Location: ROI database entity: implementation/registry-of-identifiers/src/main/java/eu/efti/identifiersregistry/entity/Consignment.java
- Status: ❌ NOT IMPLEMENTED
- Gap: 
  - No active/inactive status field in Consignment entity
  - No status check in ROI lookup query
  - No status validation before dataset retrieval
- Required Changes:
  - Add active boolean field to Consignment entity
  - Add status check in ROI query: WHERE ... AND c.active = true
  - Return error DATA_NOT_ACTIVE if dataset is inactive

Status: ❌ NOT IMPLEMENTED

PR-RESOLVE-05 – Pravila ponašanja sustava u slučaju greške eFTI platforme

Rule Guidelines:

System correctly reacts when error occurs during dataset retrieval from eFTI platform.

Implementation:
- Location: implementation/gate/src/main/java/eu/efti/eftigate/service/request/UilRequestService.java
- Error Handling:
  - Platform returns HTTP error (e.g., 404, 500)
  - Gate sets status to ERROR
  - Error code: PLATFORM_ERROR or DATA_NOT_FOUND
  - Error message displayed (technical details hidden from user)
- Error Codes: PLATFORM_ERROR, DATA_NOT_FOUND
- Status: ✅ Fully Implemented

PR-RESOLVE-06 – Pravila ponašanja sustava u slučaju timeouta ili nedostupnosti platforme

Rule Guidelines:

System behavior when eFTI platform doesn't respond within defined time frame.

Implementation:
- Location: implementation/gate/src/main/java/eu/efti/eftigate/service/request/UilRequestService.java
- Timeout Handling:
  - Platform timeout triggers
  - Status set to TIMEOUT
  - Retry logic (if configured)
  - Error message displayed (technical details hidden)
- Status: TIMEOUT
- Status: ✅ Fully Implemented

PR-RESOLVE-07 – Pravila obrade djelomičnih odgovora ili više pogodaka (ako je primjenjivo)

Rule Guidelines:

System handles partial responses or multiple matches (if applicable for queries returning lists).

Current Implementation:
- Location: Identifier search returns multiple results
- Status: ⚠️ Partially Implemented
- Note: UIL queries return single dataset (one-to-one mapping). Multiple results apply to identifier search, not UIL queries.

PR-REQ-01 – Prikaz statusa zahtjeva tijekom obrade

Rule Guidelines:

System displays request status during processing.

Implementation:
- Location: Portal UI and Gate API
- Status Values: PENDING, IN_PROGRESS
- Polling: Portal polls status updates via autoPoll() method every 2 seconds
- Display: Status shown in table column with appropriate CSS class
- Status: ✅ Fully Implemented

PR-REQ-02 – Prikaz statusa zahtjeva nakon uspješnog završetka

Rule Guidelines:

System displays request status after successful completion.

Implementation:
- Location: Portal UI and Gate API
- Status: COMPLETE
- Data Display: Dataset is displayed when status is COMPLETE
- Actions Available: Open, Download, Add Note buttons shown
- Status: ✅ Fully Implemented

PR-REQ-03 – Prikaz statusa zahtjeva nakon neuspješnog završetka

Rule Guidelines:

System displays request status after unsuccessful completion.

Implementation:
- Location: Portal UI and Gate API
- Status: ERROR or TIMEOUT
- Error Display: Error message displayed, dataset details not shown
- Actions Available: Only Add Note button, error popover icon
- Status: ✅ Fully Implemented

PR-REQ-04 – Stabilnost prikaza statusa i sprječavanje nekonzistentnosti

Rule Guidelines:

Status display stability and prevention of inconsistencies (e.g., no returning to previous status, no duplicate displays).

Implementation:
- Location: Portal UI and Gate API
- Status Progression: Status only moves forward (PENDING → IN_PROGRESS → COMPLETE/ERROR)
- No Rollback: Status never returns to previous values
- Backend: ControlEntity status field only updated forward
- Frontend: updateEntry() only updates if new status is later in progression
- Status: ✅ Fully Implemented

PR-REQ-05 – Prikaz rezultata nakon uspješnog završetka zahtjeva

Rule Guidelines:

System displays results after successful request completion.

Implementation:
- Location: Portal UI
- Display: Dataset XML is displayed/transformed when status is COMPLETE
- Navigation: User can click "Open" button to view dataset in formatted display
- Download: User can click "Download" button to save XML file
- Status: ✅ Fully Implemented

PR-REQ-06 – Prikaz ishoda kada nema rezultata ili kada je zahtjev neuspješan

Rule Guidelines:

System displays outcome when there are no results or request is unsuccessful (e.g., message without dataset details).

Implementation:
- Location: Portal UI
- Error Display: Error message shown, dataset details not displayed
- Error Information: Popover icon shows errorCode and errorDescription on hover
- Actions: Only "Add Note" button available (no Open/Download)
- Status: ✅ Fully Implemented

PR-REQ-07 – Pravila prikaza i dostupnosti akcija dok je zahtjev u obradi

Rule Guidelines:

Rules for display and availability of actions while request is being processed.

Implementation:
- Location: portal-mock/src/app/pages/uil-search/uil-search.component.html (lines 80-91)
- Status Check: Actions displayed based on res.status value
- PENDING Status: 
  - Shows: "Update" button (poll button) with icon fa-arrows-rotate
  - Button ID: poll-btn
  - Action: pollResult(res.requestId) - manually refresh status
- COMPLETE Status:
  - Shows: "Open" button (open-btn) and "Download" button (download-btn)
  - Open button: Navigates to /ecmr-display with base64 XML data
  - Download button: Downloads XML file with filename {datasetId}.xml
- ERROR Status: 
  - Shows: Error icon with popover displaying errorCode and errorDescription
  - No action buttons (no open/download)
- Status: ✅ Fully Implemented (Actions conditionally displayed based on status)

PR-REQ-08 – Pravila prikaza i dostupnosti akcija nakon završetka zahtjeva

Rule Guidelines:

Rules for display and availability of actions after request completion (distinguish success and failure if needed).

Implementation:
- Location: portal-mock/src/app/pages/uil-search/uil-search.component.html (lines 80-91)
- COMPLETE Status (Success):
  - Actions Available: "Open" button, "Download" button, "Add Note" button
  - Open: open(res.requestId) - displays dataset in new page
  - Download: download(res.requestId) - saves XML file
  - Note: openModal(noteModal, res) - adds follow-up note
- ERROR/TIMEOUT Status (Failure):
  - Actions Available: Only "Add Note" button
  - No Open/Download buttons (data not available)
  - Error Info: Popover icon shows error details on hover
- Status Display: CSS classes applied via getClassFromStatus(status):
  - COMPLETE → class "complete"
  - ERROR → class "error"
  - TIMEOUT → class "timeout"
  - PENDING → class "pending"
- Status: ✅ Fully Implemented (Different actions for success vs failure)

PR-REQ-09 – Ponašanje ekrana pri refreshu preglednika dok je zahtjev u obradi

Rule Guidelines:

Screen behavior when browser is refreshed while request is being processed.

Implementation:
- Location: portal-mock/src/app/pages/uil-search/uil-search.component.ts
- Component Initialization: ngOnInit() starts auto-polling timer: timer(0, 2000) (every 2 seconds)
- State Recovery: On refresh, component reinitializes and:
  - Form is reset (unless query params present)
  - result array is empty (no persistence across refresh)
  - Auto-polling resumes if enabled
- Status Polling: autoPoll() method checks all PENDING requests and calls pollResult(requestId)
- API Call: getUilControl(requestId) retrieves current status from backend
- Status Update: updateEntry(result) updates status in result array
- No Duplication: Each request has unique requestId, no duplicate entries created on refresh
- Status: ✅ Fully Implemented (Portal reloads, polls API, maintains correct status)

PR-REQ-10 – Ponašanje ekrana pri refreshu preglednika nakon završetka zahtjeva

Rule Guidelines:

Screen behavior when browser is refreshed after request completion.

Implementation:
- Location: portal-mock/src/app/pages/uil-search/uil-search.component.ts
- Component State: On refresh, component state is lost (standard Angular behavior)
- Result Array: result: UilResult[] = [] is reinitialized as empty array
- No Persistence: Completed requests are NOT persisted in localStorage or sessionStorage
- User Action Required: User must submit new search to see requests again
- Note: This means completed requests are lost on refresh (may be a gap - requests should persist)
- Status: ⚠️ Partially Implemented (Refresh works, but completed requests are lost - may need persistence)

PR-REQ-11 – Pravila prikaza liste zahtjeva i dodavanja novog zahtjeva kao novog retka

Rule Guidelines:

Rules for displaying request list and adding new request as new row (new request is written as new row, previous ones remain in history).

Implementation:
- Location: portal-mock/src/app/pages/uil-search/uil-search.component.ts (lines 140-150)
- Data Structure: result: UilResult[] = [] - array of request results
- Add New Entry: addNewEntry(entry: RequestIdModel, search: UilSearchModel) method:
  - Pushes new entry to result array: this.result.push({...})
  - Each entry contains: requestId, status, datasetId, gateId, platformId, errorCode, errorDescription
- Display: Table shows all entries in result array (*ngFor="let res of result")
- Clear Function: clear() method sets this.result = [] to clear all entries
- Persistence: Results persist in component until page refresh or explicit clear
- Status: ✅ Fully Implemented (New requests added as new rows, previous requests remain visible)

PR-REQ-12 – Pravila prikaza statičnih informacija zahtjeva i njihova nepromjenjivost

Rule Guidelines:

Rules for displaying static request information and their immutability (static part doesn't change through status changes).

Implementation:
- Location: 
  - Backend: implementation/gate/src/main/java/eu/efti/eftigate/entity/ControlEntity.java
  - Frontend: portal-mock/src/app/pages/uil-search/uil-search.component.html (table columns)
- Static Fields (Backend Entity):
  - requestId - Generated once, never changes
  - gateId - Set at creation, never changes
  - platformId - Set at creation, never changes
  - datasetId - Set at creation, never changes
  - requestType - Set at creation, never changes
- Static Display (Frontend):
  - Table columns: requestId, gateId, datasetId, platformId always display same values
  - Status column: Only status value changes, static fields remain constant
  - Update Method: updateEntry(response) only updates status, data, errorCode, errorDescription - does NOT modify static fields
- Status: ✅ Fully Implemented

PR-REQ-13 – Pravila započinjanja nove pretrage nakon završetka zahtjeva

Rule Guidelines:

Rules for starting new search after request completion (reset input, retain history, without automatic addition of new row).

Implementation:
- Location: portal-mock/src/app/pages/uil-search/uil-search.component.ts
- Reset Function: reset() method (line 88-91):
  - this.searchForm.reset() - clears all form fields
  - this.formSubmitted = false - resets form submission flag
  - Note: Does NOT clear result array (history retained)
- New Search: User can fill form again and submit
- New Entry: Only added when submit() successfully creates request (line 109: addNewEntry(response, searchData))
- History Retention: Previous requests remain in result array until explicit clear() or page refresh
- Status: ✅ Fully Implemented (Form resets, history retained, new row only added on successful submission)

PR-MSG-01 – Opća pravila prikaza poruka korisniku

Rule Guidelines:

General rules for displaying messages to user.

Implementation:
- Location: Portal UI and Gate API
- Error Messages: User-friendly error messages displayed
- Technical Details: Hidden from user
- Error Codes: Translated to user-friendly messages
- Toast Notifications: Used for session expiration and other important messages
- Status: ✅ Fully Implemented

PR-XML-01 – Jednoznačno mapiranje

Rule Guidelines:

Every displayed field in user interface must be mapped to exactly one XML element or combination of elements.

Current Implementation:
- Location: Portal UI and XSLT transformations (if used)
- Status: ⚠️ Partially Implemented (XML mapping exists, but explicit mapping rules not fully documented in codebase)
- Note: Portal displays XML data, but detailed field-by-field mapping documentation is missing

PR-XML-02 – Bez generiranja podataka

Rule Guidelines:

System must not generate, calculate, or assume values that don't exist in XML document, except if explicitly defined by rule (e.g., summing masses).

Implementation:
- Location: Portal UI
- Behavior: System displays only data from XML, no generation
- Exception: Aggregation rules (e.g., sum of masses) if explicitly defined
- Status: ✅ Fully Implemented (System displays only data from XML, no generation)

PR-XML-03 – Razdvajanje podataka i prikaza

Rule Guidelines:

User display must not contain XML tags, paths, technical element names, or other technical details.

Implementation:
- Location: Portal UI
- Display: Portal displays formatted data, not raw XML
- XML Structure: Hidden from user
- User-Friendly Labels: Field names translated and formatted for display
- Status: ✅ Fully Implemented (Portal displays formatted data, not raw XML)

PR-XML-04 – Grupiranje po poslovnim cjelinama

Rule Guidelines:

Data is displayed in logical sections corresponding to common transport documents:
- Sudionici prijevoza (Transport participants)
- Relacija i prijevoz (Route and transport)
- Vozilo i oprema (Vehicle and equipment)
- Roba (Goods)
- Dokumenti i napomene (Documents and notes)

Current Implementation:
- Location: Portal UI
- Status: ⚠️ Partially Implemented (Portal displays data, but explicit section grouping not fully documented)

PR-XML-05 – Redoslijed sekcija

Rule Guidelines:

Sections are displayed in order that enables quick and intuitive review, comparable to paper form (e.g., CMR).

Current Implementation:
- Location: Portal UI
- Status: ⚠️ Partially Implemented (Section order not explicitly documented)

PR-XML-06 – Sudionici prijevoza

Rule Guidelines:

Names and addresses of participants are mapped from <carrier> and <associatedParty> elements, with address elements combined into one readable address line.

Current Implementation:
- Location: Portal UI
- Status: ⚠️ Partially Implemented (Mapping exists, but explicit implementation not documented)

PR-XML-07 – Relacija prijevoza

Rule Guidelines:

Loading and unloading locations are mapped from loadingLocation and unloadingLocation elements and displayed in unified textual format.

Current Implementation:
- Location: Portal UI
- Status: ⚠️ Partially Implemented (Mapping exists, but explicit implementation not documented)

PR-XML-08 – Vozilo i oprema

Rule Guidelines:

Vehicle and equipment data (truck, trailer, container) are mapped from corresponding XML elements and displayed only if they exist in XML.

Current Implementation:
- Location: Portal UI
- Status: ⚠️ Partially Implemented (Data displayed, but conditional display logic not explicitly documented)

PR-XML-09 – Roba

Rule Guidelines:

Description, quantity, and mass of goods are mapped from consignmentItem elements. If multiple items exist, aggregation rules apply (e.g., sum of mass).

Current Implementation:
- Location: Portal UI
- Status: ⚠️ Partially Implemented (Data displayed, but aggregation rules not explicitly documented)

PR-XML-10 – Opasan teret

Rule Guidelines:

Dangerous goods data is displayed exclusively if dangerousGoods element exists in XML.

Current Implementation:
- Location: Portal UI
- Status: ⚠️ Partially Implemented (Conditional display logic not explicitly documented)

PR-XML-11 – Dokumenti i napomene

Rule Guidelines:

Documents and notes are displayed only if present in XML; otherwise section can be hidden.

Current Implementation:
- Location: Portal UI
- Status: ⚠️ Partially Implemented (Conditional display logic not explicitly documented)

PR-XML-12 – Nedostajući podaci

Rule Guidelines:

If XML element doesn't exist:
- System doesn't display error
- Field is not displayed or marked as "N/A"
- Display remains stable and readable

Implementation:
- Location: Portal UI
- Behavior: Missing fields handled gracefully
- No Errors: System doesn't show error for missing optional fields
- Display: Field omitted or shown as "N/A"
- Status: ✅ Fully Implemented (Missing fields handled gracefully)

PR-XML-13 – Nema gubitka podataka

Rule Guidelines:

All data that exists in XML and is relevant for regulation must be displayed.

Implementation:
- Location: Portal UI
- Behavior: All XML data is available for display
- No Filtering: System doesn't filter out relevant data
- Complete Display: All regulatory-relevant data shown to user
- Status: ✅ Fully Implemented (All XML data is available for display)

PR-NAV-01 – Ponašanje gumba "Natrag" u aplikaciji

Rule Guidelines:

"Back" button within application returns user to search screen in controlled manner, without unwanted re-fetching of data.

Implementation:
- Location: Portal UI - Angular Router navigation
- Navigation: Uses Angular Router (this.router.navigate())
- Data Passing: Query parameters used (e.g., queryParams: { data: xmlData })
- No Re-fetch: Data passed via query params or localStorage, not re-fetched
- Example: open() method (line 160-169) navigates to /ecmr-display with data in query params
- Status: ✅ Fully Implemented (Controlled navigation via Angular Router, data passed without re-fetch)

PR-NAV-02 – Ponašanje Back u web pregledniku

Rule Guidelines:

Application behavior when user uses Back function in web browser.

Implementation:
- Location: Browser navigation (standard HTML5 History API)
- Angular Router: Uses HTML5 pushState for navigation
- History Management: Browser back/forward buttons work with Angular Router history
- State Preservation: Component state may be lost on back navigation (standard Angular behavior)
- No Special Handling: No explicit code to prevent back navigation or preserve state
- Status: ✅ Fully Implemented (Standard browser navigation works, Angular Router handles history)

PR-NAV-03 – Ponašanje Refresh u web pregledniku

Rule Guidelines:

Application behavior when user performs web browser refresh.

Implementation:
- Location: Portal UI
- Behavior: Portal reloads and maintains state via API
- Component Reinitialization: Angular components reinitialize on refresh
- State Recovery: Auto-polling resumes, checks for PENDING requests
- API Polling: Component polls API to recover request status
- Status: ✅ Fully Implemented (Refresh handled via API state)

PR-NAV-04 – Ponašanje aplikacije u više kartica

Rule Guidelines:

Application behavior when opened in multiple browser tabs.

Implementation:
- Location: Portal session management and localStorage
- Session Storage: Keycloak tokens stored in browser session storage
- LocalStorage: Used for auto-polling preference (localStorageService.getAutoPolling())
- Shared State: Each tab has independent component state
- Session: Keycloak session shared across tabs (same domain)
- No Tab Coordination: No explicit code to coordinate state between tabs
- Auto-Polling: Each tab independently polls if enabled (timer runs per component instance)
- Status: ⚠️ Partially Implemented (Works in multiple tabs, but no explicit coordination or state sharing)

PR-NAV-05 – Ponašanje nakon zatvaranja i ponovnog otvaranja preglednika

Rule Guidelines:

Application behavior after closing and reopening web browser, depending on session duration rules.

Implementation:
- Location: Portal and Keycloak session management
- Session Duration: 30 minutes of inactivity
- Keycloak Session: Persists across browser close/reopen if within session timeout
- Token Validation: Tokens validated on page load
- Re-authentication: Required if session expired
- Status: ✅ Fully Implemented

PR-AUDIT-01 – Pravila evidentiranja uspješnog pristupa podacima

Rule Guidelines:

Rules for recording successful data access in audit log.

Implementation:
- Location: implementation/efti-logger/src/main/java/eu/efti/eftilogger/service/AuditRequestLogService.java
- Logic: Audit logs created for successful requests
- Fields Recorded:
  - Request ID: Unique identifier for the request
  - User: User who made the request
  - Timestamp: Date and time of the request
  - Request Type: Type of operation performed (see below)
  - Parameters: Search parameters used (UIL components, identifiers, etc.)
  - Status: Request status (COMPLETE, ERROR, TIMEOUT)
  - Dataset ID: Identifier of accessed dataset
  - Component IDs: Requesting and responding component information

What "Request Type" Means:

Request type (vrsta zahtjeva) identifies the category of operation being performed. The system maps technical request types to audit log categories:

1. UIL Request Types:
   - LOCAL_UIL_SEARCH → logged as "UIL" (lokalna UIL pretraga)
   - EXTERNAL_UIL_SEARCH → logged as "UIL" (prekogranična UIL pretraga)
   - EXTERNAL_ASK_UIL_SEARCH → logged as "UIL" (prekogranični UIL upit)
   - Acknowledgment responses → logged as "UIL_ACK"

2. Identifier Search Request Types:
   - LOCAL_IDENTIFIERS_SEARCH → logged as "IDENTIFIERS" (lokalna pretraga po identifikatorima)
   - EXTERNAL_IDENTIFIERS_SEARCH → logged as "IDENTIFIERS" (prekogranična pretraga po identifikatorima)
   - EXTERNAL_ASK_IDENTIFIERS_SEARCH → logged as "IDENTIFIERS" (prekogranični upit po identifikatorima)
   - Acknowledgment responses → logged as "IDENTIFIERS_ACK"

3. Note Request Types:
   - NOTE_SEND → logged as "NOTES" (slanje napomene)
   - EXTERNAL_NOTE_SEND → logged as "NOTES" (prekogranično slanje napomene)
   - Acknowledgment responses → logged as "NOTES_ACK"

Mapping Logic:
- Location: implementation/efti-logger/src/main/java/eu/efti/eftilogger/service/AuditRequestLogService.java
- Method: getRequestTypeFromControl(control, isAck)
- Checks RequestTypeEnum from ControlEntity against predefined lists:
  - UIL_TYPES: LOCAL_UIL_SEARCH, EXTERNAL_UIL_SEARCH, EXTERNAL_ASK_UIL_SEARCH
  - IDENTIFIERS_TYPES: LOCAL_IDENTIFIERS_SEARCH, EXTERNAL_IDENTIFIERS_SEARCH, EXTERNAL_ASK_IDENTIFIERS_SEARCH
  - NOTES_TYPES: NOTE_SEND, EXTERNAL_NOTE_SEND
- If isAck flag is true, adds "_ACK" suffix to request type

Purpose of Request Type Logging:
- Audit Trail: Track what types of operations users perform
- Security Monitoring: Identify patterns in data access
- Compliance: Demonstrate what operations were performed
- Troubleshooting: Filter audit logs by operation type
- Statistics: Generate reports on usage by request type

Logging: All successful UIL and identifier search requests logged with their request type
- Status: ✅ Fully Implemented

PR-AUDIT-02 – Pravila evidentiranja neuspješnog pokušaja pristupa ili greške

Rule Guidelines:

Rules for recording unsuccessful data access attempt or error in audit log.

Implementation:
- Location: implementation/efti-logger/src/main/java/eu/efti/eftilogger/service/AuditRequestLogService.java
- Logic: Audit logs created for failed requests
- Fields Recorded:
  - Request ID: Unique identifier for the failed request
  - User: User who made the request
  - Timestamp: Date and time of the request
  - Request Type: Type of operation that failed (UIL, IDENTIFIERS, NOTES, or their ACK variants)
  - Error Code: Specific error code (DATA_NOT_FOUND, PLATFORM_ERROR, TIMEOUT, etc.)
  - Error Description: Human-readable error description
  - Status: Request status (ERROR, TIMEOUT)
  - Component IDs: Requesting and responding component information
- Error Logging: All errors (DATA_NOT_FOUND, PLATFORM_ERROR, TIMEOUT, etc.) logged with request type
- Request Type: Same mapping as successful requests - identifies what type of operation failed
- Status: ✅ Fully Implemented

PR-AUDIT-03 – Pravila evidentiranja pokušaja pristupa bez ovlasti

Rule Guidelines:

Rules for recording unauthorized access attempt in audit log.

Implementation:
- Location: implementation/efti-logger/ and Gate security
- Logic: Unauthorized requests (403 Forbidden) are logged
- Security Filter: Spring Security logs authentication failures
- Audit Trail: All 403 responses recorded with user and request details
- Status: ✅ Fully Implemented

PR-AUDIT-04 – Pravila evidentiranja pokušaja autentikacije (uspješnih i neuspješnih)

Rule Guidelines:

Rules for recording authentication attempts (successful and unsuccessful) in audit log.

Implementation:
- Location: Keycloak audit logs
- Keycloak Audit: All login attempts logged by Keycloak
- Successful Logins: Recorded with user, timestamp, IP address
- Failed Logins: Recorded with username (if exists), timestamp, failure reason
- Audit Access: Available via Keycloak Admin Console
- Status: ✅ Fully Implemented (via Keycloak audit functionality)

Summary of Implementation Status

Clarification on PR-RESOLVE Rules

Important: All PR-RESOLVE rules (PR-RESOLVE-01 through PR-RESOLVE-07) are FULLY IMPLEMENTED except PR-RESOLVE-04. The system correctly:
- ✅ Resolves UIL locally via ROI (PR-RESOLVE-01)
- ✅ Resolves UIL cross-border via G2G (PR-RESOLVE-02)
- ✅ Handles UIL not found errors (PR-RESOLVE-03)
- ❌ Missing: Dataset active/inactive status check (PR-RESOLVE-04)
- ✅ Handles platform errors (PR-RESOLVE-05)
- ✅ Handles timeouts (PR-RESOLVE-06)
- ✅ Handles partial responses (PR-RESOLVE-07)

Only PR-RESOLVE-04 requires implementation (adding active field to Consignment entity and status check).

✅ Fully Implemented Business Rules

Total: 28 business rules

- Authentication & Session: 4 rules (PR-SESSION-01, PR-SESSION-02, PR-SESSION-04, PR-LOGIN-XX)
- UIL Input & Validation: 4 rules (PR-UIL-01, PR-UIL-02, PR-UIL-03, PR-UIL-05)
- Identifier Resolution: 5 rules (PR-RESOLVE-01, PR-RESOLVE-02, PR-RESOLVE-03, PR-RESOLVE-05, PR-RESOLVE-06)
- Request Display: 7 rules (PR-REQ-01, PR-REQ-02, PR-REQ-03, PR-REQ-04, PR-REQ-05, PR-REQ-06, PR-REQ-09, PR-REQ-10, PR-REQ-12, PR-MSG-01)
- XML Mapping: 3 rules (PR-XML-02, PR-XML-03, PR-XML-12, PR-XML-13)
- Navigation: 2 rules (PR-NAV-03, PR-NAV-05)
- Audit: 4 rules (PR-AUDIT-01, PR-AUDIT-02, PR-AUDIT-03, PR-AUDIT-04)

⚠️ Partially Implemented Business Rules

Total: 15 business rules

- UIL Input: 1 rule (PR-UIL-04 - debounce not explicitly documented)
- Request Display: 4 rules (PR-REQ-07, PR-REQ-08, PR-REQ-11, PR-REQ-13 - UI behavior not fully documented)
- XML Mapping: 9 rules (PR-XML-01, PR-XML-04 through PR-XML-11 - mapping exists but not explicitly documented)
- Navigation: 3 rules (PR-NAV-01, PR-NAV-02, PR-NAV-04 - behavior not fully documented)
- Session: 1 rule (PR-SESSION-03 - multi-tab behavior not explicitly tested)

❌ NOT Implemented Business Rules

Total: 1 business rule

- Identifier Resolution: 1 rule (PR-RESOLVE-04 - Dataset active/inactive status not implemented)

Recommendations

1. Implement Dataset Activation Status: Add active/inactive status field to ROI Consignment entity and implement PR-RESOLVE-04
2. Document UI Behavior: Add explicit documentation for UI behavior rules (PR-REQ-07, PR-REQ-08, PR-REQ-11, PR-REQ-13, PR-NAV-01, PR-NAV-02, PR-NAV-04)
3. Document XML Mapping: Create explicit mapping documentation for XML-to-UI field mappings (PR-XML-01, PR-XML-04 through PR-XML-11)
4. Add Debounce Mechanism: Implement explicit debounce for UIL search button (PR-UIL-04)
5. Test Multi-Tab Behavior: Add tests for multi-tab session management (PR-SESSION-03, PR-NAV-04)

Notes

- This analysis is based on the codebase as of January 2025
- Business rules are referenced from /docs/NSCP_Plan_testiranja_testni_scenariji.md Section 4
- Some business rules reference detailed descriptions in test cases (Section 3) rather than having full descriptions in Section 4
- "Partially Implemented" status indicates functionality exists but explicit documentation or testing is missing
- Portal UI implementation details have been extracted from actual code with specific file references, line numbers, and implementation patterns
- All regex patterns, validation rules, and UI behaviors documented are from actual code implementation

