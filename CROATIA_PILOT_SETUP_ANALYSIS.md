# Croatia Pilot Setup - Analysis

## Overview

This document analyzes the steps required to set up the eFTI Reference Implementation for a pilot in Croatia with the following minimum requirements:

- **Three gates**: Croatia, Slovenia, Austria
- **One platform per each gate**
- **One user per each gate**
- **User app (portal access) translated to Croatian**
- **Data understandable to Croatian supervising bodies** - local carriage names, local consignment names, start and end locations

---

## 1. Gate Configuration (3 Gates)

### 1.1 Current State
The system already supports multi-gate configuration. The `PILOT_SETUP_GUIDE.md` contains detailed instructions for setting up HR, SLO, and AT gates.

### 1.2 Required Steps

#### A. Create Gate Configuration Files

**For Croatia (HR):**
- **File**: `deploy/local/efti-gate/gate/ENV/HR.env`
  - `PROFILE=HR`
  - `PORT=8883`

- **File**: `deploy/local/efti-gate/gate/application-HR.yml`
  - Gate owner: `croatia`
  - Country code: `HR`
  - Platform configuration: `platform-hr`
  - Database: `efti_hr` and `efti_identifiers_hr`
  - Keycloak realm: `eFTI_HR`
  - Port: `8883`

**For Slovenia (SLO):**
- **File**: `deploy/local/efti-gate/gate/ENV/SLO.env`
  - `PROFILE=SLO`
  - `PORT=8884`

- **File**: `deploy/local/efti-gate/gate/application-SLO.yml`
  - Gate owner: `slovenia`
  - Country code: `SI`
  - Platform configuration: `platform-slo`
  - Database: `efti_slo` and `efti_identifiers_slo`
  - Keycloak realm: `eFTI_SLO`
  - Port: `8884`

**For Austria (AT):**
- **File**: `deploy/local/efti-gate/gate/ENV/AT.env`
  - `PROFILE=AT`
  - `PORT=8885`

- **File**: `deploy/local/efti-gate/gate/application-AT.yml`
  - Gate owner: `austria`
  - Country code: `AT`
  - Platform configuration: `platform-at`
  - Database: `efti_at` and `efti_identifiers_at`
  - Keycloak realm: `eFTI_AT`
  - Port: `8885`

#### B. Database Setup

**SQL Scripts Required:**
1. Create databases for each gate:
   - `deploy/local/efti-gate/sql/5-create_tables_HR.sql`
   - `deploy/local/efti-gate/sql/6-create_tables_SLO.sql`
   - `deploy/local/efti-gate/sql/7-create_tables_AT.sql`

2. Create identifier databases:
   - `deploy/local/efti-gate/sql-meta/5-create_tables_HR.sql`
   - `deploy/local/efti-gate/sql-meta/6-create_tables_SLO.sql`
   - `deploy/local/efti-gate/sql-meta/7-create_tables_AT.sql`

3. Insert gate registry entries:
   - Update `deploy/local/efti-gate/gate-db/gate-config.sql` to include:
     - `('HR', 'croatia', ...)`
     - `('SI', 'slovenia', ...)`
     - `('AT', 'austria', ...)`

#### C. Docker Compose Configuration

**File**: `deploy/local/efti-gate/docker-compose.yml`

Add three new gate services:
- `efti-gate-HR` (port 8883)
- `efti-gate-SLO` (port 8884)
- `efti-gate-AT` (port 8885)

Each service needs:
- Environment file reference
- Database dependencies
- Keycloak dependency
- Network configuration
- Port mappings

**Complexity**: Medium
**Estimated Time**: 2-3 hours

---

## 2. Platform Configuration (3 Platforms)

### 2.1 Current State
The system supports multiple platforms. Each platform is a separate service that stores XML datasets.

### 2.2 Required Steps

#### A. Create Platform Configuration Files

**For Croatia Platform:**
- **File**: `deploy/local/efti-gate/platform/application-HR.yml`
  - Platform ID: `platform-hr`
  - Gate: `croatia`
  - Port: `8073`
  - CDA path: `/usr/src/myapp/files/`

**For Slovenia Platform:**
- **File**: `deploy/local/efti-gate/platform/application-SLO.yml`
  - Platform ID: `platform-slo`
  - Gate: `slovenia`
  - Port: `8074`
  - CDA path: `/usr/src/myapp/files/`

**For Austria Platform:**
- **File**: `deploy/local/efti-gate/platform/application-AT.yml`
  - Platform ID: `platform-at`
  - Gate: `austria`
  - Port: `8075`
  - CDA path: `/usr/src/myapp/files/`

#### B. Create Test XML Datasets

**Location**: `deploy/local/efti-gate/platform/files/`

**For Croatia Platform:**
- Create XML files with Croatian data:
  - Croatian carrier names (e.g., "Hrvatski Prijevoznik d.o.o.")
  - Croatian consignment names
  - Croatian addresses (cities like Zagreb, Split, Rijeka)
  - Croatian vehicle registration numbers (HR-XXX-XXX format)
  - Start/end locations in Croatia (e.g., "Zagreb" to "Split")

**For Slovenia Platform:**
- Create XML files with Slovenian data:
  - Slovenian carrier names
  - Slovenian addresses (Ljubljana, Maribor, etc.)
  - Slovenian vehicle registration numbers (SI-XXX-XXX format)

**For Austria Platform:**
- Create XML files with Austrian data:
  - Austrian carrier names
  - Austrian addresses (Vienna, Graz, etc.)
  - Austrian vehicle registration numbers (AT-XXX-XXX format)

**Important**: The XML files must follow the `consignment-common.xsd` schema structure.

**Complexity**: Medium
**Estimated Time**: 3-4 hours (including data preparation)

---

## 3. User Configuration (1 User per Gate)

### 3.1 Current State
Users are managed in Keycloak realms. Each gate has its own realm.

### 3.2 Required Steps

#### A. Create Keycloak Realms

**For Croatia:**
- **File**: `deploy/local/efti-gate/keycloak/hr-export.json`
  - Realm: `eFTI_HR`
  - User: `user_hr` (or `croatia_user`)
  - Role: `ROAD_CONTROLER` (or appropriate role)
  - Password: Set secure password

**For Slovenia:**
- **File**: `deploy/local/efti-gate/keycloak/slo-export.json`
  - Realm: `eFTI_SLO`
  - User: `user_slo` (or `slovenia_user`)
  - Role: `ROAD_CONTROLER`
  - Password: Set secure password

**For Austria:**
- **File**: `deploy/local/efti-gate/keycloak/at-export.json`
  - Realm: `eFTI_AT`
  - User: `user_at` (or `austria_user`)
  - Role: `ROAD_CONTROLER`
  - Password: Set secure password

#### B. Import Realms into Keycloak

Either:
1. **Manual import** via Keycloak Admin Console (http://localhost:8080)
2. **Automated import** via `kcadm.sh` script

**Complexity**: Low
**Estimated Time**: 30 minutes

---

## 4. Portal Translation to Croatian

### 4.1 Current State
The portal application uses Angular with `ngx-translate` for internationalization. Currently, only English translation exists (`portal-mock/src/assets/i18n/en.json`).

### 4.2 Required Steps

#### A. Create Croatian Translation File

**File**: `portal-mock/src/assets/i18n/hr.json` (or `hr-HR.json`)

**Translation Keys to Translate:**

1. **Menu Items** (`menu` section):
   - `login` → "Prijava"
   - `logout` → "Odjava"
   - `home` → "Početna"
   - `search-by-uil` → "Pretraga po UIL-u"
   - `search-by-identifiers` → "Pretraga po identifikatorima"

2. **UIL Search** (`uil-search` section):
   - `title` → "UIL Zahtjev"
   - `dataset-id` → "ID skupa podataka *"
   - `gate` → "ID pristupnika *"
   - `platform` → "ID platforme *"
   - `send-search` → "Pošalji zahtjev"
   - `reset` → "Resetiraj"
   - `update` → "Ažuriraj"
   - `open` → "Otvori"
   - `clear` → "Očisti"
   - `download` → "Preuzmi"
   - `save` → "Spremi"
   - `cancel` → "Odustani"

3. **Identifier Search** (`identifiers-search` section):
   - `title` → "Zahtjev za identifikatorima"
   - `identifier` → "Identifikator"
   - `identifier-type` → "Tip identifikatora"
   - `transport-mode` → "Način prijevoza"
   - `registration-country-code` → "Kod države registracije"
   - `is-dangerous-good` → "Je li opasna roba? *"
   - `yes` → "Da"
   - `no` → "Ne"
   - `na` → "N/A"
   - `send-search` → "Pošalji zahtjev"
   - `result` → "Rezultat"
   - `status` → "Status"
   - `gate-id` → "ID pristupnika"
   - `platform-id` → "ID platforme"
   - `dataset-id` → "ID skupa podataka"
   - `delivery-date` → "Datum isporuke"
   - `acceptance-date` → "Datum prihvaćanja"
   - `action` → "Akcija"
   - `open` → "Otvori"

4. **Identifiers Display** (`identifiers-display` section):
   - `title` → "Prikaz identifikatora"
   - `identifiers` → "Identifikatori"
   - `gate-id` → "ID pristupnika"
   - `dataset-id` → "ID skupa podataka"
   - `platform-id` → "ID platforme"
   - `delivery-date` → "Datum isporuke"
   - `acceptance-date` → "Datum prihvaćanja"
   - `transport-movement` → "Glavni prijevozni pokret"
   - `used-transport-equipment` → "Korištena transportna oprema"
   - `carried-transport-equipment` → "Nosa transportna oprema"
   - `mode-code` → "Kod načina"
   - `registration-country` → "Država registracije"
   - `dangerous-goods-indicator` → "Indikator opasne robe"
   - `go-to-uil` → "Idi na zahtjev po UIL-u"

5. **Form Errors** (`form.error` section):
   - `required` → "ovo polje je obavezno"
   - `pattern` → "ovo polje ne odgovara traženom formatu"

6. **Loader** (`loader` section):
   - `text` → "Učitavanje"

#### B. Configure Language Detection

**File**: `portal-mock/src/app/app.config.ts`

Update the `TranslateModule` configuration to:
- Support Croatian language code (`hr` or `hr-HR`)
- Set default language based on user locale or browser settings
- Or add language selector in the UI

**Option 1: Browser-based detection:**
```typescript
defaultLanguage: navigator.language.startsWith('hr') ? 'hr' : 'en'
```

**Option 2: User preference:**
- Add language selector in menu
- Store preference in localStorage
- Load language on app initialization

#### C. Update XSLT Template Labels (Optional but Recommended)

**File**: `portal-mock/src/assets/xslt/eCMR.xslt`

**Current Issue**: The XSLT template has hardcoded English labels like:
- "SENDER" → Should be "POŠILJATELJ"
- "CONSIGNEE" → Should be "PRIMATELJ"
- "CARRIER" → Should be "PRIJEVOZNIK"
- "DELIVERY ADDRESS" → Should be "ADRESA ISPORUKE"
- etc.

**Options:**
1. **Create separate Croatian XSLT file**: `eCMR-hr.xslt`
2. **Use XSLT parameters**: Pass language parameter to XSLT
3. **Post-process HTML**: Translate labels after XSLT transformation (not recommended)

**Recommended Approach**: Create `eCMR-hr.xslt` with Croatian labels and select it based on user language preference.

**Complexity**: Medium
**Estimated Time**: 4-6 hours (including translation review)

---

## 5. Data Localization for Croatian Supervising Bodies

### 5.1 Current State
The actual consignment data (carrier names, consignment names, addresses, etc.) comes from XML files stored on platforms. These XML files contain the actual business data.

### 5.2 Required Steps

#### A. Create Croatian Test Data in XML Files

**Location**: `deploy/local/efti-gate/platform/files/`

**For Croatia Platform**, create XML files with:

1. **Croatian Carrier Names**:
   - Example: `<name>Hrvatski Prijevoznik d.o.o.</name>`
   - Example: `<name>Zagrebački Transport d.d.</name>`
   - Example: `<name>Adriatic Logistics Ltd.</name>`

2. **Croatian Consignment Names/Descriptions**:
   - Example: `<natureOfGoods>Elektronička oprema</natureOfGoods>`
   - Example: `<natureOfGoods>Hrana i piće</natureOfGoods>`
   - Example: `<natureOfGoods>Gradjevinski materijal</natureOfGoods>`

3. **Croatian Addresses**:
   - **Consignor (Sender)**:
     - City: `Zagreb`, `Split`, `Rijeka`, `Osijek`, `Zadar`
     - Street names: Croatian street names
     - Postal codes: Croatian format (5 digits)
   
   - **Consignee (Receiver)**:
     - Croatian cities and addresses
   
   - **Carrier Acceptance Location**:
     - Example: `Zagreb`, `Split`, `Rijeka`
   
   - **Delivery Location**:
     - Example: Croatian destination cities

4. **Croatian Vehicle Registration Numbers**:
   - Format: `HR-XXX-XXX` (e.g., `HR-ABC-123`, `HR-XYZ-789`)
   - In XML: `<usedTransportMeansId>HR-ABC-123</usedTransportMeansId>`

5. **Start and End Locations**:
   - **Carrier Acceptance Location** (start):
     - Example: `<cityName>Zagreb</cityName>`
     - Example: `<cityName>Split</cityName>`
   
   - **Delivery Location** (end):
     - Example: `<cityName>Rijeka</cityName>`
     - Example: `<cityName>Osijek</cityName>`

6. **Croatian Company Names**:
   - Consignor: Croatian company names
   - Consignee: Croatian company names
   - Carrier: Croatian transport company names

#### B. Example Croatian XML Dataset Structure

**File**: `deploy/local/efti-gate/platform/files/croatia-test-001.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<consignment xmlns="http://efti.eu/v1/consignment/common">
  <identifiers>
    <datasetIdentifier>croatia-test-001</datasetIdentifier>
    <gateIdentifier>croatia</gateIdentifier>
    <platformIdentifier>platform-hr</platformIdentifier>
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

#### C. Update ROI (Registry of Identifiers) with Croatian Data

**SQL Script**: `deploy/local/efti-gate/sql-meta/6-insert_test_data_HR.sql`

Insert test data into ROI with:
- Croatian vehicle IDs (HR-XXX-XXX)
- Croatian equipment IDs
- Croatian locations (Zagreb, Split, etc.)
- Croatian dates formatted appropriately

**Complexity**: Medium-High
**Estimated Time**: 4-6 hours (including data preparation and validation)

---

## 6. Domibus Configuration (Cross-Gate Communication)

### 6.1 Current State
Domibus handles secure communication between gates using eDelivery (AS4) protocol.

### 6.2 Required Steps

#### A. Configure Domibus Domains

**For each gate (HR, SLO, AT):**
- Create Domibus domain configuration
- Configure PMode files for gate-to-gate communication
- Set up keystores and truststores
- Configure party identifiers (croatia, slovenia, austria)

#### B. Create PMode Files

**Files Required:**
- `deploy/local/domibus/pmodes/croatia-pmode.xml`
- `deploy/local/domibus/pmodes/slovenia-pmode.xml`
- `deploy/local/domibus/pmodes/austria-pmode.xml`

Each PMode file must define:
- Party configurations for all three gates
- Message exchange patterns
- Security configurations

**Complexity**: High
**Estimated Time**: 4-6 hours (depending on Domibus setup complexity)

---

## 7. Additional Configuration

### 7.1 RabbitMQ Configuration
- Verify queue names are unique per gate (or shared appropriately)
- Configure message routing if needed

### 7.2 Network Configuration
- Ensure all services can communicate:
  - Gates ↔ Platforms
  - Gates ↔ Keycloak
  - Gates ↔ Domibus
  - Gates ↔ Databases
  - Portal ↔ Gates

### 7.3 Environment Variables
- Set appropriate environment variables for each service
- Configure URLs and ports correctly

---

## 8. Testing Checklist

### 8.1 Gate Functionality
- [ ] Each gate starts successfully
- [ ] Each gate connects to its database
- [ ] Each gate authenticates with Keycloak
- [ ] Each gate can communicate with its platform

### 8.2 User Authentication
- [ ] User from Croatia can log in
- [ ] User from Slovenia can log in
- [ ] User from Austria can log in
- [ ] Each user can only access their gate's data (if configured)

### 8.3 Portal Translation
- [ ] Portal displays in Croatian when Croatian user logs in
- [ ] All menu items are translated
- [ ] All form labels are translated
- [ ] All error messages are translated
- [ ] XSLT output shows Croatian labels (if implemented)

### 8.4 Data Localization
- [ ] Croatian platform returns XML with Croatian data
- [ ] Carrier names are in Croatian
- [ ] Addresses are in Croatian
- [ ] Vehicle registration numbers follow HR format
- [ ] Start and end locations are Croatian cities
- [ ] Data is understandable to Croatian supervising bodies

### 8.5 Cross-Gate Communication
- [ ] Croatia gate can query Slovenia gate
- [ ] Croatia gate can query Austria gate
- [ ] Slovenia gate can query Croatia gate
- [ ] Austria gate can query Croatia gate
- [ ] Domibus messages are sent and received correctly

---

## 9. Summary of Required Changes

### Files to Create/Modify:

1. **Gate Configuration** (9 files):
   - `deploy/local/efti-gate/gate/ENV/HR.env`
   - `deploy/local/efti-gate/gate/ENV/SLO.env`
   - `deploy/local/efti-gate/gate/ENV/AT.env`
   - `deploy/local/efti-gate/gate/application-HR.yml`
   - `deploy/local/efti-gate/gate/application-SLO.yml`
   - `deploy/local/efti-gate/gate/application-AT.yml`
   - `deploy/local/efti-gate/sql/5-create_tables_HR.sql`
   - `deploy/local/efti-gate/sql/6-create_tables_SLO.sql`
   - `deploy/local/efti-gate/sql/7-create_tables_AT.sql`

2. **Platform Configuration** (3 files):
   - `deploy/local/efti-gate/platform/application-HR.yml`
   - `deploy/local/efti-gate/platform/application-SLO.yml`
   - `deploy/local/efti-gate/platform/application-AT.yml`

3. **Platform Test Data** (Multiple XML files):
   - Croatian XML datasets with Croatian data
   - Slovenian XML datasets
   - Austrian XML datasets

4. **Keycloak Configuration** (3 files):
   - `deploy/local/efti-gate/keycloak/hr-export.json`
   - `deploy/local/efti-gate/keycloak/slo-export.json`
   - `deploy/local/efti-gate/keycloak/at-export.json`

5. **Portal Translation** (1-2 files):
   - `portal-mock/src/assets/i18n/hr.json` (or `hr-HR.json`)
   - `portal-mock/src/assets/xslt/eCMR-hr.xslt` (optional but recommended)

6. **Docker Compose** (1 file):
   - Update `deploy/local/efti-gate/docker-compose.yml` with new services

7. **Domibus Configuration** (Multiple files):
   - PMode files for each gate
   - Domain configuration files

8. **Database Scripts** (Multiple files):
   - Identifier database creation scripts
   - Test data insertion scripts
   - Gate registry updates

---

## 10. Estimated Total Effort

| Task | Complexity | Estimated Time |
|------|------------|---------------|
| Gate Configuration (3 gates) | Medium | 2-3 hours |
| Platform Configuration (3 platforms) | Medium | 3-4 hours |
| User Configuration (3 users) | Low | 30 minutes |
| Portal Translation | Medium | 4-6 hours |
| Data Localization | Medium-High | 4-6 hours |
| Domibus Configuration | High | 4-6 hours |
| Testing & Validation | Medium | 4-6 hours |
| **Total** | **High** | **22-32 hours** |

**Note**: These estimates assume:
- Familiarity with the codebase
- Access to Croatian translation resources
- Proper test data preparation
- No major technical issues

---

## 11. Risks and Considerations

### 11.1 Technical Risks
1. **Domibus Configuration Complexity**: Domibus setup can be complex and time-consuming
2. **XSLT Translation**: Hardcoded labels in XSLT may require separate template files
3. **Cross-Gate Communication**: Network and security configuration may have issues
4. **Database Migration**: Existing data may need migration or cleanup

### 11.2 Data Risks
1. **Data Quality**: Test data must be realistic and complete
2. **Schema Compliance**: XML files must strictly follow XSD schema
3. **Localization Completeness**: All relevant fields must be localized

### 11.3 Translation Risks
1. **Translation Accuracy**: Professional translation may be needed
2. **Terminology Consistency**: Transport/logistics terminology must be consistent
3. **XSLT Label Translation**: May require code changes if not parameterized

---

## 12. Recommendations

### 12.1 Phased Approach
1. **Phase 1**: Set up gates and platforms (basic functionality)
2. **Phase 2**: Configure users and authentication
3. **Phase 3**: Implement portal translation
4. **Phase 4**: Create and validate Croatian test data
5. **Phase 5**: Configure cross-gate communication
6. **Phase 6**: End-to-end testing

### 12.2 Priority Items
1. **High Priority**:
   - Gate and platform configuration
   - User authentication
   - Basic portal translation

2. **Medium Priority**:
   - Croatian test data creation
   - XSLT label translation
   - Cross-gate communication

3. **Low Priority**:
   - Advanced features
   - Performance optimization
   - Additional test scenarios

### 12.3 Testing Strategy
1. **Unit Testing**: Test each component individually
2. **Integration Testing**: Test gate-platform communication
3. **End-to-End Testing**: Test complete workflows
4. **User Acceptance Testing**: Have Croatian users test the system

---

## 13. Next Steps

1. **Review this analysis** with stakeholders
2. **Prioritize requirements** based on pilot timeline
3. **Allocate resources** for implementation
4. **Create detailed implementation plan** with specific tasks
5. **Set up development environment** for testing
6. **Begin implementation** following phased approach

---

## 14. References

- `PILOT_SETUP_GUIDE.md` - Detailed setup guide for 3-gate, 3-role pilot
- `REFERENCE_IMPLEMENTATION_USER_GUIDE.md` - User guide explaining system functionality
- `EFTI_TEST_FLOW_DOCUMENTATION.md` - Technical documentation
- `BUSINESS_TEST_SCENARIOS_REFERENCE_IMPLEMENTATION.md` - Test scenarios

---

**Document Version**: 1.0  
**Date**: 2024  
**Author**: Analysis based on codebase review







