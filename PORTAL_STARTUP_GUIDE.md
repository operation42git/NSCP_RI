# Portal Startup Guide

## Quick Start

### Step 1: Install Dependencies (First Time Only)

```powershell
cd portal-mock
npm ci
```

### Step 2: Start the Portal

```powershell
npm start
```

The portal will start on **http://localhost:4200** (Angular dev server).

---

## Access the Portal

### Option 1: Direct Angular Dev Server
- **URL**: `http://localhost:4200`
- This is the Angular development server
- **Note**: You may need to configure the backend API URL in the portal config

### Option 2: Via Apache HTTPD (Recommended)
- **URL**: `http://portal.efti.fr:83`
- This uses the Apache proxy that handles OIDC authentication

**Important**: You need to add this to your hosts file:
```
127.0.0.1 portal.efti.fr
```

---

## Login Credentials

### For Croatia Pilot:

- **Username**: `user_hr`
- **Password**: `Azerty59*123`
- **Realm**: `eFTI_HR`

### For Other Gates:

- **Slovenia**: `user_slo` / `Azerty59*123`
- **Austria**: `user_at` / `Azerty59*123`

---

## Portal Configuration Notes

The portal currently references old gate names in some places. For the Croatia pilot:

1. **Gate List**: The portal may show `["france", "borduria", "syldavia"]` in the UIL search component
2. **Update Needed**: Change to `["croatia", "slovenia", "austria"]` in:
   - `portal-mock/src/app/pages/uil-search/uil-search.component.ts` (line 37)

---

## Troubleshooting

### Issue: Portal can't connect to gate API
- **Check**: Gate is running on port 8880 (Croatia)
- **Check**: CORS is configured correctly
- **Check**: API URL in portal environment config

### Issue: Authentication fails
- **Check**: Keycloak is running on port 8080
- **Check**: Hosts file has `auth.gate.croatia.eu` entry
- **Check**: Using correct username (`user_hr` not `user_bo`)

### Issue: Portal shows old gate names
- **Update**: `uil-search.component.ts` to use new gate IDs
- **Restart**: Portal after making changes

---

## Development Mode

The portal runs in development mode with hot-reload:
- Changes to TypeScript/HTML files will automatically reload
- Check console for any errors
- Default port: **4200**

---

## Production Build

To build for production:

```powershell
npm run build-prod
```

Output will be in `dist/efti-portal/` directory.







