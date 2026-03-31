# Database Setup and Test Data Guide

## ✅ Database Setup - Already Done!

The database setup happens **automatically** when Docker containers start. You don't need to manually set up anything.

### What Happens Automatically:

1. **Database Tables Created**
   - SQL scripts in `deploy/local/efti-gate/sql/` are automatically executed
   - Creates schemas: `eftibo`, `eftili`, `eftisy` (one for each gate)
   - Tables are created via Liquibase changelogs

2. **Gate Configuration Loaded**
   - The `deploy.sh` script runs `gate-config.sql` automatically
   - This loads the 3 gates: `borduria`, `listenbourg`, `syldavia`

3. **Test Data Available**
   - Platform simulators have test datasets in `/usr/src/myapp/cda/`
   - Test dataset ID: `12345678-ab12-4ab6-8999-123456789abc.xml`

### Verify Database Setup:

**Check if gates are configured:**
```powershell
docker exec reference-gate-shared-db psql -U efti -d efti -c "SET search_path TO eftibo; SELECT gateid, country FROM gate;"
```

**Expected output:**
```
   gateid    | country 
-------------+---------
 listenbourg | LI
 borduria    | BO
 syldavia    | SY
```

**Check platform test data:**
```powershell
docker exec efti-gate-platform-ACME-1 ls -la /usr/src/myapp/cda/
```

**Expected output:**
- `12345678-ab12-4ab6-8999-123456789abc.xml` ✅ (this is the test dataset!)

## 📋 Test Data Available

### 1. **Test Dataset ID** (Used in Postman Collection)
```
12345678-ab12-4ab6-8999-123456789abc
```

This dataset is **already available** on:
- **Croatia Platform (croatia eFTI platform)**: ✅ Available
- Location: `deploy/local/efti-gate/platform/cda/12345678-ab12-4ab6-8999-123456789abc.xml`

### 2. **Test Users** (Keycloak)
- `user_bo` / `Azerty59*123` - Borduria
- `user_li` / `Azerty59*123` - Listenbourg  
- `user_sy` / `Azerty59*123` - Syldavia

### 3. **Test Gates**
- `borduria` (BO) - Port 8880
- `listenbourg` (LI) - Port 8881
- `syldavia` (SY) - Port 8882

### 4. **Test Platforms**
- `croatia eFTI platform` (Croatia) - Port 8070
- `austria eFTI platform` (Austria) - Port 8072
- `slovenia eFTI platform` (Slovenia) - Port 8071

## 🧪 Ready to Test!

You can immediately test with Postman using:

**Test Request (Borduria Gate):**
```json
{
  "gateId": "borduria",
  "datasetId": "12345678-ab12-4ab6-8999-123456789abc",
  "platformId": "croatia eFTI platform",
  "subsetId": "full"
}
```

This will:
1. ✅ Query Borduria gate
2. ✅ Gate queries croatia eFTI platform
3. ✅ Platform returns test dataset XML
4. ✅ Gate returns consignment data

## 🔄 If You Need to Reload Test Data

### Option 1: Re-run gate-config.sql
```powershell
cd deploy/local/efti-gate
docker exec -i reference-gate-shared-db psql -U efti -d efti < gate-db/gate-config.sql
```

### Option 2: Full Redeploy
```bash
cd deploy/local/efti-gate
./deploy.sh skip-tests
```

This will:
- Rebuild and redeploy everything
- Re-run all SQL initialization scripts
- Reload gate configuration

## 📝 Database Structure

**Main Database** (`reference-gate-shared-db`):
- Schemas: `eftibo`, `eftili`, `eftisy`
- Tables: `gate`, `control`, `request`, `authority`, etc.

**Identifiers Database** (`psql-meta`):
- Registry of identifiers (vehicle IDs, container numbers, etc.)
- Used for identifier-based searches

## 🎯 Summary

**You're all set!** ✅

- ✅ Database tables: Created automatically
- ✅ Gate data: Loaded automatically  
- ✅ Test datasets: Available on platforms
- ✅ Test users: Configured in Keycloak

**No manual setup needed!** Just start using Postman or Swagger UI to test the APIs.




