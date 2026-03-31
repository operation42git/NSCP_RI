# Swagger UI Authentication Guide

## Problem: "Invalid parameter: redirect_uri" Error

When clicking "Authorize" in Swagger UI, you may see this error because Swagger UI's OAuth implicit flow redirect URI isn't configured in Keycloak.

## Solution 1: Use Bearer Token Manually (Easiest)

### Step 1: Get an Access Token

**For Gate BO (Borduria):**
```powershell
$body = 'username=user_bo&password=Azerty59*123&grant_type=password&client_id=gate&client_secret=4ce0hW2Zqjxa7FR4hz1OshuHwSPGWFGO'
$tokenResponse = Invoke-RestMethod -Uri 'http://auth.gate.borduria.eu:8080/realms/eFTI_BO/protocol/openid-connect/token' -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded'
Write-Host "Access Token:"
Write-Host $tokenResponse.access_token
```

**For Gate LI (Listenbourg):**
```powershell
$body = 'username=user_li&password=Azerty59*123&grant_type=password&client_id=gate&client_secret=ypr3UOyvOE6FMlIu7hMPJybKvbCQyevn'
$tokenResponse = Invoke-RestMethod -Uri 'http://auth.gate.listenbourg.eu:8080/realms/eFTI_LI/protocol/openid-connect/token' -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded'
Write-Host $tokenResponse.access_token
```

**For Gate SY (Syldavia):**
```powershell
$body = 'username=user_sy&password=Azerty59*123&grant_type=password&client_id=gate&client_secret=gBA8cALFquHGWDMScI6PrQxVvRYsPsZu'
$tokenResponse = Invoke-RestMethod -Uri 'http://auth.gate.syldavia.eu:8080/realms/eFTI_SY/protocol/openid-connect/token' -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded'
Write-Host $tokenResponse.access_token
```

### Step 2: Use Token in Swagger UI

1. Open Swagger UI: http://localhost:8880/swagger-ui/index.html
2. Click the **"Authorize"** button (lock icon at the top)
3. In the "Available authorizations" dialog, look for a field to enter a Bearer token
4. Copy the token from PowerShell output
5. Paste it in the format: `Bearer <your-token-here>`
   - Or just paste the token if there's a specific "Bearer token" field
6. Click "Authorize" and "Close"
7. Now you can test API endpoints!

## Solution 2: Fix Keycloak Configuration (Advanced)

If you want Swagger UI's OAuth flow to work automatically, you need to:

1. **Access Keycloak Admin Console**: http://localhost:8080 (admin/secret)
2. **Navigate to**: Clients → gate (in the eFTI_BO realm)
3. **Enable**: 
   - Implicit flow
4. **Add Redirect URI**:
   - `http://localhost:8880/swagger-ui/oauth2-redirect.html`
   - `http://localhost:8881/swagger-ui/oauth2-redirect.html`
   - `http://localhost:8882/swagger-ui/oauth2-redirect.html`
5. **Save** and restart Keycloak container

**Note**: After modifying Keycloak config files, you need to restart the Keycloak container:
```powershell
docker compose -f deploy/local/efti-gate/docker-compose.yml restart keycloak
```

## Quick Test

After getting a token, test it works:
```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri 'http://localhost:8880/v1/control/uil' -Headers $headers
```

If you get data back (not 401), the token works!

## Token Expiry

Tokens expire after **10 minutes**. When you get a 401 error, get a new token using the commands above.







