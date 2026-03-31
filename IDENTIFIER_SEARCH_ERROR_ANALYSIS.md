# Identifier Search Error Analysis

## Problem Description

When searching for identifier `SILJ5678CD` across all countries (without `eftiGateIndicator`), the system returns `ERROR` status even though the search should work across multiple countries.

## Root Cause Analysis

### Error Flow

Looking at the code flow, errors can occur at several points:

#### 1. **Blank/Null Gate ID** (Most Likely Cause)

**Location**: `implementation/gate/src/main/java/eu/efti/eftigate/service/ControlService.java:330-345`

```java
private void createIdentifiersControl(final ControlDto controlDto, final SearchWithIdentifiersRequestDto searchWithIdentifiersRequestDto) {
    final List<String> destinationGatesUrls = eftiGateIdResolver.resolve(searchWithIdentifiersRequestDto);
    
    controlDto.setRequestType(gateToRequestTypeFunction.apply(destinationGatesUrls));
    final ControlDto saveControl = this.save(controlDto);
    CollectionUtils.emptyIfNull(destinationGatesUrls).forEach(destinationUrl -> {
        if (StringUtils.isBlank(destinationUrl)) {  // ⚠️ ERROR HERE
            getRequestService(saveControl.getRequestType()).createRequest(saveControl, RequestStatusEnum.ERROR);
        } else if (destinationUrl.equalsIgnoreCase(gateProperties.getOwner())) {
            eftiAsyncCallsProcessor.checkLocalRepoAsync(searchWithIdentifiersRequestDto, saveControl);
        } else {
            getRequestService(saveControl.getRequestType()).createAndSendRequest(saveControl, destinationUrl);
        }
    });
}
```

**Issue**: If `eftiGateIdResolver.resolve()` returns a list containing `null` or blank strings, the system creates an ERROR request for each blank entry.

**Why this happens**: Looking at `EftiGateIdResolver.resolve()`:

```java
return destinationGatesIndicatorMap.values()
    .stream()
    .map(gateEntity -> gateEntity != null ? gateEntity.getGateId() : null)  // ⚠️ Can return null
    .collect(Collectors.toCollection(ArrayList::new));
```

If a gate entity exists but has a `null` `gateId`, or if `mapRequestedCountriesToRegisteredGates()` returns `null` for a requested country, this causes the error.

#### 2. **Error Propagation**

**Location**: `implementation/gate/src/main/java/eu/efti/eftigate/service/ControlService.java:227-237`

```java
private ControlDto handleExistingControlWithoutData(final ControlEntity controlEntity) {
    if (hasRequestInError(controlEntity)) {  // ⚠️ Checks if ANY request has ERROR
        controlEntity.setStatus(StatusEnum.ERROR);
    } else if (shouldSetTimeoutTo(controlEntity)) {
        controlEntity.setStatus(StatusEnum.TIMEOUT);
        updateControlRequestsWithTimeoutStatus(controlEntity);
    } else if (PENDING.equals(controlEntity.getStatus())) {
        controlEntity.setStatus(StatusEnum.COMPLETE);
    }
    return mapperUtils.controlEntityToControlDto(controlRepository.save(controlEntity));
}

private boolean hasRequestInError(final ControlEntity controlEntity) {
    return CollectionUtils.emptyIfNull(controlEntity.getRequests())
            .stream()
            .anyMatch(requestEntity -> RequestStatusEnum.ERROR == requestEntity.getStatus());  // ⚠️ ANY error = ERROR status
}
```

**Issue**: If **ANY** request has `ERROR` status, the entire control gets `ERROR` status. This means if one gate fails (e.g., Slovenia gate not properly registered), the entire search fails.

#### 3. **Gate Registration Issue**

**Location**: `implementation/gate/src/main/java/eu/efti/eftigate/service/gate/EftiGateIdResolver.java:51-62`

```java
private Map<CountryIndicator, GateEntity> mapRequestedCountriesToRegisteredGates(
        final List<CountryIndicator> requestedCountryIndicators, 
        final List<GateEntity> registeredDestinationGates) {
    final Map<CountryIndicator, GateEntity> destinationGatesIndicatorMap = new EnumMap<>(CountryIndicator.class);

    CollectionUtils.emptyIfNull(requestedCountryIndicators).forEach(countryIndicator -> {
        final GateEntity foundedRegisteredGated = CollectionUtils.emptyIfNull(registeredDestinationGates).stream()
                .filter(registeredGate -> countryIndicator.equals(registeredGate.getCountry()))
                .findFirst()
                .orElse(null);  // ⚠️ Returns null if gate not found
        destinationGatesIndicatorMap.put(countryIndicator, foundedRegisteredGated);
    });
    return destinationGatesIndicatorMap;
}
```

**Issue**: If Slovenia gate (`SI`) is requested but not found in `registeredDestinationGates`, it returns `null`, which later causes the ERROR.

## How to Check Logs

### 1. **Application Logs**

Check the gate application logs for error messages:

```bash
# If running in Docker
docker logs efti-gate-gate-1 --tail 100

# Or check log files in the gate directory
cd deploy/local/efti-gate/gate
# Look for application.log or similar files
```

**Look for**:
- `"Received invalid IdentifierQuery"` - XML validation error
- `"error while sending request"` - Domibus communication error
- `"Request has been register with controlId"` - Request creation logs
- `"Identifier control with request uuid"` - Control creation logs

### 2. **Database Check**

Check if gates are properly registered:

```sql
-- Connect to gate database
SELECT * FROM gate WHERE country = 'SI';  -- Check if Slovenia gate exists
SELECT * FROM gate;  -- List all registered gates
```

**Expected**: Each country should have a gate entry with:
- `country` = CountryIndicator (e.g., 'SI', 'HR')
- `gate_id` = Gate ID (not null, not blank)

### 3. **Check Request Status**

Query the database to see request statuses:

```sql
-- Check control status
SELECT c.requestid, c.status, c.requesttype, e.errorcode, e.errordescription
FROM control c
LEFT JOIN error e ON c.error_id = e.id
WHERE c.requestid = 'fc0fc795-bbb8-45d5-8ad4-b60787260af6';  -- Your request ID

-- Check individual request statuses
SELECT r.id, r.status, r.gate_id_dest, r.error_id
FROM request r
JOIN control c ON r.control_id = c.id
WHERE c.requestid = 'fc0fc795-bbb8-45d5-8ad4-b60787260af6';
```

**Look for**:
- Requests with `status = 'ERROR'`
- Requests with `gate_id_dest` = null or blank
- Error codes and descriptions

### 4. **Check Gate Configuration**

Verify gate properties:

```bash
# Check application.yml or application-SLO.yml
cat deploy/local/efti-gate/gate/application-SLO.yml
# Or
cat deploy/local/efti-gate/gate/application.yml
```

**Look for**:
- `gate.owner` - Should match the gate ID
- `gate.country` - Should be set correctly
- Gate database connection settings

## Common Causes

### 1. **Slovenia Gate Not Registered**

**Symptom**: `destinationUrl` is blank/null for Slovenia

**Solution**: Register Slovenia gate in the database:

```sql
INSERT INTO gate (country, gate_id) VALUES ('SI', 'SLO');  -- Adjust gate_id as needed
```

### 2. **Gate ID Mismatch**

**Symptom**: Gate exists but `gateId` doesn't match `gateProperties.getOwner()`

**Solution**: Ensure `gate.gate_id` in database matches `gate.owner` in application.yml

### 3. **Database Connection Issue**

**Symptom**: `gateRepository.findAll()` returns empty list or incomplete data

**Solution**: Check database connectivity and gate table data

### 4. **Domibus Communication Error**

**Symptom**: Error when sending request to remote gate

**Solution**: Check Domibus configuration and connectivity

## Recommended Fixes

### Fix 1: Filter Out Null/Blank Gate IDs

**File**: `implementation/gate/src/main/java/eu/efti/eftigate/service/gate/EftiGateIdResolver.java`

```java
public List<String> resolve(final SearchWithIdentifiersRequestDto identifiersRequestDto) {
    // ... existing code ...
    
    return destinationGatesIndicatorMap.values()
            .stream()
            .filter(Objects::nonNull)  // Filter out null gate entities
            .map(GateEntity::getGateId)
            .filter(StringUtils::isNotBlank)  // Filter out blank/null gate IDs
            .collect(Collectors.toCollection(ArrayList::new));
}
```

### Fix 2: Don't Create ERROR for Missing Gates

**File**: `implementation/gate/src/main/java/eu/efti/eftigate/service/ControlService.java`

```java
CollectionUtils.emptyIfNull(destinationGatesUrls).forEach(destinationUrl -> {
    if (StringUtils.isBlank(destinationUrl)) {
        log.warn("Skipping gate with blank/null gate ID for control {}", saveControl.getRequestId());
        // Don't create ERROR request, just skip
        return;  // or continue
    } else if (destinationUrl.equalsIgnoreCase(gateProperties.getOwner())) {
        eftiAsyncCallsProcessor.checkLocalRepoAsync(searchWithIdentifiersRequestDto, saveControl);
    } else {
        getRequestService(saveControl.getRequestType()).createAndSendRequest(saveControl, destinationUrl);
    }
});
```

### Fix 3: Partial Success Handling

**File**: `implementation/gate/src/main/java/eu/efti/eftigate/service/ControlService.java`

Modify `hasRequestInError()` to only set ERROR if ALL requests failed, not just one:

```java
private boolean hasRequestInError(final ControlEntity controlEntity) {
    List<RequestEntity> requests = CollectionUtils.emptyIfNull(controlEntity.getRequests());
    if (requests.isEmpty()) {
        return false;
    }
    // Only error if ALL requests failed
    return requests.stream()
            .allMatch(requestEntity -> RequestStatusEnum.ERROR == requestEntity.getStatus());
}
```

## Debugging Steps

1. **Check Gate Registration**:
   ```sql
   SELECT * FROM gate;
   ```

2. **Check Request Status**:
   ```sql
   SELECT r.*, c.requestid 
   FROM request r 
   JOIN control c ON r.control_id = c.id 
   WHERE c.requestid = 'YOUR_REQUEST_ID';
   ```

3. **Check Application Logs**:
   - Look for "Identifier control with request uuid"
   - Look for "Request has been register with controlId"
   - Look for ERROR messages

4. **Verify Gate Configuration**:
   - Check `application.yml` for gate settings
   - Verify `gate.owner` matches database `gate_id`

5. **Test with Single Gate**:
   - Try searching with `eftiGateIndicator: ["HR"]` (Croatia)
   - If that works, the issue is with Slovenia gate registration

## Expected Behavior

When searching across all countries:
- System should query all registered gates
- Each gate should return results (even if empty)
- Control status should be `COMPLETE` if at least one gate returns successfully
- Individual gate results should show in `identifiers` array with their `gateIndicator`

## Current Behavior (Bug)

- If ANY gate has a blank/null `gateId`, an ERROR request is created
- If ANY request has ERROR status, entire control gets ERROR status
- This prevents successful results from other gates from being shown



