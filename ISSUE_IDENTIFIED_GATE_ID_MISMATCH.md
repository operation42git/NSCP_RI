# Issue Identified: Gate ID Mismatch

## Problem Found

There is a **mismatch between the gate ID in the database and the gate owner in the configuration file**.

### Database Configuration
**File**: `deploy/local/efti-gate/gate-db/gate-config.sql`

```sql
INSERT INTO gate (country, gateid, createddate, lastmodifieddate)
VALUES ('AT', 'listenbourg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('HR', 'borduria', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('SI', 'syldavia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);  -- ⚠️ Slovenia gate ID is 'syldavia'
```

### Application Configuration
**File**: `deploy/local/efti-gate/gate/application-SLO.yml`

```yaml
gate:
  owner: slovenia  -- ⚠️ Gate owner is 'slovenia'
  country: SI
```

## Root Cause

When searching across all countries:

1. **Gate Resolution** (`EftiGateIdResolver.resolve()`):
   - Gets all gates from database: `['listenbourg', 'borduria', 'syldavia']`
   - Returns these as `destinationGatesUrls`

2. **Local Gate Check** (`ControlService.createIdentifiersControl()` line 338):
   ```java
   if (destinationUrl.equalsIgnoreCase(gateProperties.getOwner())) {
       // Local search
   } else {
       // Remote search
   }
   ```
   - Compares `'syldavia'` (from DB) with `'slovenia'` (from config)
   - They don't match, so it tries to send to remote gate `'syldavia'`

3. **Error Occurs**:
   - System tries to send identifier query to gate `'syldavia'`
   - But `'syldavia'` might not be properly configured as a remote gate
   - Or the gate doesn't exist, causing communication failure
   - This creates an ERROR request

4. **Error Propagation**:
   - If ANY request has ERROR status, entire control gets ERROR status
   - This hides successful results from other gates (Croatia, Austria)

## Solution

### Option 1: Update Database (Recommended)

Update the gate ID in the database to match the configuration:

```sql
UPDATE gate SET gateid = 'slovenia' WHERE country = 'SI';
```

Or update the gate-config.sql file:

```sql
INSERT INTO gate (country, gateid, createddate, lastmodifieddate)
VALUES ('AT', 'listenbourg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('HR', 'borduria', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
       ('SI', 'slovenia', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);  -- Changed from 'syldavia' to 'slovenia'
```

### Option 2: Update Configuration

Change `application-SLO.yml` to match database:

```yaml
gate:
  owner: syldavia  -- Changed from 'slovenia' to 'syldavia'
  country: SI
```

**Note**: Option 1 is recommended because 'slovenia' is more descriptive and matches the country code 'SI'.

## Verification Steps

After fixing, verify:

1. **Check database**:
   ```sql
   SELECT country, gateid FROM gate WHERE country = 'SI';
   -- Should show: SI | slovenia
   ```

2. **Check configuration**:
   ```bash
   grep -A 2 "gate:" deploy/local/efti-gate/gate/application-SLO.yml
   # Should show: owner: slovenia
   ```

3. **Test search**:
   - Search for identifier across all countries
   - Should not get ERROR status
   - Should see results from all gates (even if empty)

## Additional Issue: Error Handling

Even after fixing the gate ID mismatch, there's still a design issue:

**Current Behavior**: If ANY request has ERROR, entire control gets ERROR status.

**Better Behavior**: Should allow partial success - if some gates succeed and some fail, show successful results and indicate which gates failed.

This would require code changes in `ControlService.handleExistingControlWithoutData()`.

## Files to Check/Update

1. ✅ `deploy/local/efti-gate/gate-db/gate-config.sql` - Update gate ID
2. ✅ `deploy/local/efti-gate/gate/application-SLO.yml` - Verify owner matches
3. ⚠️ `implementation/gate/src/main/java/eu/efti/eftigate/service/ControlService.java` - Consider improving error handling



