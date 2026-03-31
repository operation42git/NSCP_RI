# AAP Mapping to Reference Implementation

## Overview

**AAP** stands for **Access Authorization Point** - a component intended to handle authentication and authorization in production environments. In the reference implementation, AAP is partially implemented as a separate interface with certificate-based authentication.

### ⚠️ Important Clarification

**AAP is NOT used for portal authentication.** Portal users authenticate directly with Keycloak. AAP is a **separate interface** for external systems (like customs systems) that need to access eFTI data programmatically using certificate-based authentication.

**Two Separate Authentication Flows:**
1. **Portal Users** → Keycloak (JWT) → `/v1/control/*` endpoints
2. **External Systems** → X.509 Certificate → `/v1/aap/control/*` endpoints

The documentation note about "some authentication/authorization should ideally be handled by AAP" refers to **additional authorization policies** that would be enforced by AAP in production (e.g., checking if an authority is allowed to query certain data), but this is **not implemented** in the reference version.

---

## Definition

From `REFERENCE_IMPLEMENTATION_USER_GUIDE.md`:
> **AAP (Access Authorization Point)** - In a production environment, some of the authentication and authorization checks should ideally be handled by the AAP, which is not fully implemented in this reference version.

---

## Implementation Mapping

### 1. Authentication Method

**AAP uses X.509 Certificate Authentication** (different from regular portal users who use Keycloak JWT tokens)

#### Security Configuration (`SecurityConfig.java`)

```java
@Profile("certAuth")
@Order(3)
@Bean
public SecurityFilterChain certAuthfilterChain(HttpSecurity http) throws Exception {
    http.securityMatcher("/v1/aap/**")
        .csrf(AbstractHttpConfigurer::disable)
        .authorizeHttpRequests(authorize -> authorize
            .requestMatchers("/v1/aap/**")
            .authenticated())
        .x509(x509configurer -> x509configurer
            .subjectPrincipalRegex("CN=(.*?)(?:,|$)")
            .userDetailsService(X509userDetailsService()));
    return http.build();
}
```

**Key Points:**
- **Profile**: Requires `certAuth` profile to be active
- **Authentication**: X.509 client certificate authentication
- **Principal Extraction**: Extracts Common Name (CN) from certificate subject
- **Role Assignment**: Automatically assigns `ROLE_EXT_AAP` role to authenticated users

#### User Details Service

```java
@Bean
public UserDetailsService X509userDetailsService() {
    return new UserDetailsService() {
        @Override
        public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
            return new User(username, "",
                AuthorityUtils.createAuthorityList(Roles.ROLE_EXT_AAP));
        }
    };
}
```

**All certificate-authenticated users receive `ROLE_EXT_AAP` role automatically.**

---

### 2. Endpoints

AAP provides three sets of endpoints, all under `/v1/aap/control/`:

#### A. UIL Query Endpoints

**Controller**: `AapControlController`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/aap/control/uil` | Send a UIL query request |
| GET | `/v1/aap/control/uil?requestId={id}` | Get response to a UIL query |

**Differences from regular UIL endpoints:**
- Regular endpoints: `/v1/control/uil` (requires `ROLE_ROAD_CONTROLER`)
- AAP endpoints: `/v1/aap/control/uil` (requires `ROLE_EXT_AAP`)
- **AAP requests include `authority` field** (see DTO differences below)

#### B. Identifier Search Endpoints

**Controller**: `AapIdentifiersController`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/aap/control/identifiers` | Send an identifier search request |
| GET | `/v1/aap/control/identifiers?requestId={id}` | Get response to an identifier search |

**Differences from regular identifier endpoints:**
- Regular endpoints: `/v1/control/identifiers` (requires `ROLE_ROAD_CONTROLER`)
- AAP endpoints: `/v1/aap/control/identifiers` (requires `ROLE_EXT_AAP`)
- **AAP requests include `authority` field**

#### C. Follow-up Communication Endpoint

**Controller**: `AapNoteController`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/v1/aap/control/uil/follow-up` | Send follow-up communication to platform |

**Note**: This endpoint is **only available via AAP interface** (no regular equivalent).

---

### 3. Data Transfer Objects (DTOs)

#### A. `AapUilDto` vs `UilDto`

**Regular UIL Request** (`UilDto`):
```java
public class UilDto extends AbstractUilDto {
    private List<String> subsetIds;
    // Inherits from AbstractUilDto:
    // - gateId
    // - datasetId
    // - platformId
}
```

**AAP UIL Request** (`AapUilDto`):
```java
public class AapUilDto extends UilDto {
    @NotNull(message = "AUTHORITY_MISSING")
    private AuthorityDto authority;  // ← Additional field
}
```

**Key Difference**: AAP requests **must include** an `authority` object identifying the requesting authority.

#### B. `AapSearchWithIdentifiersRequestDto` vs `SearchWithIdentifiersRequestDto`

**Regular Identifier Request** (`SearchWithIdentifiersRequestDto`):
- Contains identifier search parameters (identifier, identifierType, modeCode, etc.)

**AAP Identifier Request** (`AapSearchWithIdentifiersRequestDto`):
```java
public class AapSearchWithIdentifiersRequestDto extends SearchWithIdentifiersRequestDto {
    @NotNull(message = "AUTHORITY_MISSING")
    private AuthorityDto authority;  // ← Additional field
}
```

**Key Difference**: AAP requests **must include** an `authority` object.

#### C. `AuthorityDto` Structure

```java
public class AuthorityDto {
    private int id;
    private String country;  // 2-letter country code
    private ContactInformationDto legalContact;
    private ContactInformationDto workingContact;
    private Boolean isEmergencyService;
    private String name;
    private String nationalUniqueIdentifier;
}
```

**Purpose**: Identifies the authority making the request (e.g., customs office, road control authority).

---

### 4. Role-Based Access Control

| Role | Endpoints | Authentication Method |
|------|-----------|----------------------|
| `ROLE_ROAD_CONTROLER` | `/v1/control/*` | Keycloak JWT (OAuth2) |
| `ROLE_EXT_AAP` | `/v1/aap/control/*` | X.509 Client Certificate |
| `ROLE_PLATFORM` | `/api/platform/*` | Header-based pre-authentication |

**Security Annotation Example**:
```java
@PostMapping("/aap/control/uil")
@Secured(Roles.ROLE_EXT_AAP)
ResponseEntity<RequestIdDto> requestUil(@RequestBody AapUilDto uilDto);
```

---

### 5. Setup Requirements

To enable AAP interface, the following configuration is required:

#### A. Enable Certificate Authentication Profile

In `efti-gate/gate/ENV/BO.env` (or equivalent):
```bash
PROFILE=BO,certAuth  # Add 'certAuth' to enable TLS/certificate auth
```

#### B. Configure TLS Trust Store (for Domibus)

In `domibus/sh/setenv-node-1.sh`:
```bash
export JAVA_OPTS="$JAVA_OPTS -Djavax.net.ssl.trustStore=/opt/domibus/conf/ca_cert/root_ca.jks"
export JAVA_OPTS="$JAVA_OPTS -Djavax.net.ssl.trustStorePassword=changeit"
```

#### C. Client Certificate Configuration

- **Certificate File**: `gate.pfx` (included in gate resources)
- **Hostname**: `https://efti.gate.borduria.eu:8880` (or equivalent)
- **Certificate CN**: Extracted as username for authentication

---

### 6. Request Flow Comparison

#### Regular Portal User Flow:
```
1. User logs in via Portal → Keycloak
2. Portal receives JWT token
3. Portal sends request to /v1/control/uil with Bearer token
4. Gate validates JWT → extracts ROLE_ROAD_CONTROLER
5. Gate processes request
```

#### AAP Flow:
```
1. External system presents client certificate
2. Gate validates certificate → extracts CN as username
3. Gate assigns ROLE_EXT_AAP automatically
4. External system sends request to /v1/aap/control/uil with certificate
5. Gate validates certificate → authorizes with ROLE_EXT_AAP
6. Gate processes request (includes authority information)
```

---

### 7. Implementation Status

#### ✅ What IS Implemented:
- Certificate-based authentication (`certAuth` profile)
- AAP endpoints (UIL, identifiers, follow-up)
- `ROLE_EXT_AAP` role assignment
- `AuthorityDto` inclusion in AAP requests
- Security filter chain for `/v1/aap/**` paths
- Controllers and API interfaces

#### ❌ What is NOT Fully Implemented:
- Full IAM (Identity and Access Management) system
- Production-grade authorization policies
- Authority validation against database/registry
- Certificate revocation checking
- Advanced authorization rules based on authority type

**Note**: The reference implementation uses Keycloak for regular users, but AAP is intended to be a separate authorization system that would handle more complex authorization scenarios in production.

---

### 8. Testing

AAP endpoints can be tested using:
- **Postman**: Configure client certificate authentication
- **Test Collection**: `utils/eFTI.postman_collection.json` (folder `BO/AAP`)
- **Certificate**: Use `gate.pfx` file from gate resources

**Example Request** (from Postman collection):
```json
POST /v1/aap/control/uil
{
  "gateId": "borduria",
  "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
  "platformId": "acme",
  "authority": {
    "id": 1,
    "country": "BO",
    "name": "Borduria Customs Authority",
    "nationalUniqueIdentifier": "BO-CUSTOMS-001",
    "isEmergencyService": false,
    "legalContact": { ... },
    "workingContact": { ... }
  }
}
```

---

## Summary

**AAP in the Reference Implementation:**

1. **Definition**: Access Authorization Point - intended for production authorization
2. **Authentication**: X.509 client certificate (different from Keycloak JWT)
3. **Endpoints**: Separate `/v1/aap/control/*` endpoints
4. **Role**: `ROLE_EXT_AAP` (automatically assigned)
5. **Key Difference**: AAP requests include `authority` object
6. **Status**: Partially implemented (certificate auth works, but full IAM not implemented)
7. **Use Case**: External systems (like customs systems) that need to query eFTI data with authority identification

### Key Point: AAP vs Portal Authentication

**AAP is NOT involved in portal user authentication:**

- ✅ **Portal users** authenticate via **Keycloak** → use `/v1/control/*` endpoints
- ✅ **External systems** authenticate via **X.509 certificates** → use `/v1/aap/control/*` endpoints
- ❌ **AAP does NOT authenticate portal users** - portal users go directly to Keycloak
- ⚠️ The note about "AAP should handle authorization" refers to **additional authorization policies** that would be enforced by AAP in production (not implemented in reference version)

The reference implementation demonstrates the **interface** and **authentication mechanism** for AAP, but notes that a full production AAP system would need additional authorization logic and integration with authority registries. Portal users bypass AAP entirely and authenticate directly with Keycloak.

