# Server Startup Guide

This guide explains how to start the eFTI Reference Implementation server components.

## Prerequisites

Before starting the server, ensure you have the following installed:

- **Docker** and **Docker Compose** (required)
- **Java 17+** and **Maven** (required for building, if JAR files don't exist)
- **Git Bash** (recommended) or **WSL** (alternative)
- **Node.js 18+** (required only for portal mock)

### Pre-Startup Checks

1. **Docker Network**: Create the required Docker network (if it doesn't exist):
   ```bash
   docker network create efti-network
   ```

2. **JAR Files**: Check if JAR files exist:
   - `deploy/local/efti-gate/gate/efti-gate.jar`
   - `deploy/local/efti-gate/platform/platform-simulator.jar`
   
   If these files don't exist, the deploy script will build them automatically.

---

## Quick Start (Recommended: Git Bash)

The easiest way to start the server is using the deploy script in Git Bash.

### Step 1: Open Git Bash

Open Git Bash from anywhere in your system.

### Step 2: Run the Deploy Script

**Option A: Navigate first, then run**
```bash
cd /d/Radno/git/NSCP_RI/deploy/local/efti-gate
./deploy.sh skip-tests
```

**Option B: Run from project root**
If you're already in the project root directory (`/d/Radno/git/NSCP_RI` or similar):
```bash
cd deploy/local/efti-gate
./deploy.sh skip-tests
```

**Option C: Run in one command (from project root)**
```bash
cd deploy/local/efti-gate && ./deploy.sh skip-tests
```

**Note**: Replace `/d/Radno/git/NSCP_RI` with your actual project path if different. Use `pwd` in Git Bash to see your current directory.

**What this script does:**
1. Cleans and builds the Java project (skips tests for faster deployment)
2. Copies JAR files to deployment directories
3. Starts all Docker Compose services
4. Restarts the gate services (HR, SLO, AT for Croatia pilot setup)
5. Waits for gates to be ready (checks health endpoints)
6. Configures initial database data (eftihr, eftislo, eftiat schemas)

**Note**: This script is configured for the Croatia pilot setup (HR, SLO, AT gates). If you need the original setup (BO, LI, SY), you would need to modify the script accordingly.

**Alternative: Build with tests**
```bash
./deploy.sh
```
(This includes running tests, which takes longer)

---

## Manual Start (PowerShell Alternative)

If you prefer PowerShell or don't have Git Bash, you can run the commands manually:

### Step 1: Build the Project (if JAR files don't exist)

```powershell
cd implementation
mvn clean package -DskipTests
cd ..\deploy\local\efti-gate
Copy-Item ..\..\..\implementation\gate\target\gate-*.jar .\gate\efti-gate.jar
Copy-Item ..\..\..\implementation\platform-gate-simulator\target\platform-gate-simulator-*.jar .\platform\platform-simulator.jar
```

### Step 2: Start Docker Compose

```powershell
cd deploy\local\efti-gate
docker compose up -d
```

### Step 3: Restart Gate Services

```powershell
docker compose restart efti-gate-HR efti-gate-SLO efti-gate-AT
```

**Note**: If you're using the original setup (BO, LI, SY), use:
```powershell
docker compose restart efti-gate-BO efti-gate-LI efti-gate-SY
```

### Step 4: Configure Database (Manual)

For each schema (eftihr, eftislo, eftiat), run:

```powershell
# For HR (Croatia)
Get-Content .\gate-db\gate-config.sql | docker exec -i reference-gate-shared-db psql -U efti -d efti -c "set search_path to eftihr;" -f -

# For SLO (Slovenia)
Get-Content .\gate-db\gate-config.sql | docker exec -i reference-gate-shared-db psql -U efti -d efti -c "set search_path to eftislo;" -f -

# For AT (Austria)
Get-Content .\gate-db\gate-config.sql | docker exec -i reference-gate-shared-db psql -U efti -d efti -c "set search_path to eftiat;" -f -
```

**Note**: For original setup, use schemas: `eftibo`, `eftili`, `eftisy`

---

## Post-Deployment Configuration

### 1. Update Hosts File (Required)

Add these entries to your hosts file:

**Windows**: `C:\Windows\System32\drivers\etc\hosts` (edit as Administrator)

**For Croatia Pilot (HR, SLO, AT):**
```
127.0.0.1 auth.gate.croatia.eu
127.0.0.1 auth.gate.slovenia.eu
127.0.0.1 auth.gate.austria.eu
127.0.0.1 portal.efti.fr
```

**For Original Setup (BO, LI, SY):**
```
127.0.0.1 auth.gate.borduria.eu
127.0.0.1 auth.gate.syldavia.eu
127.0.0.1 auth.gate.listenbourg.eu
127.0.0.1 portal.efti.fr
```

**How to edit hosts file on Windows:**
1. Open Notepad as Administrator (Right-click → Run as administrator)
2. File → Open → Navigate to `C:\Windows\System32\drivers\etc\hosts`
3. Add the entries above
4. Save and close

### 2. Verify Services Are Running

Check container status:
```bash
docker compose ps
```

Or in PowerShell:
```powershell
docker compose -f deploy\local\efti-gate\docker-compose.yml ps
```

---

## Accessing the Services

Once the server is running, the following services are available:

### Gates (Croatia Pilot)

- **Croatia Gate (HR)**: http://localhost:8880
  - Health: http://localhost:8880/actuator/health
- **Slovenia Gate (SLO)**: http://localhost:8882
  - Health: http://localhost:8882/actuator/health
- **Austria Gate (AT)**: http://localhost:8881
  - Health: http://localhost:8881/actuator/health

### Gates (Original Setup)

- **Borduria Gate (BO)**: http://localhost:8880
- **Listenbourg Gate (LI)**: http://localhost:8881
- **Syldavia Gate (SY)**: http://localhost:8882

### Supporting Services

- **Keycloak (Authentication)**: http://localhost:8080
  - Admin Console: http://localhost:8080
  - Username: `admin`
  - Password: `secret`

- **RabbitMQ Management**: http://localhost:15672
  - Username: `guest`
  - Password: `guest`

- **PostgreSQL (Main DB)**: localhost:9001
  - Username: `efti`
  - Password: `root`
  - Database: `efti`

- **PostgreSQL (Metadata DB)**: localhost:2345
  - Username: `efti`
  - Password: `root`
  - Database: `efti`

- **Apache/Portal Proxy**: http://localhost:83
  - Also accessible via: http://portal.efti.fr:83 (after hosts file update)

### Platforms

- **Platform ACME (Croatia)**: http://localhost:8070
- **Platform MASSIVE (Slovenia)**: http://localhost:8071
- **Platform UMBRELLA (Austria)**: http://localhost:8072

---

## Useful Commands

### View Logs

**All services:**
```bash
docker compose logs -f
```

**Specific service:**
```bash
docker compose logs -f efti-gate-HR
docker compose logs -f keycloak
docker compose logs -f psql
```

**PowerShell:**
```powershell
docker compose -f deploy\local\efti-gate\docker-compose.yml logs -f efti-gate-HR
```

### Check Service Health

```bash
curl http://localhost:8880/actuator/health
curl http://localhost:8882/actuator/health
curl http://localhost:8881/actuator/health
```

**PowerShell:**
```powershell
Invoke-WebRequest -Uri http://localhost:8880/actuator/health
```

### Restart a Specific Service

```bash
docker compose restart efti-gate-HR
```

### Stop All Services

```bash
docker compose down
```

**PowerShell:**
```powershell
cd deploy\local\efti-gate
docker compose down
```

### Stop and Remove All Data (Clean Slate)

```bash
docker compose down -v
```

⚠️ **Warning**: This removes all volumes, including database data!

### Access Database

```bash
docker exec -it reference-gate-shared-db psql -U efti -d efti
```

Then set schema:
```sql
SET search_path TO eftihr;
```

---

## Troubleshooting

### Issue: Port Already in Use

**Error**: `Bind for 0.0.0.0:8880 failed: port is already allocated`

**Solution**:
1. Find the process using the port:
   ```powershell
   netstat -ano | findstr :8880
   ```
2. Stop the conflicting service or change the port in `docker-compose.yml`

### Issue: Docker Network Not Found

**Error**: `network efti-network not found`

**Solution**:
```bash
docker network create efti-network
```

### Issue: Gate Health Check Fails

**Symptoms**: Gates don't respond to health checks

**Solution**:
1. Check gate logs:
   ```bash
   docker compose logs efti-gate-HR
   ```
2. Verify database connectivity
3. Verify Keycloak is running
4. Check if JAR file exists: `deploy/local/efti-gate/gate/efti-gate.jar`

### Issue: Authentication Fails

**Symptoms**: Can't login to Keycloak or portal

**Solution**:
1. Verify Keycloak is running: http://localhost:8080
2. Check hosts file entries are correct
3. Verify realm configurations in `deploy/local/efti-gate/keycloak/`

### Issue: Database Connection Errors

**Symptoms**: Gates can't connect to database

**Solution**:
1. Check PostgreSQL container is running:
   ```bash
   docker compose ps psql
   ```
2. Verify database credentials in application configs
3. Check database schemas exist

### Issue: JAR Files Missing

**Symptoms**: Services fail to start, missing JAR files

**Solution**:
1. Build the project:
   ```bash
   cd implementation
   mvn clean package -DskipTests
   ```
2. Copy JAR files manually (see Manual Start section)
3. Or run the deploy script which does this automatically

### Issue: Git Bash Script Fails

**Symptoms**: `./deploy.sh` doesn't work

**Possible causes**:
- Script permissions (run `chmod +x deploy.sh`)
- Line endings (Windows vs Unix)
- Maven not in PATH

**Solution**: Use PowerShell manual commands instead

---

## Service Dependencies

Services start in this order:

1. **Infrastructure**: PostgreSQL, RabbitMQ, Keycloak
2. **Platforms**: platform-ACME, platform-MASSIVE, platform-UMBRELLA
3. **Gates**: efti-gate-HR, efti-gate-SLO, efti-gate-AT

The deploy script waits for gates to be healthy before configuring database data.

---

## Starting the Portal (Optional)

The portal mock runs separately and requires Node.js:

### Quick Start (Git Bash)

**First Time (Install Dependencies + Start):**
```bash
cd /d/Radno/git/NSCP_RI/portal-mock && npm ci && npm start
```

**Subsequent Runs (Start Only):**
```bash
cd /d/Radno/git/NSCP_RI/portal-mock && npm start
```

**From Project Root:**
```bash
cd portal-mock && npm ci && npm start  # First time
cd portal-mock && npm start            # Subsequent runs
```

**Note**: Replace `/d/Radno/git/NSCP_RI` with your actual project path if different.

### Prerequisites

Before starting the portal:
- Node.js installed (version ^18.19, ^20.11, or ^22.0.0)
- Docker services running (gates, Keycloak, Apache, etc.)
- Gate is running (HR gate on port 8880 for Croatia pilot)

### Access the Portal

The portal will be available at:
- **Development server**: http://localhost:4200 (Angular dev server)
- **Via Apache proxy**: http://portal.efti.fr:83 (recommended, after hosts file update)

**Important**: For Apache proxy access, add this to your hosts file (`C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 portal.efti.fr
```

### Login Credentials (Croatia Pilot)

- **Username**: `user_hr`
- **Password**: `Azerty59*123`
- **Realm**: `eFTI_HR`

**For other gates:**
- Slovenia: `user_slo` / `Azerty59*123`
- Austria: `user_at` / `Azerty59*123`

See [PORTAL_STARTUP_GUIDE.md](PORTAL_STARTUP_GUIDE.md) for more details.

---

## Next Steps

After the server is running:

1. **Verify all services**: Check health endpoints
2. **Test authentication**: Login to Keycloak admin console
3. **Test API**: Use Postman collections in `utils/`
4. **Start Portal**: Follow [PORTAL_STARTUP_GUIDE.md](PORTAL_STARTUP_GUIDE.md)
5. **Run tests**: Follow [BUSINESS_TEST_SCENARIOS_REFERENCE_IMPLEMENTATION_HR.md](BUSINESS_TEST_SCENARIOS_REFERENCE_IMPLEMENTATION_HR.md)

---

## Summary

**Quick Start (Git Bash):**
```bash
cd /d/Radno/git/NSCP_RI/deploy/local/efti-gate
./deploy.sh skip-tests
```

**Note**: Replace `/d/Radno/git/NSCP_RI` with your actual project path. From project root, you can use: `cd deploy/local/efti-gate && ./deploy.sh skip-tests`

**Start Portal (Git Bash):**
```bash
cd /d/Radno/git/NSCP_RI/portal-mock && npm start
```
(First time: `cd /d/Radno/git/NSCP_RI/portal-mock && npm ci && npm start`)

**Manual Start (PowerShell):**
```powershell
cd deploy\local\efti-gate
docker compose up -d
docker compose restart efti-gate-HR efti-gate-SLO efti-gate-AT
```

**Don't forget:**
- ✅ Create Docker network: `docker network create efti-network`
- ✅ Update hosts file (see Post-Deployment Configuration)
- ✅ Verify services are running: `docker compose ps`

