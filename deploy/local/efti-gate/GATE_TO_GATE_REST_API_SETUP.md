# Gate-to-Gate REST API Setup

## Overview

This implementation allows gates to communicate directly via REST API, bypassing Domibus for cross-gate searches. This is particularly useful when Domibus configuration is problematic.

## How It Works

1. **Configuration**: Each gate can be configured with a list of remote gates that should be accessed via REST API
2. **Authentication**: Uses header-based authentication (`X-Pre-Authenticated-User-Id` and `X-Pre-Authenticated-User-Role`) - no JWT tokens needed
3. **Flow**: When a gate needs to search on another gate:
   - Checks if the destination gate is configured for REST API
   - If yes: Makes direct REST calls to `/v1/control/uil` endpoint
   - If no: Falls back to Domibus (existing behavior)

## Configuration

Add `remoteGates` section to your gate's `application-*.yml` file:

```yaml
gate:
  remoteGates:
    - gateId: "slovenia"        # Must match the remote gate's "owner" value
      useRestApi: true
      restApiBaseUrl: "http://efti-gate-SLO:8882"  # Docker service name and port
    - gateId: "listenbourg"     # Austria gate
      useRestApi: true
      restApiBaseUrl: "http://efti-gate-AT:8881"
```

### Important Notes:

1. **gateId must match**: The `gateId` value must exactly match the `owner` value in the remote gate's configuration
2. **Service names**: Use Docker service names (e.g., `efti-gate-SLO`) not hostnames
3. **Ports**: Use the internal Docker port, not the mapped host port

## Current Implementation Status

✅ **UIL Search**: Fully implemented and ready to test
⏳ **Identifier Search**: Not yet implemented (will fall back to Domibus)

## Testing

### 1. Restart the Gate

After updating configuration, restart the gate:

```bash
docker-compose restart efti-gate-HR
```

### 2. Test UIL Search

1. Open the portal (Croatia gate)
2. Perform a UIL search targeting a remote gate (e.g., "slovenia")
3. Check the gate logs - you should see:
   ```
   Using REST API for gate 'slovenia' instead of Domibus
   Calling remote gate 'slovenia' via REST API for UIL search: datasetId=...
   ```

### 3. Verify in Logs

Check the gate logs for:
- `Using REST API for gate '...' instead of Domibus` - confirms REST is being used
- `POST http://efti-gate-SLO:8882/v1/control/uil` - shows the REST call
- `UIL search via REST completed successfully` - confirms success

## Troubleshooting

### Authentication Errors

If you see `401 Unauthorized`:
- Verify the remote gate has the updated security configuration
- Check that headers are being sent (check logs)

### Connection Errors

If you see connection errors:
- Verify Docker service names are correct
- Check that ports match the gate's internal port
- Ensure gates are on the same Docker network

### Still Using Domibus

If searches still go through Domibus:
- Verify `gateId` matches the remote gate's `owner` exactly (case-sensitive)
- Check that `useRestApi: true` is set
- Verify the configuration file was loaded (check startup logs)

## Security

- **Header-based authentication**: Gates authenticate using headers, no JWT needed
- **Trusted network**: This is designed for gate-to-gate communication within a trusted Docker network
- **Fallback**: If REST is not configured, falls back to Domibus automatically

## Next Steps

To implement identifier search via REST:
1. Add similar REST client methods for identifier endpoints
2. Update `GateIntegrationService` to handle identifier requests
3. Follow the same pattern as UIL search




