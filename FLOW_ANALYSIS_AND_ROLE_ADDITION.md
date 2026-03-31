# Flow Analysis and Role Addition Guide

## 1. Flow Verification: Does the Suggested Flow Work?

### Current State vs. Proposed State

**❌ The flow described in PILOT_SETUP_GUIDE.md is NOT currently implemented.** The guide proposes new functionality that needs to be added.

### Current Implementation Analysis

#### ✅ What EXISTS:
1. **Subset filtering infrastructure** (`SubsetUtils.parseBySubsets()`)
   - Located in `implementation/platform-gate-simulator/src/main/java/eu/efti/platformgatesimulator/utils/SubsetUtils.java`
   - Uses XPath-based filtering from XSD schema annotations
   - Works correctly when subset IDs are provided

2. **Subset ID propagation**
   - `UilDto` has `subsetIds` field (List<String>)
   - `ControlDto` stores `subsetIds`
   - Subset IDs are passed through the entire flow:
     - Controller → Service → Platform → SubsetUtils

3. **Role-based authentication**
   - Keycloak integration exists
   - JWT token validation works
   - Role extraction via `KeycloakResourceRolesConverter`
   - `@Secured` annotations protect endpoints

#### ❌ What's MISSING (from PILOT_SETUP_GUIDE.md):

1. **Role-to-subset mapping logic**
   - The guide suggests `getSubsetIdsFromRole()` method in `ControlService`
   - **Current code**: `ControlService.createUilControl()` does NOT extract roles from Authentication
   - **Current code**: Uses `subsetIds` directly from `UilDto` without role-based defaults

2. **Authentication parameter in controller**
   - The guide suggests `requestUil(@RequestBody UilDto uilDto, Authentication authentication)`
   - **Current code**: `ControlController.requestUil()` only receives `UilDto`, no `Authentication` parameter

3. **New role constants**
   - Guide suggests adding `ROLE_ROAD_INSPECTOR`, `ROLE_ADR_INSPECTOR`, `ROLE_CUSTOMS_INSPECTOR`
   - **Current code**: Only `ROLE_ROAD_CONTROLER` and `ROLE_EXT_AAP` exist in `Roles.java`

4. **Updated @Secured annotations**
   - Guide suggests adding new roles to `@Secured` annotations
   - **Current code**: Only `@Secured(Roles.ROLE_ROAD_CONTROLER)` exists

### Flow Verification Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Keycloak realm setup | ✅ Works | Can create realms, roles, users |
| JWT authentication | ✅ Works | Token validation functional |
| Role extraction | ✅ Works | `KeycloakResourceRolesConverter` extracts roles |
| Subset filtering | ✅ Works | `SubsetUtils` filters XML correctly |
| Role-to-subset mapping | ❌ **MISSING** | Needs implementation |
| Controller role handling | ❌ **MISSING** | Needs Authentication parameter |
| Portal role service | ❌ **MISSING** | Needs implementation |

**Conclusion**: The infrastructure exists, but the **role-based subset mapping logic needs to be implemented** as described in the guide.

---

## 2. Adding a New Role with Multiple Subsets

### Question: Do I just need to add it in Keycloak?

**Answer: ❌ NO - You need changes in multiple components.**

### Required Changes for a New Role (e.g., "COMMON_ROAD_INSPECTOR" with ["COMMON", "ROAD"] subsets)

#### 1. ✅ Keycloak Configuration (Required)
- Create the role in Keycloak realm
- Assign role to users
- **Location**: `deploy/local/efti-gate/keycloak/{realm}-export.json`

```json
{
  "realm": "eFTI_HR",
  "roles": {
    "realm": [
      {
        "name": "COMMON_ROAD_INSPECTOR",
        "description": "Inspector with access to common and road subsets"
      }
    ]
  },
  "users": [
    {
      "username": "common_road_inspector_hr",
      "realmRoles": ["COMMON_ROAD_INSPECTOR"],
      "attributes": {
        "subset_ids": ["COMMON", "ROAD"]  // Optional: can be in code instead
      }
    }
  ]
}
```

#### 2. ✅ Gate Backend - Roles.java (Required)
- Add role constant
- **File**: `implementation/gate/src/main/java/eu/efti/eftigate/config/security/Roles.java`

```java
public static final String ROLE_COMMON_ROAD_INSPECTOR = ROLE_PREFIX + "COMMON_ROAD_INSPECTOR";
```

#### 3. ✅ Gate Backend - Controller API (Required)
- Update `@Secured` annotations to include new role
- **File**: `implementation/gate/src/main/java/eu/efti/eftigate/controller/api/ControlControllerApi.java`

```java
@PostMapping("/control/uil")
@Secured({Roles.ROLE_ROAD_CONTROLER, Roles.ROLE_COMMON_ROAD_INSPECTOR})
ResponseEntity<RequestIdDto> requestUil(@RequestBody UilDto uilDto);
```

#### 4. ✅ Gate Backend - Controller Implementation (Required)
- Add `Authentication` parameter to extract role
- **File**: `implementation/gate/src/main/java/eu/efti/eftigate/controller/ControlController.java`

```java
@Override
public ResponseEntity<RequestIdDto> requestUil(
    @RequestBody final UilDto uilDto,
    Authentication authentication) {  // ADD THIS PARAMETER
    log.info("POST on /control/uil with params gateId: {}, datasetId: {}, platformId: {}", 
        uilDto.getGateId(), uilDto.getDatasetId(), uilDto.getPlatformId());
    return new ResponseEntity<>(
        controlService.createUilControl(uilDto, authentication),  // PASS AUTHENTICATION
        HttpStatus.ACCEPTED);
}
```

#### 5. ✅ Gate Backend - ControlService (Required)
- Implement role-to-subset mapping
- **File**: `implementation/gate/src/main/java/eu/efti/eftigate/service/ControlService.java`

```java
public List<String> getSubsetIdsFromRole(String role, Authentication authentication) {
    Map<String, List<String>> roleSubsetMap = Map.of(
        "ROAD_INSPECTOR", List.of("ROAD", "IDENTIFIER"),
        "ADR_INSPECTOR", List.of("ADR", "DANGEROUS_GOODS"),
        "CUSTOMS_INSPECTOR", List.of("CUSTOMS", "IDENTIFIER"),
        "COMMON_ROAD_INSPECTOR", List.of("COMMON", "ROAD"),  // NEW ROLE
        "ROAD_CONTROLER", List.of("full")  // Backward compatibility
    );
    return roleSubsetMap.getOrDefault(role, List.of("full"));
}

@Transactional("controlTransactionManager")
public RequestIdDto createUilControl(final UilDto uilDto, Authentication authentication) {
    log.info("create Uil control for dataset id : {}", uilDto.getDatasetId());
    
    // Extract role from authentication
    String role = authentication.getAuthorities().stream()
        .map(GrantedAuthority::getAuthority)
        .filter(a -> a.startsWith("ROLE_"))
        .map(a -> a.replace("ROLE_", ""))
        .findFirst()
        .orElse("ROAD_CONTROLER");
    
    // Get subset IDs based on role if not provided
    if (uilDto.getSubsetIds() == null || uilDto.getSubsetIds().isEmpty()) {
        List<String> subsetIds = getSubsetIdsFromRole(role, authentication);
        uilDto.setSubsetIds(subsetIds);
    }
    
    boolean isLocal = gateProperties.isCurrentGate(uilDto.getGateId());
    return createControl(uilDto, ControlUtils
                    .fromUilControl(uilDto, isLocal ? RequestTypeEnum.LOCAL_UIL_SEARCH : RequestTypeEnum.EXTERNAL_UIL_SEARCH),
            (dto) -> validateControl(dto)
                    .or(() -> isLocal ? (platformIntegrationService.platformExists(dto.getPlatformId()) ? Optional.empty() : Optional.of(ErrorDto.fromErrorCode(ErrorCodesEnum.PLATFORM_ID_DOES_NOT_EXIST))) : Optional.empty()));
}
```

#### 6. ✅ Platform - SubsetUtils (No changes needed)
- Already supports multiple subset IDs
- `SubsetUtils.parseBySubsets(xml, List.of("COMMON", "ROAD"))` works correctly

#### 7. ⚠️ Portal Application (Optional but recommended)
- Add role to `RoleService` enum
- Update UI rendering logic
- **File**: `portal-mock/src/app/core/services/role.service.ts`

```typescript
export enum UserRole {
  ROAD_INSPECTOR = 'ROAD_INSPECTOR',
  ADR_INSPECTOR = 'ADR_INSPECTOR',
  CUSTOMS_INSPECTOR = 'CUSTOMS_INSPECTOR',
  COMMON_ROAD_INSPECTOR = 'COMMON_ROAD_INSPECTOR',  // NEW
  ROAD_CONTROLER = 'ROAD_CONTROLER'
}

getDefaultSubsetIds(): string[] {
  const role = this.getCurrentRole();
  switch (role) {
    case UserRole.COMMON_ROAD_INSPECTOR:
      return ['COMMON', 'ROAD'];  // NEW
    // ... other cases
  }
}
```

### Summary: Components That Need Changes

| Component | Required? | Change Type |
|-----------|-----------|-------------|
| Keycloak realm config | ✅ **YES** | Add role, assign to users |
| `Roles.java` | ✅ **YES** | Add role constant |
| Controller API interface | ✅ **YES** | Update `@Secured` annotation |
| Controller implementation | ✅ **YES** | Add `Authentication` parameter |
| `ControlService` | ✅ **YES** | Implement role-to-subset mapping |
| Platform `SubsetUtils` | ❌ NO | Already supports multiple subsets |
| Portal `RoleService` | ⚠️ **RECOMMENDED** | Add role enum, update UI |

### Minimal Implementation (Backend Only)

If you only want backend functionality without portal changes:

1. ✅ Keycloak: Add role
2. ✅ `Roles.java`: Add constant
3. ✅ Controller: Update `@Secured` and add `Authentication` parameter
4. ✅ `ControlService`: Implement role-to-subset mapping

**Total**: 4 components need changes (minimum)

---

## 3. Implementation Checklist

### To Make PILOT_SETUP_GUIDE.md Flow Work:

- [ ] Add new role constants to `Roles.java`
- [ ] Update `@Secured` annotations in `ControlControllerApi.java`
- [ ] Add `Authentication` parameter to `ControlController.requestUil()`
- [ ] Implement `getSubsetIdsFromRole()` in `ControlService`
- [ ] Update `createUilControl()` to use role-based subset mapping
- [ ] Test with Keycloak users having new roles
- [ ] Verify subset filtering works correctly

### To Add New Role with Multiple Subsets:

- [ ] Create role in Keycloak realm export
- [ ] Add role constant to `Roles.java`
- [ ] Update `@Secured` annotations
- [ ] Add `Authentication` parameter to controller
- [ ] Add role-to-subset mapping in `ControlService`
- [ ] (Optional) Update portal `RoleService` and UI

---

## 4. Testing Recommendations

1. **Test role extraction**: Verify JWT token contains correct role
2. **Test subset mapping**: Verify correct subsets are assigned based on role
3. **Test subset filtering**: Verify platform returns filtered XML
4. **Test backward compatibility**: Verify existing `ROAD_CONTROLER` role still works
5. **Test explicit subset override**: Verify users can still specify `subsetIds` in request

---

## Conclusion

**The flow in PILOT_SETUP_GUIDE.md is a PROPOSAL, not current implementation.** To make it work, you need to implement the role-to-subset mapping logic as described.

**Adding a new role requires changes in at least 4 backend components** (Keycloak, Roles.java, Controller, ControlService), plus optional portal changes for UI rendering.







