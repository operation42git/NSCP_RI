# Dataset Registration Scripts

These scripts register datasets in the **database**, which is **required** before UIL queries can find them.

## ⚠️ IMPORTANT: Why Registration is Required

**Just generating an XML file is NOT enough!**

The registration process:
1. Reads the XML file from `platform/cda/` (temporary source file)
2. Uploads it to the platform simulator API
3. Platform parses the XML and:
   - **Stores the full XML content in `consignment_xml` database table**
   - Extracts identifiers from the XML
   - **Stores identifiers in ROI database tables** (`consignment`, `main_carriage_transport_movement`, etc.)
4. Gate can now find the dataset when queried

**Where XMLs are stored:**
- ❌ **NOT** in the `cda` folder (that's just for temporary generation)
- ✅ **IN** the `consignment_xml` table in the database (main database, port 9001)
- ✅ Identifiers in ROI database tables (port 2345, schema `eftihr` for Croatia)

**Without registration:**
- ❌ XML not in `consignment_xml` table → Platform cannot serve data
- ❌ Identifiers not in ROI tables → UIL queries return "DATA_NOT_FOUND_ON_REGISTRY"
- ❌ Identifier searches return no results
- ❌ Dataset is invisible to the system

## Quick Start: Complete Workflow

**Step 1: Generate XML (from `platform/cda` directory)**
```powershell
# Navigate to cda directory
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"

# Find Python location (if needed)
where.exe python

# Generate XML in NORMAL mode (use full Python path if needed)
python generate_realistic_croatian_data.py --mode NORMAL
# Or: C:\Users\opera\AppData\Local\Python\bin\python.exe generate_realistic_croatian_data.py --mode NORMAL

# Note the generated UUID (e.g., cdcf9024-9454-4444-a467-bcb4b947d859)
```

**Step 2: Register Dataset (from `scripts` directory)**
```powershell
# Navigate to scripts directory
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\scripts"

# Register using the UUID from step 1
.\register-dataset-simple.ps1 -DatasetId "cdcf9024-9454-4444-a467-bcb4b947d859"
```

## Scripts

### `register-dataset-simple.ps1` (Recommended)

**Use this script** - it's more reliable and uses .NET HttpClient for proper multipart form uploads.

Registers a single dataset by uploading its XML consignment file to the platform simulator.

**Usage:**
```powershell
.\register-dataset-simple.ps1 -DatasetId "12345678-ab12-4ab6-8999-123456789abc"
```

**With custom XML file:**
```powershell
.\register-dataset-simple.ps1 -DatasetId "12345678-ab12-4ab6-8999-123456789abc" -XmlFile "C:\path\to\file.xml"
```

### `register-dataset.ps1` (Alternative)

**Note**: This script may have syntax issues in some PowerShell versions. Use `register-dataset-simple.ps1` instead.

Registers a single dataset by uploading its XML consignment file to the platform simulator.

**Usage:**
```powershell
.\register-dataset.ps1 -DatasetId "12345678-ab12-4ab6-8999-123456789abc"
```

**With custom XML file:**
```powershell
.\register-dataset.ps1 -DatasetId "12345678-ab12-4ab6-8999-123456789abc" -XmlFile "C:\path\to\file.xml"
```

**Parameters:**
- `-DatasetId` (required): The UUID of the dataset to register
- `-XmlFile` (optional): Path to the XML file. If not specified, looks for `{datasetId}.xml` in `platform/cda/`
- `-PlatformPort` (optional): Platform simulator port (default: 8070 for ACME/Croatia)
- `-Realm` (optional): Keycloak realm (default: "eFTI_HR" for Croatia)
- `-KeycloakUrl` (optional): Keycloak base URL (default: "http://auth.gate.croatia.eu:8080")
- `-ClientId` (optional): OAuth client ID (default: "simulator")
- `-ClientSecret` (optional): OAuth client secret (default: "vr2J90y53Uhcuvb5jJJp7e3txxDhTvbc")

**Examples:**

Register dataset for Croatia:
```powershell
.\register-dataset.ps1 -DatasetId "12345678-ab12-4ab6-8999-123456789abc"
```

Register dataset for Slovenia (different port and realm):
```powershell
.\register-dataset.ps1 -DatasetId "87654321-ba21-6ba4-9888-987654321cba" -PlatformPort 8071 -Realm "eFTI_SLO"
```

### `register-all-datasets.ps1`

Registers all XML files found in the `platform/cda/` folder.

**Usage:**
```powershell
.\register-all-datasets.ps1
```

**Parameters:**
- `-CdaPath` (optional): Custom path to CDA folder
- `-PlatformPort` (optional): Platform simulator port (default: 8070)
- `-Realm` (optional): Keycloak realm (default: "eFTI_HR")

**Example:**
```powershell
.\register-all-datasets.ps1 -PlatformPort 8070 -Realm "eFTI_HR"
```

## Prerequisites

1. **Platform simulator must be running** on the specified port
2. **Keycloak must be running** and accessible
3. **XML files** must exist in `platform/cda/` or be specified via `-XmlFile`
4. **OAuth client** (`simulator`) must be configured in Keycloak with the correct secret

## How It Works

1. Gets an OAuth access token from Keycloak using client credentials
2. Uploads the XML consignment file to the platform simulator API endpoint: `PUT /identifiers/upload/consignment/{datasetId}`
3. The platform simulator:
   - Parses the XML file
   - **Stores the full XML content in the `consignment_xml` database table**
   - Extracts identifier information
   - **Registers identifiers in the ROI database tables** (via gate integration)
   - Makes the dataset searchable via UIL and identifier queries

**Database Tables Used:**
- `consignment_xml` (main database, port 9001) - Stores full XML content
- `consignment` (ROI database, port 2345, schema `eftihr`) - Stores basic consignment metadata
- `main_carriage_transport_movement` - Stores vehicle/transport identifiers
- `used_transport_equipment` - Stores equipment identifiers
- Other related ROI tables

## Troubleshooting

### Python Location Issues (for XML Generation)

**Problem**: `'python' is not recognized` when generating XML

**Solution**:
```powershell
# Find Python
where.exe python

# Use full path (replace with your actual path)
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
C:\Users\opera\AppData\Local\Python\bin\python.exe generate_realistic_croatian_data.py --mode NORMAL
```

**Common Python locations on Windows:**
- `C:\Users\<username>\AppData\Local\Python\bin\python.exe`
- `C:\Users\<username>\AppData\Local\Microsoft\WindowsApps\python.exe`
- `C:\Python3x\python.exe`

### Registration Script Issues

**Error: "XML file not found"**
- Check that the XML file exists in `platform/cda/` with the name `{datasetId}.xml`
- **Note:** This is the temporary source file - after registration, XML is stored in the `consignment_xml` database table
- Or specify the full path using `-XmlFile`
- Verify you're using the correct UUID (check the filename of the generated XML)

**Error: "Failed to obtain access token"**
- Verify Keycloak is running: `http://localhost:8080` or `http://auth.gate.croatia.eu:8080`
- Check that the `simulator` client exists in the Keycloak realm (`eFTI_HR` for Croatia)
- Verify the client secret matches: `vr2J90y53Uhcuvb5jJJp7e3txxDhTvbc`

**Error: "Failed to register dataset"**
- Verify the platform simulator is running on the specified port (default: 8070)
- Check platform logs: `docker logs efti-gate-platform-ACME-1`
- Ensure the XML file is valid and matches the expected schema
- Try using `register-dataset-simple.ps1` instead of `register-dataset.ps1`

**Error: PowerShell syntax errors in `register-dataset.ps1`**
- Use `register-dataset-simple.ps1` instead (recommended)
- The simple script uses .NET HttpClient which is more reliable

**Error: "DATA_NOT_FOUND_ON_REGISTRY" (after registration)**
- Wait a few seconds for the registration to complete
- Check that the dataset was registered: query the identifier registry
- Verify the gate can access the platform's identifier registry
- Check that the platform simulator processed the upload correctly

## Complete Example Workflow

**1. Generate XML in NORMAL mode:**
```powershell
# Navigate to cda directory
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"

# Find Python (if needed)
where.exe python

# Generate XML (use full path if python command doesn't work)
python generate_realistic_croatian_data.py --mode NORMAL
# Output: Dataset UUID: cdcf9024-9454-4444-a467-bcb4b947d859
```

**2. Register the generated dataset:**
```powershell
# Navigate to scripts directory
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\scripts"

# Register using the UUID from step 1
.\register-dataset-simple.ps1 -DatasetId "cdcf9024-9454-4444-a467-bcb4b947d859"
# Output: Dataset registered successfully!
```

**3. Verify registration:**
- The dataset is now available for UIL queries
- You can search for it using the Dataset ID in the portal

## Notes

- Datasets must be registered **before** they can be queried via UIL
- Registration is idempotent - you can register the same dataset multiple times
- `register-dataset-simple.ps1` uses .NET HttpClient for multipart form uploads (more reliable than curl on Windows)
- Always use the UUID from the XML generation step when registering
- The XML file must be named `{datasetId}.xml` in the `platform/cda/` directory (temporary source)
- **After registration, XML is stored in `consignment_xml` database table, not in the file system**
- To view registered XMLs, query the database:
  ```sql
  -- Connect to main database
  docker exec -it reference-gate-shared-db psql -U postgres -d efti
  
  -- View all registered XMLs
  SELECT dataset_id, LENGTH(xml_content) as xml_size, created_at 
  FROM consignment_xml 
  ORDER BY created_at DESC;
  ```




