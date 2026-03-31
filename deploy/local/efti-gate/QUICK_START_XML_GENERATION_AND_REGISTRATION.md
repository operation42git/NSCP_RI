# Quick Start: XML Generation and Registration

This guide provides a quick reference for generating XML consignments and registering them in ROI (Registry of Identifiers).

## ⚠️ IMPORTANT: Registration is Required!

**Just generating an XML file is NOT enough!**

The XML must be **registered in the database** via the registration script. The registration process:
1. Uploads the XML to the platform simulator
2. Parses the consignment data
3. Extracts identifiers (vehicle IDs, equipment IDs, etc.)
4. **Stores the XML content in the `consignment_xml` database table**
5. **Stores identifiers in the ROI database tables** (`consignment`, `main_carriage_transport_movement`, etc.)
6. Makes the dataset searchable via UIL queries

**Without registration, the dataset will NOT appear in any searches!**

**Note**: XMLs are stored in the database table `consignment_xml`, NOT in the file system (`cda` folder is just for temporary generation).

## Prerequisites

1. **Python 3.6+** installed
2. **Platform simulator** running (port 8070 for Croatia)
3. **Keycloak** running and accessible
4. **Database** accessible (the identifiers are stored in the database, not just the file system)

## Step 1: Find Python Location (First Time Only)

On Windows, Python might not be in your PATH. Find it first:

```powershell
where.exe python
```

**Common locations:**
- `C:\Users\<username>\AppData\Local\Python\bin\python.exe`
- `C:\Users\<username>\AppData\Local\Microsoft\WindowsApps\python.exe`
- `C:\Python3x\python.exe`

**Test Python:**
```powershell
# Try standard command
python --version

# If that doesn't work, use full path
C:\Users\opera\AppData\Local\Python\bin\python.exe --version
```

## Step 2: Generate XML Consignment

### Navigate to CDA Directory

```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
```

### Generate XML (NORMAL Mode)

**Option A: If `python` command works:**
```powershell
python generate_realistic_croatian_data.py --mode NORMAL
```

**Option B: Use full Python path:**
```powershell
C:\Users\opera\AppData\Local\Python\bin\python.exe generate_realistic_croatian_data.py --mode NORMAL
```

**Option C: Generate ADR (Dangerous Goods):**
```powershell
python generate_realistic_croatian_data.py --mode ADR
```

### Output

The script will:
- Generate a new UUID (e.g., `cdcf9024-9454-4444-a467-bcb4b947d859`)
- Create XML file: `{uuid}.xml`
- Display the UUID for use in registration

**Example output:**
```
Dataset UUID: cdcf9024-9454-4444-a467-bcb4b947d859
Use this UUID when registering the dataset in ROI.
```

## Step 3: Register Dataset in ROI

### Navigate to Scripts Directory

```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\scripts"
```

### Register Dataset

Use the UUID from Step 2:

```powershell
.\register-dataset-simple.ps1 -DatasetId "cdcf9024-9454-4444-a467-bcb4b947d859"
```

**Note:** Use `register-dataset-simple.ps1` (recommended) instead of `register-dataset.ps1`

### Output

**Success:**
```
Dataset registered successfully!
Consignment saved and identifiers uploaded to gate

You can now query this dataset using UIL:
  Dataset ID: cdcf9024-9454-4444-a467-bcb4b947d859
```

## Complete Example

```powershell
# Step 1: Generate XML
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
python generate_realistic_croatian_data.py --mode NORMAL
# Output: Dataset UUID: cdcf9024-9454-4444-a467-bcb4b947d859

# Step 2: Register
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\scripts"
.\register-dataset-simple.ps1 -DatasetId "cdcf9024-9454-4444-a467-bcb4b947d859"
# Output: Dataset registered successfully!
```

## Troubleshooting

### Python Not Found

**Error:** `'python' is not recognized`

**Solution:**
1. Find Python: `where.exe python`
2. Use full path: `C:\Users\opera\AppData\Local\Python\bin\python.exe generate_realistic_croatian_data.py --mode NORMAL`

### Wrong Directory

**Error:** `Cannot find path ... because it does not exist`

**Solution:** Use absolute paths:
```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
```

### XML File Not Found During Registration

**Error:** `XML file not found: ...`

**Solution:**
- Verify the UUID matches the XML filename
- Check file exists in `platform/cda/` directory (temporary source file)
- Use `-XmlFile` parameter with full path if needed
- **Note:** After registration, XML is stored in `consignment_xml` database table, not in the file system

### Registration Failed

**Error:** `Failed to register dataset`

**Solutions:**
1. Verify platform simulator is running: `docker ps | findstr platform`
2. Check Keycloak is accessible: `http://auth.gate.croatia.eu:8080`
3. Verify OAuth client `simulator` exists in realm `eFTI_HR`
4. Check platform logs: `docker logs efti-gate-platform-ACME-1`

### 401 Unauthorized Error During Registration

**Error:** `401 Unauthorized` when platform simulator calls gate API

**Cause:** Authentication header mismatch between platform simulator and gate

**Solution:** 
- The platform simulator must send headers: `X-Pre-Authenticated-User-Id` and `X-Pre-Authenticated-User-Role`
- The gate expects these exact header names (without "Mock" prefix)
- This has been fixed in the code - rebuild and restart the platform simulator if you see this error

**To fix:**
1. Rebuild the platform simulator using the deployment script (from Git Bash):
   ```bash
   cd deploy/local/efti-gate
   ./deploy-with-maven.sh skip-tests
   ```
   This will rebuild the project and restart all containers including the platform simulator.

2. Or if you prefer to rebuild manually:
   ```bash
   cd implementation
   mvn clean package -DskipTests -pl platform-gate-simulator -am
   cd ../deploy/local/efti-gate
   cp -rf ../../implementation/platform-gate-simulator/target/platform-gate-simulator-*.jar ./platform/platform-simulator.jar
   docker restart efti-gate-platform-ACME-1
   ```

**To verify:**
1. Check platform simulator logs: `docker logs efti-gate-platform-ACME-1`
2. Verify gate is running: `docker ps | grep gate`
3. Try registering your XML again

## Modes

### NORMAL Mode
- Regular, non-dangerous goods
- No dangerous goods indicators
- Realistic normal transport data
- No multimodal transport

### ADR Mode
- Dangerous goods with proper UN codes
- ADR hazard classifications
- Proper shipping names matching UN codes
- All required ADR information

## Where Data is Stored

### XML File (Generated in Step 2 - Temporary)
- **Location:** `deploy/local/efti-gate/platform/cda/`
- **Format:** `{uuid}.xml`
- **Example:** `cdcf9024-9454-4444-a467-bcb4b947d859.xml`
- **Purpose:** Temporary source file for registration
- **Note:** This file is used during registration but **XML content is stored in the database**, not kept in this folder

### Database Storage (Registered in Step 3)

#### 1. XML Content Storage
- **Table:** `consignment_xml` (in main database: `reference-gate-shared-db`)
- **Columns:**
  - `dataset_id` (PRIMARY KEY) - The UUID of the dataset
  - `xml_content` (TEXT) - **Full XML consignment content**
  - `created_at` - Timestamp when registered
  - `updated_at` - Last update timestamp
- **Database:** Main database (PostgreSQL, port 9001)
- **Purpose:** Platform simulator retrieves full XML content from this table when serving consignment data

#### 2. Identifier Metadata Storage
- **Tables:** `consignment`, `main_carriage_transport_movement`, `used_transport_equipment`, etc.
- **Database:** ROI (Registry of Identifiers) - PostgreSQL (port 2345)
- **Schema:** `eftihr` (for Croatia), `eftislo` (for Slovenia), etc.
- **What's stored:** Identifiers extracted from the XML (vehicle IDs, equipment IDs, transport movement data)
- **Purpose:** Enables searching and querying datasets via UIL and identifier searches

**Without registration:**
- ❌ XML not in `consignment_xml` table → Platform cannot serve consignment data
- ❌ Identifiers not in ROI tables → UIL queries return "DATA_NOT_FOUND_ON_REGISTRY"
- ❌ Identifier searches will not find the dataset
- ❌ Portal will show no results

**After proper registration:**
- ✅ XML stored in `consignment_xml` table → Platform can serve full consignment data
- ✅ Identifiers stored in ROI tables → UIL queries will find the dataset
- ✅ Identifier searches will return matches
- ✅ Portal will display the consignment data

## Next Steps

After registration, you can:
- Query the dataset using UIL searches in the portal
- Search by identifiers (vehicle ID, equipment ID)
- View the full consignment data (transformed via XSLT)

## Verify Registration in Database

After registration, you can verify the XML was stored in the database:

```sql
-- Connect to main database where XMLs are stored
docker exec -it reference-gate-shared-db psql -U postgres -d efti

-- List all registered XMLs
SELECT dataset_id, LENGTH(xml_content) as xml_size, created_at, updated_at 
FROM consignment_xml 
ORDER BY created_at DESC;

-- View specific XML content
SELECT dataset_id, xml_content 
FROM consignment_xml 
WHERE dataset_id = 'cdcf9024-9454-4444-a467-bcb4b947d859';

-- Check identifiers in ROI database
docker exec -it efti-gate-psql-meta-1 psql -U postgres -d efti
SET search_path TO eftihr;
SELECT dataset_id, gate_id, platform_id FROM consignment;
```

## Slovenia-Specific Instructions

For Slovenia gate registration, see the dedicated guide:

- **Slovenia XML Generation Guide:** `platform/cda/SLOVENIA_XML_GENERATION_GUIDE.md`

This guide includes:
- Slovenia-specific configuration (port 8071, realm `eFTI_SLO`)
- Template XML file (`69022a3b-26d3-46f9-9282-d11617ff4afe.xml`)
- How to create minimal data JSON files
- Complete registration examples for Slovenia

## Related Documentation

- **Slovenia Guide:** `platform/cda/SLOVENIA_XML_GENERATION_GUIDE.md`
- **XML Generation Details:** `platform/cda/GENERATE_CROATIAN_DATA_README.md`
- **Registration Details:** `scripts/README.md`
- **Database Access:** `../DATABASE_ACCESS_GUIDE.md`

