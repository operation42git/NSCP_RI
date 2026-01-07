# eFTI Pilot Setup Guide - 3 Gates, 3 Roles

## Overview

This guide provides step-by-step instructions to set up a 3-gate, 3-role pilot with:
- **3 Gates**: Croatia (HR), Slovenia (SLO), Austria (AT)
- **3 Platforms**: One per gate
- **3 Roles**: Road Inspector, ADR Inspector, Customs Inspector
- **3 Users**: One per role (with different dataset access)
- **Role-based subset filtering**: Each role sees different subsets of the same dataset
- **Role-based UI rendering**: Portal app displays different information based on user role

---

## Prerequisites

1. Docker and Docker Compose installed
2. Java 17+ and Maven for building
3. Node.js 18+ for portal mock
4. Access to deploy scripts

---

## Step-by-Step Setup

### 1. Keycloak Configuration

#### 1.1 Create Three New Realms

Create three Keycloak realm export files:

**File: `deploy/local/efti-gate/keycloak/hr-export.json`**

```json
{
  "realm": "eFTI_HR",
  "enabled": true,
  "sslRequired": "external",
  "roles": {
    "realm": [
      {
        "name": "ROAD_INSPECTOR",
        "description": "Road transport inspector role"
      },
      {
        "name": "ADR_INSPECTOR",
        "description": "ADR (dangerous goods) inspector role"
      },
      {
        "name": "CUSTOMS_INSPECTOR",
        "description": "Customs inspector role"
      }
    ]
  },
  "clients": [
    {
      "clientId": "gate",
      "enabled": true,
      "clientAuthenticatorType": "client-secret",
      "secret": "hr-gate-secret-key",
      "redirectUris": ["*"],
      "webOrigins": ["*"]
    },
    {
      "clientId": "portal",
      "enabled": true,
      "clientAuthenticatorType": "public",
      "redirectUris": ["http://portal.efti.fr:83/*"],
      "webOrigins": ["*"]
    }
  ],
  "users": [
    {
      "username": "road_inspector_hr",
      "enabled": true,
      "credentials": [{"type": "password", "value": "RoadInsp123!"}],
      "realmRoles": ["ROAD_INSPECTOR"],
      "attributes": {
        "subset_ids": ["ROAD", "IDENTIFIER"]
      }
    },
    {
      "username": "adr_inspector_hr",
      "enabled": true,
      "credentials": [{"type": "password", "value": "AdrInsp123!"}],
      "realmRoles": ["ADR_INSPECTOR"],
      "attributes": {
        "subset_ids": ["ADR", "DANGEROUS_GOODS"]
      }
    },
    {
      "username": "customs_inspector_hr",
      "enabled": true,
      "credentials": [{"type": "password", "value": "CustomsInsp123!"}],
      "realmRoles": ["CUSTOMS_INSPECTOR"],
      "attributes": {
        "subset_ids": ["CUSTOMS", "IDENTIFIER"]
      }
    },
    {
      "username": "platform_hr",
      "enabled": true,
      "credentials": [{"type": "password", "value": "PlatformHr123!"}],
      "realmRoles": ["PLATFORM"]
    }
  ]
}
```

**Repeat for SLO and AT** - create `slo-export.json` and `at-export.json` with:
- Realm: `eFTI_SLO` / `eFTI_AT`
- Gate secrets: `slo-gate-secret-key` / `at-gate-secret-key`
- Users: `road_inspector_slo`, `adr_inspector_slo`, `customs_inspector_slo`, `platform_slo` (same for AT)

#### 1.2 Import Realms into Keycloak

```bash
# Import HR realm
docker exec -i keycloak /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 --realm master \
  --user admin --password admin

docker exec keycloak /opt/keycloak/bin/kcadm.sh create realms \
  -f /tmp/hr-export.json

# Repeat for SLO and AT
```

**Or manually via Keycloak Admin Console:**
1. Go to http://localhost:8080
2. Login: admin / admin
3. Create realm "eFTI_HR"
4. Import from JSON file
5. Repeat for eFTI_SLO and eFTI_AT

#### 1.3 Update Roles in Gate Code

**File: `implementation/gate/src/main/java/eu/efti/eftigate/config/security/Roles.java`**

```java
package eu.efti.eftigate.config.security;

public final class Roles {
    private Roles() {}
    
    public static final String ROLE_PREFIX = "ROLE_";
    public static final String ROLE_ROAD_CONTROLER = ROLE_PREFIX + "ROAD_CONTROLER";
    public static final String ROLE_EXT_AAP = ROLE_PREFIX + "EXT_AAP";
    
    // New roles for pilot
    public static final String ROLE_ROAD_INSPECTOR = ROLE_PREFIX + "ROAD_INSPECTOR";
    public static final String ROLE_ADR_INSPECTOR = ROLE_PREFIX + "ADR_INSPECTOR";
    public static final String ROLE_CUSTOMS_INSPECTOR = ROLE_PREFIX + "CUSTOMS_INSPECTOR";
}
```

**File: `implementation/gate/src/main/java/eu/efti/eftigate/controller/api/ControlControllerApi.java`**

```java
@PostMapping("/control/uil")
@Secured({Roles.ROLE_ROAD_CONTROLER, Roles.ROLE_ROAD_INSPECTOR, 
          Roles.ROLE_ADR_INSPECTOR, Roles.ROLE_CUSTOMS_INSPECTOR})
ResponseEntity<RequestIdDto> requestUil(@RequestBody UilDto uilDto);

@GetMapping("/control/uil")
@Secured({Roles.ROLE_ROAD_CONTROLER, Roles.ROLE_ROAD_INSPECTOR, 
          Roles.ROLE_ADR_INSPECTOR, Roles.ROLE_CUSTOMS_INSPECTOR})
ResponseEntity<RequestIdDto> getRequestUil(@Parameter String requestId);
```

---

### 2. Gate Configuration

#### 2.1 Create Gate Environment Files

**File: `deploy/local/efti-gate/gate/ENV/HR.env`**

```bash
PROFILE=HR
PORT=8883
```

**File: `deploy/local/efti-gate/gate/ENV/SLO.env`**

```bash
PROFILE=SLO
PORT=8884
```

**File: `deploy/local/efti-gate/gate/ENV/AT.env`**

```bash
PROFILE=AT
PORT=8885
```

#### 2.2 Create Gate Application Configurations

**File: `deploy/local/efti-gate/gate/application-HR.yml`**

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
    username: efti
    password: root
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://auth.gate.croatia.eu:8480/realms/eFTI_HR

identifiers:
  datasource:
    url: jdbc:postgresql://psql-meta:5433/efti_identifiers_hr
    username: efti
    password: root

rabbitmq:
  queues:
    eftiReceiveMessageQueue: efti.receive-messages.q
    eftiSendMessageQueue: efti.send-messages.q
```

**Repeat for SLO and AT** with appropriate ports and database names.

#### 2.3 Implement Role-Based Subset Mapping

**File: `implementation/gate/src/main/java/eu/efti/eftigate/service/ControlService.java`**

Add method to extract subset IDs from user roles:

```java
public List<String> getSubsetIdsFromRole(String role, Authentication authentication) {
    // Get subset IDs from JWT token attributes
    if (authentication instanceof JwtAuthenticationToken) {
        JwtAuthenticationToken jwtToken = (JwtAuthenticationToken) authentication;
        Jwt jwt = jwtToken.getToken();
        
        // Get custom attributes from token
        Map<String, Object> attributes = jwt.getClaims();
        
        // Role to subset mapping
        Map<String, List<String>> roleSubsetMap = Map.of(
            "ROAD_INSPECTOR", List.of("ROAD", "IDENTIFIER"),
            "ADR_INSPECTOR", List.of("ADR", "DANGEROUS_GOODS"),
            "CUSTOMS_INSPECTOR", List.of("CUSTOMS", "IDENTIFIER"),
            "ROAD_CONTROLER", List.of("full")  // Backward compatibility
        );
        
        return roleSubsetMap.getOrDefault(role, List.of("full"));
    }
    return List.of("full");
}

public ControlDto createUilControl(UilDto uilDto, Authentication authentication) {
    // Extract user roles
    Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
    String role = authorities.stream()
        .map(GrantedAuthority::getAuthority)
        .filter(a -> a.startsWith("ROLE_"))
        .map(a -> a.replace("ROLE_", ""))
        .findFirst()
        .orElse("ROAD_CONTROLER");
    
    // Get subset IDs based on role
    List<String> subsetIds = getSubsetIdsFromRole(role, authentication);
    
    // If subsetId not provided in request, use role-based default
    if (uilDto.getSubsetId() == null || uilDto.getSubsetId().isEmpty()) {
        uilDto.setSubsetId(subsetIds);
    }
    
    // Continue with existing control creation logic...
    ControlDto controlDto = new ControlDto();
    controlDto.setSubsetIds(uilDto.getSubsetId());
    // ... rest of the logic
}
```

**File: `implementation/gate/src/main/java/eu/efti/eftigate/controller/ControlController.java`**

```java
@PostMapping("/control/uil")
@Secured({Roles.ROLE_ROAD_CONTROLER, Roles.ROLE_ROAD_INSPECTOR, 
          Roles.ROLE_ADR_INSPECTOR, Roles.ROLE_CUSTOMS_INSPECTOR})
public ResponseEntity<RequestIdDto> requestUil(
        @RequestBody UilDto uilDto, 
        Authentication authentication) {
    
    // Extract role from authentication
    String role = authentication.getAuthorities().stream()
        .map(GrantedAuthority::getAuthority)
        .filter(a -> a.startsWith("ROLE_"))
        .findFirst()
        .orElse(null);
    
    // ControlService will automatically set subset IDs based on role
    ControlDto controlDto = controlService.createUilControl(uilDto, authentication);
    
    return ResponseEntity.accepted()
        .body(RequestIdDto.builder()
            .requestId(controlDto.getRequestId())
            .build());
}
```

---

### 3. Database Setup

#### 3.1 Create Database Initialization Scripts

**File: `deploy/local/efti-gate/sql/5-create_tables_HR.sql`**

```sql
-- Create databases
CREATE DATABASE efti_hr;
CREATE DATABASE efti_identifiers_hr;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE efti_hr TO efti;
GRANT ALL PRIVILEGES ON DATABASE efti_identifiers_hr TO efti;
```

**Repeat for SLO and AT** with `efti_slo`, `efti_identifiers_slo`, `efti_at`, `efti_identifiers_at`.

#### 3.2 Add Datasets to Identifier Registry

**File: `deploy/local/efti-gate/sql/6-insert_datasets_HR.sql`**

```sql
-- Connect to identifiers database
\c efti_identifiers_hr;

-- Insert test datasets with UIL information
INSERT INTO consignment (gate_id, platform_id, dataset_id, 
                         carrier_acceptance_datetime, 
                         delivery_event_actual_occurrence_datetime) VALUES
('croatia', 'platform-hr', '11111111-1111-4111-8111-111111111111', 
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
('croatia', 'platform-hr', '22222222-2222-4222-8222-222222222222',
 NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
('croatia', 'platform-hr', '33333333-3333-4333-8333-333333333333',
 NOW() - INTERVAL '1 day', NOW());

-- Insert transport means (for ROAD_INSPECTOR)
INSERT INTO main_carriage_transport_movement 
(consignment_id, mode_code, dangerous_goods_indicator, 
 used_transport_means_id, used_transport_means_registration_country)
SELECT id, 3, false, 'HR-ABC-123', 'HR'
FROM consignment WHERE dataset_id = '11111111-1111-4111-8111-111111111111';

-- Insert dangerous goods (for ADR_INSPECTOR)
INSERT INTO main_carriage_transport_movement 
(consignment_id, mode_code, dangerous_goods_indicator, 
 used_transport_means_id, used_transport_means_registration_country)
SELECT id, 3, true, 'HR-XYZ-789', 'HR'
FROM consignment WHERE dataset_id = '22222222-2222-4222-8222-222222222222';

-- Insert customs-relevant data (for CUSTOMS_INSPECTOR)
INSERT INTO main_carriage_transport_movement 
(consignment_id, mode_code, dangerous_goods_indicator, 
 used_transport_means_id, used_transport_means_registration_country)
SELECT id, 3, false, 'HR-CUS-456', 'HR'
FROM consignment WHERE dataset_id = '33333333-3333-4333-8333-333333333333';
```

---

### 4. Platform Configuration

#### 4.1 Create Platform XML Datasets

**File: `deploy/local/efti-gate/platform/files/11111111-1111-4111-8111-111111111111.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<consignment xmlns="http://efti.eu/v1/consignment/common"
             xmlns:efti="http://efti.eu/v1/consignment/common">
  <!-- Road Inspector Dataset -->
  <identifiers>
    <datasetIdentifier>11111111-1111-4111-8111-111111111111</datasetIdentifier>
    <gateIdentifier>croatia</gateIdentifier>
    <platformIdentifier>platform-hr</platformIdentifier>
  </identifiers>
  
  <!-- ROAD subset - visible to ROAD_INSPECTOR -->
  <mainCarriageTransportMovement>
    <modeCode>3</modeCode>
    <usedTransportMeans>
      <usedTransportMeansId>HR-ABC-123</usedTransportMeansId>
      <usedTransportMeansRegistrationCountry>HR</usedTransportMeansRegistrationCountry>
    </usedTransportMeans>
  </mainCarriageTransportMovement>
  
  <!-- ADR subset - filtered out for ROAD_INSPECTOR -->
  <mainCarriageTransportMovement>
    <modeCode>3</modeCode>
    <dangerousGoodsIndicator>true</dangerousGoodsIndicator>
  </mainCarriageTransportMovement>
  
  <!-- CUSTOMS subset - filtered out for ROAD_INSPECTOR -->
  <customsInformation>
    <customsOfficeCode>HR001</customsOfficeCode>
  </customsInformation>
</consignment>
```

**File: `deploy/local/efti-gate/platform/files/22222222-2222-4222-8222-222222222222.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<consignment xmlns="http://efti.eu/v1/consignment/common">
  <!-- ADR Inspector Dataset -->
  <identifiers>
    <datasetIdentifier>22222222-2222-4222-8222-222222222222</datasetIdentifier>
    <gateIdentifier>croatia</gateIdentifier>
    <platformIdentifier>platform-hr</platformIdentifier>
  </identifiers>
  
  <!-- ADR subset - visible to ADR_INSPECTOR -->
  <mainCarriageTransportMovement>
    <modeCode>3</modeCode>
    <dangerousGoodsIndicator>true</dangerousGoodsIndicator>
    <dangerousGoods>
      <unNumber>1202</unNumber>
      <properShippingName>GASOLINE</properShippingName>
    </dangerousGoods>
    <usedTransportMeans>
      <usedTransportMeansId>HR-XYZ-789</usedTransportMeansId>
    </usedTransportMeans>
  </mainCarriageTransportMovement>
</consignment>
```

**File: `deploy/local/efti-gate/platform/files/33333333-3333-4333-8333-333333333333.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<consignment xmlns="http://efti.eu/v1/consignment/common">
  <!-- Customs Inspector Dataset -->
  <identifiers>
    <datasetIdentifier>33333333-3333-4333-8333-333333333333</datasetIdentifier>
    <gateIdentifier>croatia</gateIdentifier>
    <platformIdentifier>platform-hr</platformIdentifier>
  </identifiers>
  
  <!-- CUSTOMS subset - visible to CUSTOMS_INSPECTOR -->
  <customsInformation>
    <customsOfficeCode>HR001</customsOfficeCode>
    <declarationNumber>HR-DEC-2024-001</declarationNumber>
    <commodityCode>8703.24.10</commodityCode>
    <originCountry>DE</originCountry>
    <destinationCountry>HR</destinationCountry>
  </customsInformation>
  
  <mainCarriageTransportMovement>
    <usedTransportMeans>
      <usedTransportMeansId>HR-CUS-456</usedTransportMeansId>
    </usedTransportMeans>
  </mainCarriageTransportMovement>
</consignment>
```

#### 4.2 Update Platform Configuration

**File: `deploy/local/efti-gate/platform/application-HR.yml`**

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

#### 4.3 Update Subset Filtering Logic

**File: `implementation/platform-gate-simulator/src/main/java/eu/efti/platformgatesimulator/utils/SubsetUtils.java`**

The existing `SubsetUtils` already supports subset filtering. Ensure it handles the new subset IDs:

- `ROAD` - filters to show only road transport elements
- `ADR` - filters to show only dangerous goods elements  
- `CUSTOMS` - filters to show only customs information elements
- `DANGEROUS_GOODS` - alias for ADR subset
- `IDENTIFIER` - shows basic identifier information

The filtering uses XPath queries defined in the XSD schema annotations.

---

### 5. Docker Compose Configuration

#### 5.1 Add Services to docker-compose.yml

**File: `deploy/local/efti-gate/docker-compose.yml`**

Add these services:

```yaml
services:
  # ... existing services ...
  
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
    command: java -jar -Dspring.profiles.active=${PROFILE} -Dspring.config.location=/usr/src/myapp/ efti-gate.jar
    ports:
      - "8883:8883"
      - "8893:5005"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - efti

  efti-gate-SLO:
    env_file:
      - ./gate/ENV/SLO.env
    image: openjdk:17
    depends_on:
      - keycloak
      - psql
    volumes:
      - ./gate:/usr/src/myapp
    working_dir: /usr/src/myapp
    command: java -jar -Dspring.profiles.active=${PROFILE} -Dspring.config.location=/usr/src/myapp/ efti-gate.jar
    ports:
      - "8884:8884"
      - "8894:5005"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - efti

  efti-gate-AT:
    env_file:
      - ./gate/ENV/AT.env
    image: openjdk:17
    depends_on:
      - keycloak
      - psql
    volumes:
      - ./gate:/usr/src/myapp
    working_dir: /usr/src/myapp
    command: java -jar -Dspring.profiles.active=${PROFILE} -Dspring.config.location=/usr/src/myapp/ efti-gate.jar
    ports:
      - "8885:8885"
      - "8895:5005"
    extra_hosts:
      - "host.docker.internal:host-gateway"
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
    command: java -jar -Dspring.profiles.active=HR -Dspring.config.location=/usr/src/myapp/ platform-simulator.jar --port=8073
    ports:
      - "8073:8073"
      - "8793:5005"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - efti

  platform-SLO:
    image: openjdk:17
    depends_on:
      - keycloak
      - psql
    volumes:
      - ./platform:/usr/src/myapp
    working_dir: /usr/src/myapp
    command: java -jar -Dspring.profiles.active=SLO -Dspring.config.location=/usr/src/myapp/ platform-simulator.jar --port=8074
    ports:
      - "8074:8074"
      - "8794:5005"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - efti

  platform-AT:
    image: openjdk:17
    depends_on:
      - keycloak
      - psql
    volumes:
      - ./platform:/usr/src/myapp
    working_dir: /usr/src/myapp
    command: java -jar -Dspring.profiles.active=AT -Dspring.config.location=/usr/src/myapp/ platform-simulator.jar --port=8075
    ports:
      - "8075:8075"
      - "8795:5005"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - efti
```

---

### 6. Portal Application Updates

#### 6.1 Add Role-Based Rendering

**File: `portal-mock/src/app/core/services/role.service.ts`**

```typescript
import { Injectable } from '@angular/core';
import { SessionService } from './session.service';

export enum UserRole {
  ROAD_INSPECTOR = 'ROAD_INSPECTOR',
  ADR_INSPECTOR = 'ADR_INSPECTOR',
  CUSTOMS_INSPECTOR = 'CUSTOMS_INSPECTOR',
  ROAD_CONTROLER = 'ROAD_CONTROLER' // Backward compatibility
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  constructor(private sessionService: SessionService) {}

  getCurrentRole(): UserRole | null {
    const userInfos = this.sessionService.userInfos;
    if (!userInfos || !userInfos.roles || userInfos.roles.length === 0) {
      return null;
    }
    
    // Find first role that matches our enum
    const role = userInfos.roles.find(r => 
      Object.values(UserRole).includes(r as UserRole)
    );
    
    return role as UserRole || null;
  }

  isRoadInspector(): boolean {
    return this.getCurrentRole() === UserRole.ROAD_INSPECTOR;
  }

  isAdrInspector(): boolean {
    return this.getCurrentRole() === UserRole.ADR_INSPECTOR;
  }

  isCustomsInspector(): boolean {
    return this.getCurrentRole() === UserRole.CUSTOMS_INSPECTOR;
  }

  getDefaultSubsetIds(): string[] {
    const role = this.getCurrentRole();
    switch (role) {
      case UserRole.ROAD_INSPECTOR:
        return ['ROAD', 'IDENTIFIER'];
      case UserRole.ADR_INSPECTOR:
        return ['ADR', 'DANGEROUS_GOODS'];
      case UserRole.CUSTOMS_INSPECTOR:
        return ['CUSTOMS', 'IDENTIFIER'];
      default:
        return ['full'];
    }
  }
}
```

#### 6.2 Update UIL Search Component

**File: `portal-mock/src/app/pages/uil-search/uil-search.component.ts`**

```typescript
import { RoleService } from '../../core/services/role.service';

export class UilSearchComponent implements OnInit {
  // ... existing code ...
  
  constructor(
    // ... existing dependencies ...
    private roleService: RoleService
  ) {}

  submit() {
    this.formSubmitted = true;
    if (!this.searchForm.valid) {
      return;
    }

    const role = this.roleService.getCurrentRole();
    const defaultSubsets = this.roleService.getDefaultSubsetIds();

    const searchData: UilSearchModel = {
      'datasetId': this.searchForm.controls['id'].value,
      'gateId': this.searchForm.controls['gate'].value,
      'platformId': this.searchForm.controls['platform'].value,
      'subsetId': defaultSubsets // Use role-based default
    };

    this.service.postUil(searchData).subscribe({
      next: (response) => {
        this.localStorageService.setRequestId(response.requestId);
        this.toastr.success('Request submitted');
        this.startPolling(response.requestId);
      },
      error: (error) => {
        this.toastr.error('Error submitting request');
      }
    });
  }

  renderResult(result: UilResult): void {
    const role = this.roleService.getCurrentRole();
    
    // Filter data based on role
    const filteredData = this.filterDataByRole(result.data, role);
    
    // Render differently based on role
    if (this.roleService.isRoadInspector()) {
      this.renderRoadInspectorView(filteredData);
    } else if (this.roleService.isAdrInspector()) {
      this.renderAdrInspectorView(filteredData);
    } else if (this.roleService.isCustomsInspector()) {
      this.renderCustomsInspectorView(filteredData);
    } else {
      this.renderDefaultView(filteredData);
    }
  }

  private filterDataByRole(data: any, role: UserRole | null): any {
    if (!data || !role) return data;

    const filtered = { ...data };
    
    switch (role) {
      case UserRole.ROAD_INSPECTOR:
        // Show only road-related fields
        return {
          identifiers: data.identifiers,
          mainCarriageTransportMovement: data.mainCarriageTransportMovement?.filter(
            (m: any) => !m.dangerousGoodsIndicator
          )
        };
      
      case UserRole.ADR_INSPECTOR:
        // Show only ADR-related fields
        return {
          identifiers: data.identifiers,
          mainCarriageTransportMovement: data.mainCarriageTransportMovement?.filter(
            (m: any) => m.dangerousGoodsIndicator === true
          ),
          dangerousGoods: data.dangerousGoods
        };
      
      case UserRole.CUSTOMS_INSPECTOR:
        // Show only customs-related fields
        return {
          identifiers: data.identifiers,
          customsInformation: data.customsInformation,
          mainCarriageTransportMovement: data.mainCarriageTransportMovement
        };
      
      default:
        return data;
    }
  }

  private renderRoadInspectorView(data: any): void {
    // Custom rendering for road inspector
    // Highlight vehicle information, road transport details
  }

  private renderAdrInspectorView(data: any): void {
    // Custom rendering for ADR inspector
    // Highlight dangerous goods, UN numbers, proper shipping names
  }

  private renderCustomsInspectorView(data: any): void {
    // Custom rendering for customs inspector
    // Highlight customs declarations, commodity codes, origin/destination
  }
}
```

#### 6.3 Update HTML Template

**File: `portal-mock/src/app/pages/uil-search/uil-result.component.html`**

```html
<div class="result-container">
  <ng-container [ngSwitch]="roleService.getCurrentRole()">
    
    <!-- Road Inspector View -->
    <div *ngSwitchCase="'ROAD_INSPECTOR'" class="road-inspector-view">
      <h4>Road Transport Information</h4>
      <div *ngIf="result.data.mainCarriageTransportMovement">
        <p><strong>Vehicle ID:</strong> {{result.data.mainCarriageTransportMovement[0].usedTransportMeans?.usedTransportMeansId}}</p>
        <p><strong>Registration Country:</strong> {{result.data.mainCarriageTransportMovement[0].usedTransportMeans?.usedTransportMeansRegistrationCountry}}</p>
        <p><strong>Transport Mode:</strong> {{result.data.mainCarriageTransportMovement[0].modeCode}}</p>
      </div>
    </div>
    
    <!-- ADR Inspector View -->
    <div *ngSwitchCase="'ADR_INSPECTOR'" class="adr-inspector-view">
      <h4>ADR / Dangerous Goods Information</h4>
      <div *ngIf="result.data.dangerousGoods">
        <p><strong>UN Number:</strong> {{result.data.dangerousGoods.unNumber}}</p>
        <p><strong>Proper Shipping Name:</strong> {{result.data.dangerousGoods.properShippingName}}</p>
        <div class="danger-badge">⚠️ DANGEROUS GOODS</div>
      </div>
    </div>
    
    <!-- Customs Inspector View -->
    <div *ngSwitchCase="'CUSTOMS_INSPECTOR'" class="customs-inspector-view">
      <h4>Customs Information</h4>
      <div *ngIf="result.data.customsInformation">
        <p><strong>Customs Office:</strong> {{result.data.customsInformation.customsOfficeCode}}</p>
        <p><strong>Declaration Number:</strong> {{result.data.customsInformation.declarationNumber}}</p>
        <p><strong>Commodity Code:</strong> {{result.data.customsInformation.commodityCode}}</p>
        <p><strong>Origin:</strong> {{result.data.customsInformation.originCountry}}</p>
        <p><strong>Destination:</strong> {{result.data.customsInformation.destinationCountry}}</p>
      </div>
    </div>
    
    <!-- Default View -->
    <div *ngSwitchDefault class="default-view">
      <!-- Existing default rendering -->
    </div>
  </ng-container>
</div>
```

#### 6.4 Update Portal Configuration for Multiple Realms

**File: `portal-mock/src/assets/i18n/en.json`**

```json
{
  "roles": {
    "ROAD_INSPECTOR": "Road Inspector",
    "ADR_INSPECTOR": "ADR Inspector",
    "CUSTOMS_INSPECTOR": "Customs Inspector"
  },
  "views": {
    "road": {
      "title": "Road Transport Information",
      "vehicle": "Vehicle Information",
      "transportMode": "Transport Mode"
    },
    "adr": {
      "title": "ADR / Dangerous Goods",
      "unNumber": "UN Number",
      "shippingName": "Proper Shipping Name"
    },
    "customs": {
      "title": "Customs Information",
      "office": "Customs Office",
      "declaration": "Declaration Number",
      "commodity": "Commodity Code"
    }
  }
}
```

---

### 7. Domibus Configuration

#### 7.1 Domibus Architecture

**Note**: The reference implementation uses separate Domibus instances for different gate types. For the pilot, you can either:

**Option A**: Use one Domibus instance with multiple domains (recommended for pilot)
**Option B**: Deploy separate Domibus instances per gate (production-like)

#### 7.2 Add Domibus Domains for HR, SLO, AT

**File: `deploy/local/domibus/domibus/hr/domains/croatia/croatia-domibus.properties`**

```properties
domibus.location=/opt/domibus
domibus.config.location=/opt/domibus/conf
plugin.location=${domibus.config.location}/plugins

# Party configuration
domibus.party.croatia=croatia
domibus.party.slovenia=slovenia
domibus.party.austria=austria

# Keystore configuration
domibus.keystore.name=/opt/domibus/conf/croatia/croatia_keystore.jks
domibus.keystore.password=changeit
domibus.truststore.name=/opt/domibus/conf/croatia/croatia_truststore.jks
domibus.truststore.password=changeit
```

#### 7.3 Create PMode Files

**File: `deploy/local/domibus/pmodes/croatia-pmode.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<pmodes:PMode xmlns:pmodes="http://org.etsi.uri02640/v2">
  <pmodes:PModeParty>
    <pmodes:PartyId>croatia</pmodes:PartyId>
    <pmodes:Role>GATEWAY</pmodes:Role>
  </pmodes:PModeParty>
  <pmodes:PModeParty>
    <pmodes:PartyId>slovenia</pmodes:PartyId>
    <pmodes:Role>GATEWAY</pmodes:Role>
  </pmodes:PModeParty>
  <pmodes:PModeParty>
    <pmodes:PartyId>austria</pmodes:PartyId>
    <pmodes:Role>GATEWAY</pmodes:Role>
  </pmodes:PModeParty>
  
  <!-- Add agreements, configurations, etc. -->
</pmodes:PMode>
```

**Repeat for `slovenia-pmode.xml` and `austria-pmode.xml`.**

#### 7.4 Update Domibus Docker Compose

**File: `deploy/local/domibus/docker-compose.yml`**

Add new services or domains for HR, SLO, AT gates. Refer to existing BO/LI/SY configuration as template.

---

### 8. Registry of Identifiers (ROI) Updates

#### 8.1 Add UILs to ROI

**File: `deploy/local/efti-gate/sql/7-insert_uils_roi.sql`**

```sql
-- Connect to each gate's identifiers database
\c efti_identifiers_hr;

-- Insert UIL mappings
INSERT INTO consignment (gate_id, platform_id, dataset_id) VALUES
('croatia', 'platform-hr', '11111111-1111-4111-8111-111111111111'),
('croatia', 'platform-hr', '22222222-2222-4222-8222-222222222222'),
('croatia', 'platform-hr', '33333333-3333-4333-8333-333333333333');

-- Repeat for SLO and AT with appropriate gate/platform IDs and different dataset IDs
```

#### 8.2 Update Gate Configuration for ROI Lookup

The gate automatically queries the identifiers database when:
- UIL query is received (looks up by gate_id + platform_id + dataset_id)
- Identifier search is performed (looks up by transport means/equipment IDs)

No additional configuration needed if databases are properly set up.

---

### 9. Testing Checklist

#### 9.1 Authentication Tests

- [ ] User `road_inspector_hr` can login to Keycloak realm `eFTI_HR`
- [ ] JWT token contains role `ROLE_ROAD_INSPECTOR`
- [ ] Token validation works on gate
- [ ] Repeat for `adr_inspector_hr` and `customs_inspector_hr`
- [ ] Repeat for SLO and AT realms

#### 9.2 UIL Query Tests

- [ ] Road Inspector queries dataset → receives ROAD subset only
- [ ] ADR Inspector queries same dataset → receives ADR subset only
- [ ] Customs Inspector queries same dataset → receives CUSTOMS subset only
- [ ] Cross-gate UIL queries work (HR → SLO → AT)

#### 9.3 Portal Rendering Tests

- [ ] Road Inspector sees vehicle/transport information
- [ ] ADR Inspector sees dangerous goods information
- [ ] Customs Inspector sees customs declaration information
- [ ] Each role sees different UI components/styling

#### 9.4 Identifier Search Tests

- [ ] Search by vehicle ID returns correct UILs
- [ ] Search by equipment ID returns correct UILs
- [ ] Role-based filtering applies to search results

---

### 10. Summary of Changes Required

1. **Keycloak**: ✅ Create 3 realms, 9 users (3 roles × 3 gates), add role attributes
2. **Gate Code**: ✅ Add new roles, implement role-based subset mapping
3. **Database**: ✅ Create 6 databases (3 gates × 2 per gate), insert test data
4. **Platform**: ✅ Create 3 XML datasets, update subset filtering
5. **Docker Compose**: ✅ Add 6 new services (3 gates + 3 platforms)
6. **Portal App**: ✅ Add role service, update rendering logic, add role-based views
7. **Domibus**: ✅ Configure domains for HR, SLO, AT, create PMode files
8. **ROI**: ✅ Insert UIL mappings in identifier databases

---

### 11. Deployment Order

1. **Build Java components**: `mvn clean install` in `implementation/`
2. **Update Docker Compose**: Add new services
3. **Start databases**: `docker-compose up -d psql`
4. **Run SQL scripts**: Create databases and insert test data
5. **Start Keycloak**: Import realm configurations
6. **Start Domibus**: Configure domains and PModes
7. **Start Platforms**: Deploy with test datasets
8. **Start Gates**: Deploy with updated configurations
9. **Start Portal**: Build and deploy Angular app
10. **Test**: Run through test checklist

---

### 12. Troubleshooting

#### Common Issues

**Issue**: Users cannot authenticate
- **Check**: Keycloak realm configuration, client secrets
- **Fix**: Verify JWT issuer URI in gate configuration matches Keycloak

**Issue**: Subset filtering not working
- **Check**: Subset IDs in request match XSD schema definitions
- **Fix**: Verify `SubsetUtils.parseBySubsets()` is called correctly

**Issue**: Portal shows wrong data for role
- **Check**: User roles in JWT token, role service logic
- **Fix**: Verify role extraction from JWT, update filtering logic

**Issue**: Cross-gate communication fails
- **Check**: Domibus PMode configuration, network connectivity
- **Fix**: Verify PModes match between gates, check RabbitMQ queues

---

## Next Steps

After completing this setup:

1. **Test all scenarios** from the testing checklist
2. **Document any issues** encountered and solutions found
3. **Collect feedback** from users testing different roles
4. **Plan production deployment** based on pilot learnings

---

## Additional Resources

- **Full Documentation**: See `EFTI_TEST_FLOW_DOCUMENTATION.md` for comprehensive reference
- **API Schemas**: See `schema/api-schemas/` for API specifications
- **XSD Schemas**: See `schema/xsd/` for data structure definitions

