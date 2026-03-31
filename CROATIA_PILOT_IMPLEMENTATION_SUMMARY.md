# Croatia Pilot Implementation Summary

This document summarizes all the changes made to adapt the eFTI Reference Implementation for the Croatia pilot.

## Implementation Approach

**Option Selected**: Option 1 - Reuse and Rename Existing Gates

**Mapping Applied**:
- BO (Borduria) → HR (Croatia)
- SY (Syldavia) → SLO (Slovenia)  
- LI (Listenbourg) → AT (Austria)

---

## Completed Changes

### ✅ 1. Keycloak Configuration
- **Files Updated**:
  - `deploy/local/efti-gate/keycloak/hr-export.json` (created from bo-export.json)
  - `deploy/local/efti-gate/keycloak/slo-export.json` (created from sy-export.json)
  - `deploy/local/efti-gate/keycloak/at-export.json` (created from li-export.json)
- **Changes**: Updated realm names (eFTI_HR, eFTI_SLO, eFTI_AT), user names (user_hr, user_slo, user_at), and all realm references

### ✅ 2. Docker Compose Configuration
- **File Updated**: `deploy/local/efti-gate/docker-compose.yml`
- **Changes**: 
  - Renamed services: `efti-gate-BO` → `efti-gate-HR`, `efti-gate-SY` → `efti-gate-SLO`, `efti-gate-LI` → `efti-gate-AT`
  - Updated env_file references to new environment files
  - Updated Keycloak volume mounts to new realm files
  - Updated Keycloak network aliases: `auth.gate.croatia.eu`, `auth.gate.slovenia.eu`, `auth.gate.austria.eu`

### ✅ 3. RabbitMQ Configuration
- **File Updated**: `deploy/local/efti-gate/rabbitmq/rabbitmq-defs.json`
- **Changes**: 
  - Updated users: `bo` → `hr`, `sy` → `slo`, `li` → `at`
  - Updated vhosts: `bo` → `hr`, `sy` → `slo`, `li` → `at`
  - Updated all permissions, queues, exchanges, and bindings to reference new vhosts

### ✅ 4. Database Configuration
- **Files Updated**:
  - `deploy/local/efti-gate/gate-db/gate-config.sql` - Updated gate registry with HR, SI, AT
  - `deploy/local/efti-gate/sql/2-create_tables_HR.sql` (created)
  - `deploy/local/efti-gate/sql/3-create_tables_AT.sql` (created)
  - `deploy/local/efti-gate/sql/4-create_tables_SLO.sql` (created)
  - `deploy/local/efti-gate/sql-meta/2-create_tables_HR.sql` (created)
  - `deploy/local/efti-gate/sql-meta/3-create_tables_AT.sql` (created)
  - `deploy/local/efti-gate/sql-meta/4-create_tables_SLO.sql` (created)
- **Changes**: Updated schema names (eftiHR, eftiSLO, eftiAT) and gate registry entries

### ✅ 5. Postman Configuration
- **Files Updated**:
  - `utils/Docker.postman_environment.json` - Updated all environment variables (kc_hr_url, gate_hr_url, etc.)
  - `utils/eFTI.postman_collection.json` - Updated folder names, request bodies, usernames, realm paths, and variable references
- **Changes**: All BO/SY/LI references replaced with HR/SLO/AT, gate IDs updated (borduria → croatia, etc.)

### ✅ 6. Apache HTTPD Configuration
- **File Updated**: `deploy/local/efti-gate/httpd/config/conf.d/efti.conf`
- **Changes**: Updated OIDCProviderMetadataURL to point to Croatia realm

### ✅ 7. Portal Translation
- **File Created**: `portal-mock/src/assets/i18n/hr.json`
- **Content**: Complete Croatian translation of all UI elements (menu, forms, error messages, etc.)

### ✅ 8. README Update
- **File Updated**: `deploy/local/efti-gate/README.md`
- **Changes**: Updated hosts file instructions with new hostnames

### ✅ 9. Gate Configuration Files
- **Status**: Already configured correctly
- **Files Verified**:
  - `deploy/local/efti-gate/gate/ENV/HR.env`, `SLO.env`, `AT.env`
  - `deploy/local/efti-gate/gate/application-HR.yml`, `application-SLO.yml`, `application-AT.yml`
- **Content**: All files contain correct country codes, gate IDs, realm URIs, and schema names

---

## Pending Tasks

### ⏳ 1. Hosts File Configuration
**Action Required**: Manually add entries to system hosts file

**File**: `C:\Windows\System32\drivers\etc\hosts` (Windows) or `/etc/hosts` (Linux/Mac)

**Entries to Add**:
```
127.0.0.1 auth.gate.croatia.eu
127.0.0.1 auth.gate.slovenia.eu
127.0.0.1 auth.gate.austria.eu
```

**Note**: Requires administrator privileges to edit.

### ✅ 2. Domibus Configuration (COMPLETED)
**Files Created**:
- `deploy/local/domibus/pmodes/croatia-pmode.xml` (created)
- `deploy/local/domibus/pmodes/slovenia-pmode.xml` (created)
- `deploy/local/domibus/pmodes/austria-pmode.xml` (created)

**Changes Made**:
- Updated party IDs: borduria → croatia, syldavia → slovenia, listenbourg → austria
- Updated endpoint URLs to use new gate domains
- Updated initiator and responder parties in process configurations
- Maintained platform party references (acme, massivedynamic, umbrellacorporation)

**Note**: MariaDB init scripts and domain properties files may still need updates if Domibus domains are being used. These are typically auto-configured or require manual setup during Domibus deployment.

### ⏳ 3. Croatian Test Data (Manual Task)
**Action Required**: Create XML test files with Croatian data

**Location**: `deploy/local/efti-gate/platform/cda/`

**Requirements**:
- Croatian carrier names (e.g., "Hrvatski Prijevoz d.o.o.", "Croatia Transport Ltd.")
- Croatian addresses (e.g., "Zagreb, Ilica 1", "Split, Obala Hrvatskog narodnog preporoda 23")
- Croatian vehicle registration format (HR-XXX-XXX or similar)
- Croatian city names for start/end locations (e.g., Zagreb, Split, Rijeka, Osijek, Zadar)
- Croatian postal codes (e.g., 10000 for Zagreb, 21000 for Split)
- Country code "HR" for Croatian locations
- Croatian company names and contact information

**How to Create**:
1. Use existing file `deploy/local/efti-gate/platform/cda/12345678-ab12-4ab6-8999-123456789abc.xml` as template
2. Replace all country codes with "HR" where appropriate
3. Replace addresses with Croatian addresses
4. Replace company names with Croatian company names
5. Ensure XML validates against `schema/xsd/consignment-common.xsd`

**Note**: The existing XML file is very large (23,000+ lines). Consider:
- Creating a simplified version for testing
- Using a tool to generate valid Croatian test data
- Modifying the existing file with find/replace for country codes and key fields

### ⏳ 4. Portal Language Detection
**Action Required**: Update portal configuration to detect and use Croatian language

**Files to Check/Update**:
- `portal-mock/src/app/app.config.ts` (or similar configuration file)
- Language detection logic to load `hr.json` when Croatian is detected

---

## Testing Checklist

After completing all changes, verify:

### Authentication
- [ ] Users can authenticate with Keycloak (user_hr, user_slo, user_at)
- [ ] JWT tokens are issued correctly
- [ ] Portal authentication works

### Gate Functionality
- [ ] Croatia gate (HR) starts on port 8880
- [ ] Slovenia gate (SLO) starts on port 8882
- [ ] Austria gate (AT) starts on port 8881
- [ ] Each gate can query its platform
- [ ] Cross-gate communication works

### Database
- [ ] Gate registry contains HR, SI, AT entries
- [ ] Schemas eftiHR, eftiSLO, eftiAT are created
- [ ] Database connections work for all gates

### Portal
- [ ] Croatian translation is displayed
- [ ] All UI elements are translated
- [ ] Forms work correctly with Croatian labels

### Postman
- [ ] Environment variables are correct
- [ ] Authentication requests work
- [ ] UIL control requests work
- [ ] Identifier control requests work

### RabbitMQ
- [ ] Users hr, slo, at can connect
- [ ] Vhosts hr, slo, at are accessible
- [ ] Queues and exchanges are created correctly

---

## Deployment Steps

1. **Build Java Components**:
   ```bash
   cd implementation/
   mvn clean install
   ```

2. **Create Docker Network** (if not exists):
   ```bash
   docker network create efti-network
   ```

3. **Update Hosts File** (requires admin):
   - Add entries for auth.gate.croatia.eu, auth.gate.slovenia.eu, auth.gate.austria.eu

4. **Start Infrastructure**:
   ```bash
   cd deploy/local/efti-gate
   docker-compose up -d psql psql-meta keycloak rabbitmq
   ```

5. **Wait for Databases to Initialize** (30-60 seconds)

6. **Start Platforms**:
   ```bash
   docker-compose up -d platform-ACME platform-MASSIVE platform-UMBRELLA
   ```

7. **Start Gates**:
   ```bash
   docker-compose up -d efti-gate-HR efti-gate-SLO efti-gate-AT
   ```

8. **Start Portal** (if applicable):
   ```bash
   cd portal-mock
   npm install
   npm start
   ```

9. **Import Postman Collections**:
   - Import `utils/Docker.postman_environment.json`
   - Import `utils/eFTI.postman_collection.json`

10. **Test**: Follow testing checklist above

---

## Rollback Instructions

If you need to revert to the original setup:

1. Restore original Keycloak realm files (bo-export.json, sy-export.json, li-export.json)
2. Restore original docker-compose.yml service names
3. Restore original RabbitMQ configuration
4. Restore original database scripts
5. Restore original Postman files
6. Remove Croatian translation file (hr.json)

**Note**: Original gate configuration files (BO.env, application-BO.yml, etc.) may still exist alongside new ones.

---

## Estimated Completion Time

- **Completed**: ~5 hours
- **Remaining**:
  - ✅ Hosts file: Completed by user
  - ✅ Domibus configuration: Completed (PMode files created)
  - ⏳ Croatian test data: 1-2 hours (manual XML creation/editing)
  - ⏳ Portal language detection: 30 minutes (if needed)
  - ⏳ Testing: 1-2 hours

**Total Remaining**: 2.5-4.5 hours

---

## Notes

- All configuration files have been updated to use the new country codes and gate IDs
- The original fictional country setup (BO, SY, LI) has been replaced
- Platform names (ACME, MASSIVE, UMBRELLA) remain unchanged as they are platform identifiers, not country-specific
- Port assignments remain the same (8880, 8881, 8882) for consistency

