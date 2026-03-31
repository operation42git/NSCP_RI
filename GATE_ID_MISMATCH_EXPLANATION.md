# Gate ID Mismatch - Why Slovenia Needs Fix But Others Don't

## The Real Issue

You're absolutely right to question this! The problem affects **ALL gates** when they try to communicate with Slovenia, not just Slovenia itself.

## How It Works

### When Searching All Countries

When any gate (Croatia, Austria, or Slovenia) searches across all countries:

1. **System queries database** → Gets gate IDs: `['listenbourg', 'borduria', 'syldavia']`
2. **For each gate ID**:
   - If matches `gateProperties.getOwner()` → Local search ✅
   - Otherwise → Remote search (needs configuration)

### Croatia Gate Searching All Countries

**Croatia's Config** (`application-HR.yml`):
```yaml
gate:
  owner: borduria  # Croatia's own ID

remoteGates:
  - gateId: "slovenia"  # ⚠️ Expects 'slovenia'
    useRestApi: true
    restApiBaseUrl: "http://efti-gate-SLO:8882"
  - gateId: "listenbourg"  # ✅ Matches database
    useRestApi: true
    restApiBaseUrl: "http://efti-gate-AT:8881"
```

**What Happens**:
- Gets `'syldavia'` from database for Slovenia
- `'syldavia'` ≠ `'borduria'` → Tries remote search
- Looks for `remoteGates` entry with `gateId = 'syldavia'` → **NOT FOUND!** ❌
- Falls back to Domibus with gateId `'syldavia'` → May fail or use wrong configuration

### Austria Gate Searching All Countries

**Austria's Config** (`application-AT.yml`):
```yaml
gate:
  owner: listenbourg  # Austria's own ID
```

**What Happens**:
- Gets `'syldavia'` from database for Slovenia
- `'syldavia'` ≠ `'listenbourg'` → Tries remote search
- No `remoteGates` config in Austria → Falls back to Domibus
- Uses gateId `'syldavia'` → May fail if Domibus not configured correctly

### Slovenia Gate Searching All Countries

**Slovenia's Config** (`application-SLO.yml`):
```yaml
gate:
  owner: slovenia  # Slovenia's own ID
```

**What Happens**:
- Gets `'syldavia'` from database for Slovenia
- `'syldavia'` ≠ `'slovenia'` → Tries remote search ❌
- Should be local search! This is the immediate problem.

## Why The Mismatch Exists

Looking at the configurations:

1. **Slovenia's Domibus domain**: Uses `domain=syldavia` (line 29 in application-SLO.yml)
   - This is the **Domibus domain name**, not the gate ID
   - Domibus domain ≠ Gate ID

2. **Croatia's remoteGates config**: Explicitly says `gateId: "slovenia"` (line 41)
   - This is what Croatia expects when communicating with Slovenia
   - This should match what's in the database

3. **Database**: Has `gateid = 'syldavia'` for Slovenia
   - This doesn't match what Croatia expects (`'slovenia'`)
   - This doesn't match Slovenia's own owner (`'slovenia'`)

## The Fix

**Database should have**: `gateid = 'slovenia'` for Slovenia

This ensures:
- ✅ Slovenia gate recognizes itself (local search)
- ✅ Croatia gate finds Slovenia in `remoteGates` config
- ✅ Austria gate can communicate via Domibus (if configured)
- ✅ All gates use consistent gate ID

## Why Austria and Croatia "Work"

They don't actually work correctly - they just haven't been tested yet!

- **Austria**: No `remoteGates` config, so it falls back to Domibus. If Domibus isn't configured for Slovenia with gateId `'syldavia'`, it will fail silently or error.

- **Croatia**: Has `remoteGates` config expecting `'slovenia'`, but database has `'syldavia'`. When Croatia tries to reach Slovenia:
  - Looks for `gateId: 'syldavia'` in remoteGates → Not found
  - Falls back to Domibus → May work if Domibus is configured, but inconsistent

## Conclusion

**All gates need the database to have Slovenia as `'slovenia'`**, not `'syldavia'`, because:

1. Slovenia's own config expects `owner: slovenia`
2. Croatia's remoteGates config expects `gateId: "slovenia"`
3. Consistency across all gates

The fix I made is correct - Slovenia should be `'slovenia'` in the database.



