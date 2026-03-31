# Domibus Troubleshooting Guide

This document describes common issues with Domibus deployment and their solutions.

## Issue: Domibus Container Fails to Start with "Cannot find setclasspath.sh"

### Symptoms
```
Cannot find /opt/domibus
/bin/setclasspath.sh
This file is needed to run this program
```

### Cause
The shell script `domibus/sh/setenv-node-1.sh` has Windows-style line endings (CRLF) instead of Unix-style (LF). This causes the shell to interpret paths incorrectly, adding a carriage return character to the end of paths.

### Solution
Convert the shell script to Unix line endings:

**Using PowerShell:**
```powershell
$content = Get-Content "deploy\local\domibus\domibus\sh\setenv-node-1.sh" -Raw
$content = $content -replace "`r`n", "`n"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
[System.IO.File]::WriteAllBytes("deploy\local\domibus\domibus\sh\setenv-node-1.sh", $bytes)
```

**Using Git Bash or WSL:**
```bash
sed -i 's/\r$//' deploy/local/domibus/domibus/sh/setenv-node-1.sh
```

**Using VS Code:**
1. Open the file
2. Click on "CRLF" in the bottom status bar
3. Select "LF"
4. Save the file

---

## Issue: MariaDB Health Check Fails / Database Tables Missing

### Symptoms
- MariaDB containers report as "unhealthy"
- Domibus fails with: `Table 'general_schema.tb_lock' doesn't exist`
- Only partial tables are created

### Cause
On Windows with WSL2, bind-mounting host directories for database storage can cause file system errors due to cross-filesystem operations between Windows NTFS and Linux ext4.

### Solution
Use Docker named volumes instead of bind mounts for MariaDB data storage.

The `docker-compose.yml` has been updated to use named volumes:

```yaml
# BEFORE (causes issues on Windows/WSL2):
volumes:
  - ./mariadb/sybo/data:/var/lib/mysql:Z

# AFTER (works correctly):
volumes:
  - mariadb-sybo-data:/var/lib/mysql
```

**To apply this fix:**

1. Stop all containers and remove volumes:
   ```bash
   docker compose down -v
   ```

2. The docker-compose.yml should have these volume definitions at the end:
   ```yaml
   volumes:
     mariadb-sybo-data:
     mariadb-li-data:
     mariadb-platform-data:
   ```

3. Start fresh:
   ```bash
   docker compose up -d
   ```

---

## Issue: Domibus Image Not Found or Corrupt

### Symptoms
- Docker cannot find `efti4eu/domibus` image
- Image pull fails or times out

### Solution
Pull the image from Docker Hub:

```bash
docker pull efti4eu/domibus
```

If the image appears corrupt, force a fresh pull:
```bash
docker rmi efti4eu/domibus --force
docker pull efti4eu/domibus
```

---

## Quick Reset Procedure

If you encounter persistent issues, perform a complete reset:

```bash
cd deploy/local/domibus

# Stop and remove everything including volumes
docker compose down -v

# Pull fresh images
docker pull efti4eu/domibus
docker pull mariadb:10.11.6
docker pull webcenter/activemq:latest
docker pull nginx:latest

# Start fresh
docker compose up -d
```

---

## Verification Steps

After starting Domibus, verify it's working:

1. **Check all containers are running:**
   ```bash
   docker ps --filter "name=domibus"
   ```

2. **Check Domibus web UI is accessible:**
   - Sybo: http://localhost:8081/domibus/
   - Li: http://localhost:8090/domibus/
   - Platform: http://localhost:8100/domibus/

3. **Get super user password from logs:**
   ```bash
   docker logs domibus-domibus-sybo-1 2>&1 | grep "Default password for user"
   ```

---

## First-Time Setup After Starting

1. **Login** to each Domibus instance with user `super` and the generated password from logs

2. **Change password** when prompted

3. **Upload PMode files** for each domain:
   - Go to PMode > Current > Upload
   - Select the appropriate `*-pmode.xml` from `deploy/local/domibus/pmodes/`

4. **Create plugin users** for each domain:
   - Go to Plugins Users
   - Create user: `{domain}_service_account` (e.g., `syldavia_service_account`)
   - Password: `Azerty59*1234567`
   - Role: `admin`
   - Click Save




