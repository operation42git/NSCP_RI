# Next Steps After Successful Deployment

## ✅ Deployment Complete!

All services are running successfully:
- **3 Gates**: BO (Borduria), LI (Listenbourg), SY (Syldavia)
- **3 Platforms**: ACME, MASSIVE, UMBRELLA
- **Keycloak**: Authentication server
- **PostgreSQL**: Databases (main + metadata)
- **RabbitMQ**: Message broker
- **Apache**: Portal proxy

## 🔍 Verify Services Are Running

### Check Service Health

**In PowerShell:**
```powershell
# Check gate health endpoints
Invoke-WebRequest -Uri http://localhost:8880/actuator/health
Invoke-WebRequest -Uri http://localhost:8881/actuator/health
Invoke-WebRequest -Uri http://localhost:8882/actuator/health
```

**In Git Bash or Browser:**
- Gate BO: http://localhost:8880/actuator/health
- Gate LI: http://localhost:8881/actuator/health
- Gate SY: http://localhost:8882/actuator/health

### Check All Containers
```bash
docker compose -f deploy/local/efti-gate/docker-compose.yml ps
```

## 📝 Important Configuration Steps

### 1. Update Hosts File (Required)

Add these entries to `C:\Windows\System32\drivers\etc\hosts` (run Notepad as Administrator):

```
127.0.0.1 auth.gate.borduria.eu
127.0.0.1 auth.gate.syldavia.eu
127.0.0.1 auth.gate.listenbourg.eu
```

**How to edit hosts file:**
1. Open Notepad as Administrator (Right-click → Run as administrator)
2. File → Open → Navigate to `C:\Windows\System32\drivers\etc\hosts`
3. Add the three lines above
4. Save and close

### 2. Access Keycloak Admin Console

- **URL**: http://localhost:8080
- **Username**: `admin`
- **Password**: `secret`

You can manage realms, users, and clients here.

### 3. Access RabbitMQ Management

- **URL**: http://localhost:15672
- **Username**: `guest`
- **Password**: `guest`

Monitor message queues and broker status.

### 4. Access Portal (Apache)

- **URL**: http://localhost:83

This is the portal application proxy.

## 🧪 Testing the System

### Option 1: Use Postman Collections

1. **Import Postman Collections:**
   - Open Postman
   - File → Import
   - Navigate to `utils/` directory
   - Import `eFTI.postman_collection.json`
   - Import `Docker.postman_environment.json`

2. **Configure Environment:**
   - Select the "Docker" environment
   - Update variables if needed (defaults should work)

3. **Test Authentication:**
   - Start with authentication requests to get tokens
   - Then test gate-to-gate communication
   - Test platform-to-gate communication

### Option 2: Use API Documentation

The gates expose OpenAPI/Swagger documentation:
- Gate BO: http://localhost:8880/swagger-ui.html (or `/swagger-ui/index.html`)
- Gate LI: http://localhost:8881/swagger-ui.html
- Gate SY: http://localhost:8882/swagger-ui.html

## 📚 Documentation Resources

- **Main README**: `README.md`
- **Deployment Guide**: `deploy/local/efti-gate/README.md`
- **Implementation Guide**: `implementation/README.md`
- **API Schemas**: `schema/api-schemas/`
- **Test Flow Documentation**: `EFTI_TEST_FLOW_DOCUMENTATION.md`
- **Pilot Setup Guide**: `PILOT_SETUP_GUIDE.md`

## 🔧 Common Operations

### View Logs
```bash
# View logs for a specific service
docker compose -f deploy/local/efti-gate/docker-compose.yml logs efti-gate-BO
docker compose -f deploy/local/efti-gate/docker-compose.yml logs -f efti-gate-BO  # Follow logs

# View all logs
docker compose -f deploy/local/efti-gate/docker-compose.yml logs
```

### Restart Services
```bash
# Restart a specific service
docker compose -f deploy/local/efti-gate/docker-compose.yml restart efti-gate-BO

# Restart all services
docker compose -f deploy/local/efti-gate/docker-compose.yml restart
```

### Stop Services
```bash
docker compose -f deploy/local/efti-gate/docker-compose.yml down
```

### Start Services Again
```bash
docker compose -f deploy/local/efti-gate/docker-compose.yml up -d
```

## 🎯 Quick Test Checklist

- [ ] All containers are running (`docker compose ps`)
- [ ] Hosts file updated with Keycloak domains
- [ ] Keycloak admin console accessible (http://localhost:8080)
- [ ] Gate health endpoints responding
- [ ] Postman collections imported and configured
- [ ] Can authenticate and get tokens
- [ ] Can send test messages between gates

## 🐛 Troubleshooting

### If gates are not responding:
1. Check logs: `docker compose logs efti-gate-BO`
2. Verify database is ready: `docker compose logs psql`
3. Check Keycloak is running: `docker compose logs keycloak`

### If authentication fails:
1. Verify Keycloak is accessible
2. Check realm configuration in Keycloak admin console
3. Verify JWT issuer URI in gate configuration matches Keycloak

### If ports are in use:
- Check what's using the port: `netstat -ano | findstr :8880`
- Modify ports in `docker-compose.yml` if needed

## 🚀 Next Development Steps

1. **Explore the API**: Use Swagger UI to explore available endpoints
2. **Test Flows**: Follow the test flow documentation
3. **Customize Configuration**: Modify gate configurations in `deploy/local/efti-gate/gate/`
4. **Add Test Data**: Use SQL scripts to add test data to databases
5. **Develop Features**: Make changes in `implementation/` and rebuild

## 📞 Need Help?

- Check the documentation files listed above
- Review logs for error messages
- Check the project's main README for architecture overview

---

**Congratulations! Your eFTI Reference Implementation is now running locally! 🎉**







