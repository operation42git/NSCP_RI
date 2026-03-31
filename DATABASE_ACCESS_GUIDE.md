# Database Access Guide

This guide explains how to access the PostgreSQL database to check ROI (Registry of Identifiers) and other tables.

## Database Connection Details

### ROI Database (Registry of Identifiers) ⭐ **THIS IS WHERE ROI DATA IS STORED**
- **Container**: `efti-gate-psql-meta-1`
- **Host Port**: `2345`
- **Container Port**: `5432`
- **Database Name**: `efti`
- **Username**: `postgres`
- **Password**: `root`
- **Contains**: ROI tables (`consignment`, `main_carriage_transport_movement`, `used_transport_equipment`, etc.) in schemas `eftihr`, `eftislo`, `eftiat`, etc.

### Main Database (Gate Control & Request Data + XML Storage) ⭐ **XMLs ARE STORED HERE**
- **Container**: `reference-gate-shared-db`
- **Host Port**: `9001`
- **Container Port**: `5432`
- **Database Name**: `efti`
- **Username**: `efti` (for application) or `postgres` (for admin)
- **Password**: `root`
- **Contains**: 
  - Gate control/request tables
  - **`public.consignment_xml` table** - **This is where XML consignments are stored** (not in file system!)
  - XML content is stored in `xml_content` column as TEXT

## Access Methods

### Method 1: Using Docker Exec (Recommended)

#### Connect to ROI Database (psql-meta):
```bash
docker exec -it efti-gate-psql-meta-1 psql -U postgres -d efti
```

#### Or run single commands:
```bash
docker exec -i efti-gate-psql-meta-1 psql -U postgres -d efti -c "SET search_path TO eftihr; SELECT * FROM consignment;"
```

#### Connect to Main Database (reference-gate-shared-db):
```bash
docker exec -it reference-gate-shared-db psql -U postgres -d efti
```

### Method 2: Using psql from Host Machine

If you have PostgreSQL client installed on your host machine:

**For ROI Database:**
```bash
psql -h localhost -p 2345 -U postgres -d efti
```

**For Main Database:**
```bash
psql -h localhost -p 9001 -U postgres -d efti
```

Password: `root` (for both)

### Method 3: Using Database GUI Tools

#### pgAdmin / DBeaver / DataGrip / TablePlus

**ROI Database Connection (psql-meta):**
- **Host**: `localhost`
- **Port**: `2345`
- **Database**: `efti`
- **Username**: `postgres`
- **Password**: `root`

**Main Database Connection (reference-gate-shared-db):**
- **Host**: `localhost`
- **Port**: `9001`
- **Database**: `efti`
- **Username**: `postgres`
- **Password**: `root`

## Database Schemas

The database contains multiple schemas:

- **`public`** - Shared tables (e.g., `consignment_xml` for platform simulator)
- **`eftihr`** - Croatia gate ROI tables
- **`eftislo`** - Slovenia gate ROI tables
- **`eftiat`** - Austria gate ROI tables
- **`eftibo`** - Borduria gate ROI tables
- **`eftili`** - Listenbourg gate ROI tables
- **`eftisy`** - System gate ROI tables

## Useful SQL Queries

### Check Consignment XML Storage (Platform Simulator) ⭐ **XMLs ARE STORED HERE**

**⚠️ IMPORTANT:** XML consignments are stored in the **`consignment_xml` database table**, NOT in the file system (`cda` folder)!

**Access Main Database:**
```bash
docker exec -it reference-gate-shared-db psql -U postgres -d efti
```

```sql
-- List all stored XML consignments
SELECT dataset_id, LENGTH(xml_content) as xml_size, created_at, updated_at 
FROM consignment_xml 
ORDER BY created_at DESC;

-- View XML content for a specific dataset
SELECT dataset_id, xml_content 
FROM consignment_xml 
WHERE dataset_id = 'c2d3e4f5-6789-4abc-def0-1234567890ab';

-- Count total registered XMLs
SELECT COUNT(*) as total_xmls FROM consignment_xml;

-- Find recently registered XMLs
SELECT dataset_id, created_at 
FROM consignment_xml 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Check ROI Tables (Croatia Gate)

**⚠️ IMPORTANT**: ROI tables are stored in the **`psql-meta`** database (port 2345), NOT in `reference-gate-shared-db`!

**Note**: ROI tables (consignment, main_carriage_transport_movement, etc.) are created by Liquibase when the gate starts. They may not exist until identifiers are registered.

**Access ROI Database:**
```bash
docker exec -it efti-gate-psql-meta-1 psql -U postgres -d efti
```

```sql
-- Set schema
SET search_path TO eftihr;

-- Check if ROI tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'eftihr' 
AND table_name IN ('consignment', 'main_carriage_transport_movement', 'used_transport_equipment')
ORDER BY table_name;

-- List all consignments (if table exists)
SELECT id, gate_id, platform_id, dataset_id, createddate, lastmodifieddate
FROM consignment
ORDER BY createddate DESC;

-- Count consignments
SELECT COUNT(*) FROM consignment;

-- List transport vehicles
SELECT c.dataset_id, m.used_transport_means_id, m.used_transport_means_registration_country
FROM consignment c
JOIN main_carriage_transport_movement m ON m.consignment_id = c.id;

-- List transport equipment
SELECT c.dataset_id, e.equipment_id, e.registration_country, e.sequence_number
FROM consignment c
JOIN used_transport_equipment e ON e.consignment_id = c.id;
```

### Check Control & Request Tables (Gate)
```sql
-- Set schema
SET search_path TO eftihr;

-- List all controls
SELECT id, datasetid, requestid, requesttype, status, platformid, gateid, createddate
FROM control
ORDER BY createddate DESC;

-- List all requests
SELECT r.id, r.status, r.edeliverymessageid, r.retry, c.datasetid, c.requesttype
FROM request r
JOIN control c ON r.control = c.id
ORDER BY r.id DESC;

-- Find requests for a specific dataset
SELECT r.id, r.status, c.datasetid, c.requesttype, c.status as control_status
FROM request r
JOIN control c ON r.control = c.id
WHERE c.datasetid = 'c2d3e4f5-6789-4abc-def0-1234567890ab';
```

### Cross-Database Queries

**Note**: ROI data is in `psql-meta` (port 2345) while XML storage is in `reference-gate-shared-db` (port 9001). You cannot join across databases directly. Instead:

**Check ROI data:**
```bash
docker exec -i efti-gate-psql-meta-1 psql -U postgres -d efti -c "SET search_path TO eftihr; SELECT dataset_id, createddate FROM consignment ORDER BY createddate DESC;"
```

**Check XML storage:**
```bash
docker exec -i reference-gate-shared-db psql -U postgres -d efti -c "SELECT dataset_id, created_at FROM consignment_xml ORDER BY created_at DESC;"
```

## Common Database Operations

### List all tables in a schema:
```sql
\dt schema_name.*
```

### Describe a table structure:
```sql
\d schema_name.table_name
```

### List all schemas:
```sql
\dn
```

### Switch schema context:
```sql
SET search_path TO eftihr;
```

### Export data to CSV:
```sql
\copy (SELECT * FROM consignment_xml) TO '/tmp/consignment_xml.csv' CSV HEADER;
```

### Check table sizes:
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname IN ('public', 'eftihr', 'eftislo', 'eftiat')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Quick Access Scripts

### PowerShell Script to Connect:
```powershell
# Connect to ROI database (where consignment tables are)
docker exec -it efti-gate-psql-meta-1 psql -U postgres -d efti

# Or run a query on ROI database
docker exec -i efti-gate-psql-meta-1 psql -U postgres -d efti -c "SET search_path TO eftihr; SELECT COUNT(*) FROM consignment;"

# Connect to main database (where XML storage is)
docker exec -it reference-gate-shared-db psql -U postgres -d efti

# Or run a query on main database
docker exec -i reference-gate-shared-db psql -U postgres -d efti -c "SELECT COUNT(*) FROM consignment_xml;"
```

### Bash Script:
```bash
#!/bin/bash
# Connect to ROI database
docker exec -it efti-gate-psql-meta-1 psql -U postgres -d efti

# Or connect to main database
docker exec -it reference-gate-shared-db psql -U postgres -d efti
```

## Troubleshooting

### If connection fails:
1. Check if container is running: `docker ps | grep reference-gate-shared-db`
2. Check container logs: `docker logs reference-gate-shared-db`
3. Verify port mapping: `docker port reference-gate-shared-db`

### If you get permission errors:
- Use `postgres` user instead of `efti` user for admin operations
- Check schema permissions: `\dn+ schema_name`

## Example: Complete ROI Check

```bash
# Connect to ROI database (psql-meta)
docker exec -it efti-gate-psql-meta-1 psql -U postgres -d efti
```

```sql
-- Check Croatia ROI
SET search_path TO eftihr;

-- Summary
SELECT 
    'Consignments' as table_name,
    COUNT(*) as count
FROM consignment
UNION ALL
SELECT 
    'Transport Vehicles',
    COUNT(*)
FROM main_carriage_transport_movement
UNION ALL
SELECT 
    'Transport Equipment',
    COUNT(*)
FROM used_transport_equipment
UNION ALL
SELECT 
    'Controls',
    COUNT(*)
FROM control
UNION ALL
SELECT 
    'Requests',
    COUNT(*)
FROM request;

-- Recent consignments
SELECT 
    dataset_id,
    platform_id,
    gate_id,
    createddate
FROM consignment
ORDER BY createddate DESC
LIMIT 10;
```

