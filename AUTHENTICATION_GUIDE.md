# Authentication Guide - How to Access the Gates

## Quick Summary

**You DON'T need to access Keycloak in a browser first.** Here's how it works:

### 1. **Viewing Swagger UI** (No authentication needed)
- ✅ **Direct access**: http://localhost:8880/swagger-ui/index.html
- ✅ **Gate LI**: http://localhost:8881/swagger-ui/index.html  
- ✅ **Gate SY**: http://localhost:8882/swagger-ui/index.html
- You can view the API documentation immediately

### 2. **Making API Calls** (Authentication required)

When you want to **test API endpoints** from Swagger UI or Postman, you have two options:

#### Option A: Use Swagger UI's Built-in Authentication
1. Open Swagger UI: http://localhost:8880/swagger-ui/index.html
2. Click the **"Authorize"** button (lock icon) at the top
3. Swagger will redirect you to Keycloak login
4. Login with:
   - **Username**: `user_bo` (for Gate BO)
   - **Password**: `Azerty59*123`
5. Swagger will automatically use the token for API calls

#### Option B: Get Token Manually (for Postman/scripts)
Use this PowerShell command to get a token:

```powershell
# For Gate BO (Borduria)
$body = 'username=user_bo&password=Azerty59*123&grant_type=password&client_id=gate&client_secret=4ce0hW2Zqjxa7FR4hz1OshuHwSPGWFGO'
$tokenResponse = Invoke-RestMethod -Uri 'http://auth.gate.borduria.eu:8080/realms/eFTI_BO/protocol/openid-connect/token' -Method Post -Body $body -ContentType 'application/x-www-form-urlencoded'
$token = $tokenResponse.access_token

# Use the token in API calls
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri 'http://localhost:8880/v1/control/uil' -Headers $headers
```

**IMPORTANT**: Use `auth.gate.borduria.eu:8080` (NOT `localhost:8080`) when getting tokens!

### 3. **Keycloak Admin Console** (Optional, for administration)
- ✅ **URL**: http://localhost:8080 OR http://auth.gate.borduria.eu:8080
- **Admin credentials**: `admin` / `secret`
- This is only needed if you want to manage users, realms, or clients

## Why the Hostname Matters

When you request a token from Keycloak:
- ❌ `http://localhost:8080` → Token issuer: `localhost:8080` (Gates will reject it)
- ✅ `http://auth.gate.borduria.eu:8080` → Token issuer: `auth.gate.borduria.eu:8080` (Gates accept it)

Your hosts file maps `auth.gate.borduria.eu` to `127.0.0.1`, so both URLs go to the same place, but the **token issuer must match** what the gates expect.

## Testing the Gates - Step by Step

### Step 1: Verify Services Are Running
```powershell
# Check health endpoints (no auth needed)
Invoke-WebRequest -Uri http://localhost:8880/actuator/health
Invoke-WebRequest -Uri http://localhost:8881/actuator/health
Invoke-WebRequest -Uri http://localhost:8882/actuator/health
```

### Step 2: Open Swagger UI
Open in browser: http://localhost:8880/swagger-ui/index.html

### Step 3: Test an API Endpoint
1. Click "Authorize" button in Swagger UI
2. Login with `user_bo` / `Azerty59*123`
3. Try an API endpoint like `GET /v1/control/uil`

## Credentials Summary

| Service | Realm | Username | Password | Client Secret |
|---------|-------|----------|----------|---------------|
| Gate BO | eFTI_BO | user_bo | Azerty59*123 | 4ce0hW2Zqjxa7FR4hz1OshuHwSPGWFGO |
| Gate LI | eFTI_LI | user_li | Azerty59*123 | ypr3UOyvOE6FMlIu7hMPJybKvbCQyevn |
| Gate SY | eFTI_SY | user_sy | Azerty59*123 | gBA8cALFquHGWDMScI6PrQxVvRYsPsZu |
| Keycloak Admin | master | admin | secret | N/A |

## Troubleshooting

**If you get 401 Unauthorized:**
- Make sure you're using `auth.gate.borduria.eu:8080` (not `localhost:8080`) for token requests
- Verify your hosts file has the entries (it does!)
- Check that the token hasn't expired (tokens last 10 minutes)

**If Swagger UI won't authenticate:**
- Try using the manual token method (Option B above)
- Check browser console for errors
- Make sure Keycloak is running: http://localhost:8080







