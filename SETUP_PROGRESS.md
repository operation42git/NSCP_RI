# Local Setup Progress

## ✅ Completed Steps

1. **Java 17** - Installed and verified
   - Version: OpenJDK 17.0.17 (Temurin)

2. **Maven** - Installed and verified  
   - Version: Apache Maven 3.9.12
   - Installed via Scoop

3. **Java Project Build** - Successfully built
   - Built all modules: commons, efti-logger, efti-ws-plugin, edelivery-ap-connector, registry-of-identifiers, test-support, gate, platform-gate-simulator
   - JAR files copied to deployment directories:
     - `deploy/local/efti-gate/gate/efti-gate.jar`
     - `deploy/local/efti-gate/platform/platform-simulator.jar`
   - Note: Temporarily disabled OWASP dependency-check plugin due to NVD API 403 errors

4. **Docker** - Verified installation
   - Version: Docker 28.5.1

5. **Docker Network** - Created
   - Network: `efti-network` created successfully

## 📋 Next Steps

### Option 1: Use WSL/Git Bash (Recommended)

If you have WSL or Git Bash installed, you can run the deploy script directly:

```bash
cd deploy/local/efti-gate
./deploy.sh skip-tests
```

### Option 2: Manual Deployment (Windows PowerShell)

Since the deploy script is a bash script, you can run the commands manually:

1. **Start Docker Compose:**
   ```powershell
   cd deploy\local\efti-gate
   docker compose up -d
   ```

2. **Restart the gate services:**
   ```powershell
   docker compose restart efti-gate-BO efti-gate-LI efti-gate-SY
   ```

3. **Wait for services to be ready:**
   The gates should be available at:
   - Gate BO: http://localhost:8880
   - Gate LI: http://localhost:8881
   - Gate SY: http://localhost:8882

4. **Configure initial data:**
   ```powershell
   # This needs to be run for each schema (eftibo, eftili, eftisy)
   # You'll need to adapt the SQL command from the deploy.sh script
   ```

### Option 3: Install WSL/Git Bash

If you don't have bash available, you can install:
- **Git Bash**: https://git-scm.com/download/win
- **WSL**: Run `wsl --install` in PowerShell as Administrator

## 📝 Additional Configuration

Before running the services, you may need to:

1. **Update hosts file** (as Administrator):
   Add these entries to `C:\Windows\System32\drivers\etc\hosts`:
   ```
   127.0.0.1 auth.gate.borduria.eu
   127.0.0.1 auth.gate.syldavia.eu
   127.0.0.1 auth.gate.listenbourg.eu
   ```

2. **Check Docker Compose file:**
   Review `deploy/local/efti-gate/docker-compose.yml` to ensure all services are configured correctly.

## 🔍 Troubleshooting

- **If Maven build fails**: The dependency-check plugin was disabled. You can re-enable it later by uncommenting it in `implementation/pom.xml`
- **If Docker services fail**: Check logs with `docker compose logs <service-name>`
- **If ports are in use**: Modify ports in `docker-compose.yml` or stop conflicting services

## 📚 Documentation

- Main README: `README.md`
- Deployment Guide: `deploy/local/efti-gate/README.md`
- Implementation Guide: `implementation/README.md`







