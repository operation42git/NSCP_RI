# eFTI Pilot Setup Guide - Croatia, Slovenia, Austria

## Overview

This guide provides step-by-step instructions to set up a 3-gate pilot for Croatia with the following minimum requirements:

- **3 Gates**: Croatia (HR), Slovenia (SLO), Austria (AT)
- **3 Platforms**: One per gate
- **3 Users**: One user per gate (simple setup)
- **Portal Translation**: User app translated to Croatian
- **Data Localization**: Data with Croatian names, addresses, and locations

---

## Prerequisites

1. Docker and Docker Compose installed
2. Java 17+ and Maven for building
3. Node.js 18+ for portal mock
4. Access to deploy scripts

---

## Implementation Options

You have two options for setting up the pilot:

### Option 1: Reuse and Rename Existing Gates (Recommended)

**Pros:**
- Faster implementation (2-3 hours)
- Less complexity
- Reuses existing infrastructure
- No need to maintain two setups

**Cons:**
- Replaces fictional countries (BO, SY, LI) with real ones
- Original setup is modified

**Mapping:**
- BO (Borduria) → HR (Croatia)
- SY (Syldavia) → SLO (Slovenia)
- LI (Listenbourg) → AT (Austria)

### Option 2: Create New Components

**Pros:**
- Keeps original setup intact
- Complete separation
- Can run both setups in parallel

**Cons:**
- More configuration files
- More Docker services (6 gates total)
- More complex setup (6-8 hours)
- More maintenance overhead

**Recommendation:** Use **Option 1** for pilot purposes.

---

## Option 1: Reuse and Rename Existing Gates

### Step 1: Update Gate Configuration Files

#### 1.1 Rename and Update Environment Files

**Rename:**
- `deploy/local/efti-gate/gate/ENV/BO.env` → `ENV/HR.env`
- `deploy/local/efti-gate/gate/ENV/SY.env` → `ENV/SLO.env`
- `deploy/local/efti-gate/gate/ENV/LI.env` → `ENV/AT.env`

**Update `ENV/HR.env`:**
```bash
PROFILE=HR
PORT=8880
```

**Update `ENV/SLO.env`:**
```bash
PROFILE=SLO
PORT=8881
```

**Update `ENV/AT.env`:**
```bash
PROFILE=AT
PORT=8882
```

#### 1.2 Rename and Update Application Configuration Files

**Rename:**
- `deploy/local/efti-gate/gate/application-BO.yml` → `application-HR.yml`
- `deploy/local/efti-gate/gate/application-SY.yml` → `application-SLO.yml`
- `deploy/local/efti-gate/gate/application-LI.yml` → `application-AT.yml`

**Update `application-HR.yml`:**
```yaml
server:
  port: ${PORT:8880}

gate:
  owner: croatia
  country: HR
  platforms:
    - platformId: platform-hr
      useRestApi: true
      restApiBaseUrl: http://platform-ACME:8070/api/gate-api

spring:
  rabbitmq:
    password: hr
    username: hr
    virtual-host: hr
  datasource:
    control:
      liquibase:
        default-schema: eftihr
    identifiers:
      liquibase:
        default-schema: eftihr
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://auth.gate.croatia.eu:8080/realms/eFTI_HR
  jpa:
    properties:
      hibernate:
        control_schema: "eftihr"
        identifiers_schema: "eftihr"
```

**Update `application-SLO.yml`** (similar structure, change to `slovenia`, `SI`, `SLO`, `eFTI_SLO`)

**Update `application-AT.yml`** (similar structure, change to `austria`, `AT`, `eFTI_AT`)

### Step 2: Update Keycloak Configuration

#### 2.1 Rename and Update Realm Export Files

**Rename:**
- `deploy/local/efti-gate/keycloak/bo-export.json` → `hr-export.json`
- `deploy/local/efti-gate/keycloak/sy-export.json` → `slo-export.json`
- `deploy/local/efti-gate/keycloak/li-export.json` → `at-export.json`

**Update `hr-export.json`:**

Change:
- `"realm": "eFTI_BO"` → `"realm": "eFTI_HR"`
- `"username": "user_bo"` → `"username": "user_hr"` (or `croatia_user`)
- All references to `eFTI_BO` → `eFTI_HR`
- All references to `borduria` → `croatia`
- Update client secrets if needed

**Simplified user (only 1 user per gate):**
```json
{
  "users": [
    {
      "username": "user_hr",
      "emailVerified": true,
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

**Repeat for SLO and AT** with appropriate usernames (`user_slo`, `user_at`).

#### 2.2 Update Docker Compose Keycloak Volume Mounts

**File: `deploy/local/efti-gate/docker-compose.yml`**

Update Keycloak service volumes:
```yaml
keycloak:
  volumes:
    - ./keycloak/hr-export.json:/opt/keycloak/data/import/hr-export.json
    - ./keycloak/slo-export.json:/opt/keycloak/data/import/slo-export.json
    - ./keycloak/at-export.json:/opt/keycloak/data/import/at-export.json
  networks:
    efti:
      aliases:
        - auth.gate.croatia.eu
        - auth.gate.slovenia.eu
        - auth.gate.austria.eu
```

### Step 3: Update Database Configuration

#### 3.1 Update Gate Registry

**File: `deploy/local/efti-gate/gate-db/gate-config.sql`**

```sql
DELETE FROM gate WHERE 1 = 1;

INSERT INTO gate (country, gateid, createddate, lastmodifieddate)
VALUES ('HR', 'croatia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('SI', 'slovenia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('AT', 'austria', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

#### 3.2 Update Database Names in SQL Scripts

**Rename and update:**
- `deploy/local/efti-gate/sql/2-create_tables_BO.sql` → `2-create_tables_HR.sql`
- `deploy/local/efti-gate/sql/3-create_tables_LI.sql` → `3-create_tables_SLO.sql`
- `deploy/local/efti-gate/sql/4-create_tables_SY.sql` → `4-create_tables_AT.sql`

**Update database names:**
- `eftibo` → `eftihr`
- `eftili` → `eftislo`
- `eftisy` → `eftiat`

**Repeat for identifier databases:**
- `deploy/local/efti-gate/sql-meta/2-create_tables_BO.sql` → `2-create_tables_HR.sql`
- etc.

### Step 4: Update Platform Configuration

#### 4.1 Rename and Update Platform Configurations

**Rename:**
- `deploy/local/efti-gate/platform/application-ACME.yml` → Update to reference Croatia
- `deploy/local/efti-gate/platform/application-MASSIVE.yml` → Update to reference Slovenia
- `deploy/local/efti-gate/platform/application-UMBRELLA.yml` → Update to reference Austria

**Update `application-ACME.yml` (Croatia platform):**
```yaml
gate:
  owner: platform-hr
  gate: croatia
  restApiBaseUrl: http://efti-gate-HR:8880/api/platform
  cdaPath: /usr/src/myapp/files/

spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://auth.gate.croatia.eu:8080/realms/eFTI_HR
```

#### 4.2 Create Croatian Test Data XML Files

**Location**: `deploy/local/efti-gate/platform/files/`

**Create XML files with Croatian data:**

**Example: `croatia-test-001.xml`**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<consignment xmlns="http://efti.eu/v1/consignment/common">
  <identifiers>
    <datasetIdentifier>croatia-test-001</datasetIdentifier>
    <gateIdentifier>croatia</gateIdentifier>
    <platformIdentifier>croatia eFTI platform</platformIdentifier>
  </identifiers>
  
  <consignor>
    <name>Hrvatski Proizvođač d.o.o.</name>
    <postalAddress>
      <streetName>Ilica</streetName>
      <buildingNumber>123</buildingNumber>
      <postcode>10000</postcode>
      <cityName>Zagreb</cityName>
      <countrySubDivisionName>Grad Zagreb</countrySubDivisionName>
    </postalAddress>
  </consignor>
  
  <consignee>
    <name>Primatelj Hrvatska d.o.o.</name>
    <postalAddress>
      <streetName>Obala</streetName>
      <buildingNumber>45</buildingNumber>
      <postcode>21000</postcode>
      <cityName>Split</cityName>
      <countrySubDivisionName>Splitsko-dalmatinska županija</countrySubDivisionName>
    </postalAddress>
  </consignee>
  
  <carrier>
    <name>Hrvatski Prijevoznik d.o.o.</name>
    <postalAddress>
      <streetName>Riječka</streetName>
      <buildingNumber>78</buildingNumber>
      <postcode>51000</postcode>
      <cityName>Rijeka</cityName>
      <countrySubDivisionName>Primorsko-goranska županija</countrySubDivisionName>
    </postalAddress>
  </carrier>
  
  <carrierAcceptanceLocation>
    <name>Zagreb Terminal</name>
    <postalAddress>
      <cityName>Zagreb</cityName>
      <countrySubDivisionName>Grad Zagreb</countrySubDivisionName>
    </postalAddress>
  </carrierAcceptanceLocation>
  
  <consigneeReceiptLocation>
    <name>Split Terminal</name>
    <postalAddress>
      <cityName>Split</cityName>
      <countrySubDivisionName>Splitsko-dalmatinska županija</countrySubDivisionName>
    </postalAddress>
  </consigneeReceiptLocation>
  
  <mainCarriageTransportMovement>
    <modeCode>3</modeCode>
    <usedTransportMeans>
      <id>HR-ABC-123</id>
      <registrationCountry>
        <code>HR</code>
      </registrationCountry>
    </usedTransportMeans>
  </mainCarriageTransportMovement>
  
  <carrierAcceptanceDateTime formatId="203">202401010000</carrierAcceptanceDateTime>
  
  <deliveryEvent>
    <actualOccurrenceDateTime formatId="203">202401020000</actualOccurrenceDateTime>
  </deliveryEvent>
</consignment>
```

**Create similar files for Slovenia and Austria with appropriate local data.**

### Step 5: Update Docker Compose

#### 5.1 Update Service Names

**File: `deploy/local/efti-gate/docker-compose.yml`**

**Update service names:**
- `efti-gate-BO` → `efti-gate-HR` (update env_file to `ENV/HR.env`)
- `efti-gate-SY` → `efti-gate-SLO` (update env_file to `ENV/SLO.env`)
- `efti-gate-LI` → `efti-gate-AT` (update env_file to `ENV/AT.env`)

**Update platform service names (optional, or keep existing):**
- `platform-ACME` → Keep as is (or rename to `platform-HR`)
- `platform-MASSIVE` → Keep as is (or rename to `platform-SLO`)
- `platform-UMBRELLA` → Keep as is (or rename to `platform-AT`)

### Step 6: Portal Translation to Croatian

#### 6.1 Create Croatian Translation File

**File: `portal-mock/src/assets/i18n/hr.json`**

```json
{
  "identifiers-display": {
    "title": "Prikaz identifikatora",
    "identifiers": "Identifikatori",
    "gate-id": "ID pristupnika",
    "dataset-id": "ID skupa podataka",
    "platform-id": "ID platforme",
    "delivery-date": "Datum isporuke",
    "acceptance-date": "Datum prihvaćanja",
    "transport-movement": "Glavni prijevozni pokret",
    "used-transport-equipment": "Korištena transportna oprema",
    "carried-transport-equipment": "Nosa transportna oprema",
    "id": "Id",
    "scheme-agency-id": "ID agencije sheme",
    "mode-code": "Kod načina",
    "registrationCountry": "Država registracije",
    "dangerous-goods-indicator": "Indikator opasne robe",
    "sequence-number": "Redni broj",
    "category-code": "Kod kategorije",
    "registration-country": "Država registracije",
    "go-to-uil": "Idi na zahtjev po UIL-u"
  },
  "identifiers-search": {
    "title": "Zahtjev za identifikatorima",
    "search": "Zahtjev",
    "identifier": "Identifikator",
    "identifier-type": "Tip identifikatora",
    "registration-country-code": "Kod države registracije",
    "mode-code": "Kod načina",
    "transport-mode": "Način prijevoza",
    "is-dangerous-good": "Je li opasna roba? *",
    "yes": "Da",
    "no": "Ne",
    "na": "N/A",
    "reset": "Resetiraj",
    "send-search": "Pošalji zahtjev",
    "result": "Rezultat",
    "request-id": "RequestId",
    "status": "Status",
    "update-status": "Ažuriraj status",
    "gate-id": "ID pristupnika",
    "dataset-id": "ID skupa podataka",
    "platform-id": "ID platforme",
    "delivery-date": "Datum isporuke",
    "acceptance-date": "Datum prihvaćanja",
    "action": "Akcija",
    "open": "Otvori",
    "error": "Došlo je do greške",
    "request-saved": "Zahtjev spremljen",
    "note-saved": "Zahtjev spremljen",
    "request-updated": "Zahtjev ažuriran",
    "gate-indicator": "Indikatori pristupnika"
  },
  "uil-search": {
    "title": "UIL Zahtjev",
    "search": "Zahtjev",
    "dataset-id": "ID skupa podataka *",
    "gate": "ID pristupnika *",
    "platform": "ID platforme *",
    "reset": "Resetiraj",
    "send-search": "Pošalji zahtjev",
    "update": "Ažuriraj",
    "open": "Otvori",
    "clear": "Očisti",
    "add-note": "Naknadna komunikacija",
    "download": "Preuzmi",
    "save": "Spremi",
    "cancel": "Odustani"
  },
  "form": {
    "error": {
      "required": "ovo polje je obavezno",
      "pattern": "ovo polje ne odgovara traženom formatu"
    }
  },
  "loader": {
    "text": "Učitavanje"
  },
  "menu": {
    "login": "Prijava",
    "logout": "Odjava",
    "home": "Početna",
    "search-by-uil": "Pretraga po UIL-u",
    "search-by-identifiers": "Pretraga po identifikatorima"
  }
}
```

#### 6.2 Configure Language Detection

**File: `portal-mock/src/app/app.config.ts`**

Update to support Croatian:
```typescript
TranslateModule.forRoot({
  loader: {
    provide: TranslateLoader,
    useFactory: HttpLoaderFactory,
    deps: [HttpClient],
  },
  defaultLanguage: navigator.language.startsWith('hr') ? 'hr' : 'en'
})
```

**Or add language selector in menu component.**

#### 6.3 Create Croatian XSLT Template (Optional but Recommended)

**File: `portal-mock/src/assets/xslt/eCMR-hr.xslt`**

Copy `eCMR.xslt` and translate hardcoded labels:
- "SENDER" → "POŠILJATELJ"
- "CONSIGNEE" → "PRIMATELJ"
- "CARRIER" → "PRIJEVOZNIK"
- "DELIVERY ADDRESS" → "ADRESA ISPORUKE"
- etc.

Update portal to use Croatian XSLT when Croatian language is selected.

### Step 7: Update Domibus Configuration

#### 7.1 Update PMode Files

**Rename and update:**
- `deploy/local/domibus/pmodes/borduria-pmode.xml` → `croatia-pmode.xml`
- `deploy/local/domibus/pmodes/syldavia-pmode.xml` → `slovenia-pmode.xml`
- `deploy/local/domibus/pmodes/listenbourg-pmode.xml` → `austria-pmode.xml`

**Update party IDs in PMode files:**
- `borduria` → `croatia`
- `syldavia` → `slovenia`
- `listenbourg` → `austria`

### Step 8: Update Hosts File (if needed)

**File**: `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows)

```bash
127.0.0.1 auth.gate.croatia.eu
127.0.0.1 auth.gate.slovenia.eu
127.0.0.1 auth.gate.austria.eu
```

---

## Option 2: Create New Components

### Step 1: Create New Gate Configuration Files

#### 1.1 Create New Environment Files

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

#### 1.2 Create New Application Configuration Files

**File: `deploy/local/efti-gate/gate/application-HR.yml`**
```yaml
server:
  port: ${PORT:8883}

gate:
  owner: croatia
  country: HR
  platforms:
    - platformId: platform-hr
      useRestApi: true
      restApiBaseUrl: http://platform-HR:8073/api/gate-api

spring:
  rabbitmq:
    password: hr
    username: hr
    virtual-host: hr
  datasource:
    control:
      liquibase:
        default-schema: eftihr
    identifiers:
      liquibase:
        default-schema: eftihr
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://auth.gate.croatia.eu:8080/realms/eFTI_HR
  jpa:
    properties:
      hibernate:
        control_schema: "eftihr"
        identifiers_schema: "eftihr"
```

**Repeat for SLO and AT** with appropriate values.

### Step 2: Create New Keycloak Realms

#### 2.1 Create New Realm Export Files

**File: `deploy/local/efti-gate/keycloak/hr-export.json`**

Use the structure from Option 1, but create as new files (don't rename existing).

**File: `deploy/local/efti-gate/keycloak/slo-export.json`**

**File: `deploy/local/efti-gate/keycloak/at-export.json`**

#### 2.2 Update Docker Compose

**File: `deploy/local/efti-gate/docker-compose.yml`**

**Add new services (keep existing BO, SY, LI):**
```yaml
services:
  # ... existing services ...
  
  efti-gate-HR:
    env_file:
      - ./gate/ENV/HR.env
    image: eclipse-temurin:17-jdk
    depends_on:
      - keycloak
      - psql
    volumes:
      - ./gate:/usr/src/myapp
    working_dir: /usr/src/myapp
    command: java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar -Dspring.config.location=/usr/src/myapp/ -Dspring.profiles.active=$${PROFILE} efti-gate.jar
    ports:
      - "8883:8883"
      - "8893:5005"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      efti:

  efti-gate-SLO:
    # ... similar configuration ...
    ports:
      - "8884:8884"
      - "8894:5005"

  efti-gate-AT:
    # ... similar configuration ...
    ports:
      - "8885:8885"
      - "8895:5005"

  platform-HR:
    image: eclipse-temurin:17-jdk
    depends_on:
      - keycloak
      - psql
    volumes:
      - ./platform:/usr/src/myapp
    working_dir: /usr/src/myapp
    command: java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar -Dspring.config.location=file:application.yml -Dspring.profiles.active=HR platform-simulator.jar --port=8073
    ports:
      - "8073:8073"
      - "8793:5005"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      efti:

  platform-SLO:
    # ... similar configuration ...
    ports:
      - "8074:8074"
      - "8794:5005"

  platform-AT:
    # ... similar configuration ...
    ports:
      - "8075:8075"
      - "8795:5005"
```

**Update Keycloak volumes to include new realms:**
```yaml
keycloak:
  volumes:
    - ./keycloak/bo-export.json:/opt/keycloak/data/import/bo-export.json
    - ./keycloak/sy-export.json:/opt/keycloak/data/import/sy-export.json
    - ./keycloak/li-export.json:/opt/keycloak/data/import/li-export.json
    - ./keycloak/hr-export.json:/opt/keycloak/data/import/hr-export.json
    - ./keycloak/slo-export.json:/opt/keycloak/data/import/slo-export.json
    - ./keycloak/at-export.json:/opt/keycloak/data/import/at-export.json
```

### Step 3: Create New Database Scripts

#### 3.1 Create New Database Initialization Scripts

**File: `deploy/local/efti-gate/sql/5-create_tables_HR.sql`**
```sql
-- Create databases
CREATE DATABASE efti_hr;
CREATE DATABASE efti_identifiers_hr;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE efti_hr TO efti;
GRANT ALL PRIVILEGES ON DATABASE efti_identifiers_hr TO efti;
```

**Repeat for SLO and AT.**

#### 3.2 Update Gate Registry

**File: `deploy/local/efti-gate/gate-db/gate-config.sql`**

**Add new gates (keep existing):**
```sql
INSERT INTO gate (country, gateid, createddate, lastmodifieddate)
VALUES ('HR', 'croatia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('SI', 'slovenia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('AT', 'austria', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

### Step 4: Create New Platform Configurations

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
          issuer-uri: http://auth.gate.croatia.eu:8080/realms/eFTI_HR
```

**Repeat for SLO and AT.**

### Step 5: Portal Translation and Data Localization

**Same as Option 1, Steps 6 and 4.2**

---

## Common Steps (Both Options)

### Portal Translation

See **Option 1, Step 6** for portal translation steps.

### Data Localization

See **Option 1, Step 4.2** for creating Croatian test data.

### Testing Checklist

#### Authentication Tests
- [ ] User `user_hr` can login to Keycloak realm `eFTI_HR`
- [ ] JWT token contains role `ROLE_ROAD_CONTROLER`
- [ ] Token validation works on gate
- [ ] Repeat for `user_slo` and `user_at`

#### UIL Query Tests
- [ ] User can query dataset from local platform
- [ ] User can query dataset from foreign gate (cross-border)
- [ ] Cross-gate UIL queries work (HR → SLO → AT)

#### Portal Translation Tests
- [ ] Portal displays in Croatian when Croatian user logs in
- [ ] All menu items are translated
- [ ] All form labels are translated
- [ ] All error messages are translated

#### Data Localization Tests
- [ ] Croatian platform returns XML with Croatian data
- [ ] Carrier names are in Croatian
- [ ] Addresses are in Croatian
- [ ] Vehicle registration numbers follow HR format (HR-XXX-XXX)
- [ ] Start and end locations are Croatian cities
- [ ] Data is understandable to Croatian supervising bodies

#### Cross-Gate Communication Tests
- [ ] Croatia gate can query Slovenia gate
- [ ] Croatia gate can query Austria gate
- [ ] Domibus messages are sent and received correctly

---

## Deployment Order

1. **Build Java components**: `mvn clean install` in `implementation/`
2. **Update configuration files** (based on chosen option)
3. **Update Docker Compose**: Update or add services
4. **Start databases**: `docker-compose up -d psql psql-meta`
5. **Run SQL scripts**: Create databases and insert test data
6. **Start Keycloak**: Import realm configurations
7. **Start Domibus**: Configure domains and PModes (if using)
8. **Start Platforms**: Deploy with test datasets
9. **Start Gates**: Deploy with updated configurations
10. **Start Portal**: Build and deploy Angular app with translations
11. **Test**: Run through test checklist

---

## Troubleshooting

### Common Issues

**Issue**: Users cannot authenticate
- **Check**: Keycloak realm configuration, client secrets
- **Fix**: Verify JWT issuer URI in gate configuration matches Keycloak

**Issue**: Portal not showing Croatian translation
- **Check**: Language detection in `app.config.ts`, translation file exists
- **Fix**: Verify `hr.json` file is in correct location, language detection logic

**Issue**: Data not showing Croatian names
- **Check**: XML files on platform contain Croatian data
- **Fix**: Verify XML files are in platform `files/` directory with correct structure

**Issue**: Cross-gate communication fails
- **Check**: Domibus PMode configuration, network connectivity
- **Fix**: Verify PModes match between gates, check RabbitMQ queues

---

## Summary of Changes Required

### Option 1 (Reuse/Rename):
1. **Gate Config**: Rename and update 3 config files
2. **Keycloak**: Rename and update 3 realm files
3. **Database**: Update gate registry, rename SQL scripts
4. **Platform**: Update 3 platform configs, create Croatian test data
5. **Docker Compose**: Update service names
6. **Portal**: Add Croatian translation
7. **Domibus**: Update PMode files

### Option 2 (Create New):
1. **Gate Config**: Create 3 new config files
2. **Keycloak**: Create 3 new realm files
3. **Database**: Create 6 new database scripts
4. **Platform**: Create 3 new platform configs, create Croatian test data
5. **Docker Compose**: Add 6 new services
6. **Portal**: Add Croatian translation
7. **Domibus**: Create new PMode files

---

## Additional Resources

- **Analysis Document**: See `CROATIA_PILOT_SETUP_ANALYSIS.md` for detailed analysis
- **Full Documentation**: See `EFTI_TEST_FLOW_DOCUMENTATION.md` for comprehensive reference
- **API Schemas**: See `schema/api-schemas/` for API specifications
- **XSD Schemas**: See `schema/xsd/` for data structure definitions
