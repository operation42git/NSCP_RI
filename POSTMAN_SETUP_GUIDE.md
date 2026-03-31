# Postman Setup Guide for eFTI Gate Testing

## Step-by-Step Setup

### Step 1: Import Collections and Environment

1. **Open Postman**
   - Download Postman if you don't have it: https://www.postman.com/downloads/

2. **Import the Collection**
   - Click **Import** button (top left)
   - Click **Upload Files**
   - Navigate to: `utils/eFTI.postman_collection.json`
   - Click **Import**

3. **Import the Environment**
   - Click **Import** again
   - Navigate to: `utils/Docker.postman_environment.json`
   - Click **Import**

4. **Select the Environment**
   - In the top-right corner, click the environment dropdown
   - Select **"Docker"** environment
   - This ensures all variables like `{{gate_bo_url}}` and `{{kc_bo_url}}` work correctly

### Step 2: Update Environment Variables (If Needed)

The environment file should already have correct values, but verify:

1. Click the **eye icon** next to the environment dropdown (top-right)
2. Or go to **Environments** (left sidebar) → **Docker**
3. Verify these key variables:
   - `kc_bo_url`: `http://auth.gate.borduria.eu:8080`
   - `gate_bo_url`: `http://efti.gate.borduria.eu:8880`
   - `gate_bo_url` might need to be changed to `http://localhost:8880` (see below)

**Note**: The gate URLs use domain names. If you haven't added these to your hosts file, you have two options:

**Option A**: Add to hosts file (Recommended):
```
127.0.0.1 efti.gate.borduria.eu
127.0.0.1 efti.gate.listenbourg.eu
127.0.0.1 efti.gate.syldavia.eu
```

**Option B**: Update environment variables to use `localhost`:
- `gate_bo_url`: `http://localhost:8880`
- `gate_li_url`: `http://localhost:8881`
- `gate_sy_url`: `http://localhost:8882`

### Step 3: How to Use - Testing with Gate BO (Borduria)

1. **Get Authentication Token** (Automatically stores it)
   - In Postman, expand: **eFTI** → **BO** → **Gate**
   - Click: **"Authentication BO"**
   - Click **Send**
   - ✅ Check the response - you should see `access_token` in the response
   - ✅ The token is **automatically saved** to a global variable `{{access_token}}`

2. **Test API Endpoints**
   - All other requests in the collection automatically use `{{access_token}}`
   - Example: Click **"POST UIL Control"**
   - Click **Send**
   - The request automatically includes: `Authorization: Bearer {{access_token}}`

### Step 4: Understanding the Collection Structure

```
eFTI
├── BO (Borduria)
│   ├── Gate
│   │   ├── Authentication BO ← Run this first!
│   │   ├── POST UIL Control
│   │   ├── GET UIL Control
│   │   └── ... other endpoints
│   └── Simulator
├── LI (Listenbourg)
│   └── ... same structure
└── SY (Syldavia)
    └── ... same structure
```

### Step 5: Workflow

**For each gate (BO, LI, SY):**

1. **First request**: Run the **"Authentication [GATE]"** request
   - This gets a token and stores it globally
   - Token is valid for ~10 minutes

2. **Subsequent requests**: Use any other request
   - They automatically use the stored token
   - No need to manually add Authorization headers

3. **When token expires** (after ~10 minutes):
   - You'll get 401 Unauthorized errors
   - Simply run the Authentication request again
   - Token is automatically updated

### Step 6: Troubleshooting

**Issue: "Could not get any response"**
- Check if Docker services are running: `docker compose ps`
- Verify gate URL in environment: Should be `http://localhost:8880` or `http://efti.gate.borduria.eu:8880`

**Issue: "401 Unauthorized"**
- Run the Authentication request first
- Check if token expired (tokens last ~10 minutes)
- Verify credentials in Authentication request are correct

**Issue: "Invalid redirect_uri" or Keycloak errors**
- Make sure you're using `http://auth.gate.borduria.eu:8080` (not `localhost:8080`)
- Verify your hosts file has the Keycloak entries

**Issue: Environment variables not working**
- Make sure "Docker" environment is selected (top-right dropdown)
- Check variable names match exactly: `{{gate_bo_url}}`, `{{access_token}}`, etc.

### Step 7: Quick Test

1. **Authentication BO** → Send → Should return `access_token`
2. **POST UIL Control** → Send → Should return `requestId`
3. **GET UIL Control** → Send → Should return control data

### Benefits of Using Postman

✅ **Automatic token management** - No manual copying/pasting  
✅ **Pre-configured requests** - All endpoints ready to use  
✅ **Environment variables** - Easy switching between gates  
✅ **Token auto-refresh** - Just re-run authentication when needed  
✅ **Request history** - Track what you've tested  
✅ **Collections** - Organized by gate and functionality  

### Advanced: Using Postman Variables

The collection uses these global variables:
- `{{access_token}}` - Stored after authentication
- `{{requestId}}` - Stored after POST requests for GET requests

You can view/manage variables:
- Click **Environment** icon (top-right)
- Or use **Collections** → **Variables** tab







