# AAP vs Portal Authentication - Clarification

## The Confusion

The documentation mentions that "some authentication/authorization should ideally be handled by AAP", which can be confusing. This document clarifies what this means and how AAP relates to portal authentication.

---

## Short Answer

**❌ NO - AAP is NOT used when users log in through the portal.**

Portal users authenticate **directly with Keycloak**. AAP is a **separate interface** for external systems.

---

## Two Completely Separate Authentication Flows

### Flow 1: Portal User Authentication (What Actually Happens)

```
┌─────────┐
│  User   │
│ (Browser)│
└────┬────┘
     │
     │ 1. Navigate to portal
     ▼
┌─────────────────┐
│   Portal UI      │
│  (portal-mock)   │
└────┬────────────┘
     │
     │ 2. User enters credentials
     │ 3. Portal sends to Keycloak
     ▼
┌─────────────────┐
│    Keycloak     │ ◄─── Direct authentication
│  (OAuth2/OIDC)  │      NO AAP involved
└────┬────────────┘
     │
     │ 4. Keycloak validates & issues JWT
     │ 5. Portal receives JWT token
     ▼
┌─────────────────┐
│   Portal UI     │
│  (with JWT)     │
└────┬────────────┘
     │
     │ 6. Portal makes API calls with JWT
     │    Authorization: Bearer <jwt_token>
     ▼
┌─────────────────┐
│      Gate       │
│  /v1/control/*  │ ◄─── Regular endpoints
└─────────────────┘
```

**Key Points:**
- ✅ Portal → Keycloak (direct)
- ✅ Portal → Gate with JWT token
- ✅ Uses `/v1/control/*` endpoints
- ✅ Role: `ROLE_ROAD_CONTROLER`
- ❌ **AAP is NOT involved**

---

### Flow 2: AAP Authentication (Separate Interface)

```
┌─────────────────┐
│ External System │
│ (e.g., Customs) │
└────┬────────────┘
     │
     │ 1. System presents client certificate
     │    (X.509 certificate)
     ▼
┌─────────────────┐
│      Gate       │
│  Certificate    │ ◄─── Certificate validation
│  Validator      │      (certAuth profile)
└────┬────────────┘
     │
     │ 2. Gate extracts CN from certificate
     │ 3. Gate assigns ROLE_EXT_AAP
     │ 4. System makes API calls
     │    (with certificate)
     ▼
┌─────────────────┐
│      Gate       │
│ /v1/aap/control/*│ ◄─── AAP endpoints
└─────────────────┘
```

**Key Points:**
- ✅ External System → Gate with X.509 certificate
- ✅ Uses `/v1/aap/control/*` endpoints
- ✅ Role: `ROLE_EXT_AAP`
- ✅ Must include `authority` object in requests
- ❌ **Keycloak is NOT involved**

---

## What Does "AAP Should Handle Authorization" Mean?

The confusing statement in the documentation:

> "In a production environment, some of the authentication and authorization checks should ideally be handled by the AAP"

**This does NOT mean:**
- ❌ Portal users should authenticate through AAP
- ❌ AAP validates portal user credentials
- ❌ AAP is part of the portal login flow

**This DOES mean:**
- ✅ In production, AAP would enforce **additional authorization policies**
- ✅ Examples of what AAP would check:
  - Is this authority allowed to query this specific dataset?
  - Does this authority have permission to access data from this country?
  - Is this an emergency service request?
  - What data subsets can this authority access?
- ✅ These checks would happen **after** authentication (authorization, not authentication)
- ⚠️ **This is NOT implemented** in the reference version

---

## Current Implementation Status

### Portal Authentication (Implemented ✅)
- Portal users authenticate with Keycloak
- Keycloak issues JWT tokens
- Portal uses JWT to call `/v1/control/*` endpoints
- Gate validates JWT and checks `ROLE_ROAD_CONTROLER`
- **Works as-is, no AAP needed**

### AAP Interface (Partially Implemented ⚠️)
- Certificate authentication works (`certAuth` profile)
- AAP endpoints exist (`/v1/aap/control/*`)
- Role assignment works (`ROLE_EXT_AAP`)
- **Missing**: Additional authorization policies
- **Missing**: Authority validation against registry
- **Missing**: Fine-grained access control

### What's Missing (Not Implemented ❌)
- AAP authorization policies (what authorities can access what data)
- Authority registry integration
- Fine-grained access control based on authority type
- Emergency service validation
- Country-specific access rules

---

## Visual Comparison

| Aspect | Portal Users | AAP (External Systems) |
|--------|--------------|------------------------|
| **Authentication** | Keycloak (OAuth2/JWT) | X.509 Client Certificate |
| **Who Uses It** | Human users via browser | External systems (programmatic) |
| **Endpoints** | `/v1/control/*` | `/v1/aap/control/*` |
| **Role** | `ROLE_ROAD_CONTROLER` | `ROLE_EXT_AAP` |
| **Request Format** | Standard UIL/Identifier DTOs | Same + `authority` object required |
| **Token Type** | JWT Bearer token | Client certificate |
| **Profile Required** | None (default) | `certAuth` profile |
| **AAP Involvement** | ❌ None | ✅ Certificate validation + role assignment |

---

## Example Scenarios

### Scenario 1: Road Inspector Uses Portal
1. Inspector opens browser → `http://portal.efti.fr:83`
2. Portal redirects to Keycloak login
3. Inspector enters username/password
4. Keycloak validates → issues JWT
5. Portal stores JWT → makes API calls
6. Gate validates JWT → processes request
7. **AAP is NOT involved at any step**

### Scenario 2: Customs System Queries eFTI
1. Customs system has client certificate (`gate.pfx`)
2. Customs system connects to `https://efti.gate.borduria.eu:8880`
3. Gate validates certificate → extracts CN → assigns `ROLE_EXT_AAP`
4. Customs system calls `POST /v1/aap/control/uil` with `authority` object
5. Gate processes request (certificate already validated)
6. **Keycloak is NOT involved**

### Scenario 3: What Production AAP Would Do (Not Implemented)
1. Customs system authenticates with certificate ✅ (implemented)
2. AAP checks: "Is this authority allowed to query this dataset?" ❌ (not implemented)
3. AAP checks: "Does this authority have access to data from country X?" ❌ (not implemented)
4. AAP checks: "Is this an emergency request?" ❌ (not implemented)
5. If all checks pass → process request
6. **This authorization logic is missing** in reference implementation

---

## Summary

**To answer your question directly:**

> "AAP is not used if the user logs through the portal?"

**✅ CORRECT - AAP is NOT used for portal authentication.**

- Portal users authenticate **directly with Keycloak**
- AAP is a **separate interface** for external systems
- The documentation note about AAP refers to **additional authorization policies** that would be enforced by AAP in production (not implemented)
- These policies would be **authorization checks**, not authentication checks
- Portal users bypass AAP entirely

**Think of it this way:**
- **Portal** = Web interface for human users → Keycloak authentication
- **AAP** = API interface for external systems → Certificate authentication
- They are **two separate entry points** to the same gate system

