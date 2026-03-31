# Slovenia XML Generation and Registration Guide

This guide provides step-by-step instructions for generating XML consignments with minimal data and registering them to the Slovenia gate.

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
2. **Platform simulator** running (port 8071 for Slovenia - MASSIVE platform)
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

## Step 2: Prepare Minimal Data JSON

Create a JSON file with the minimal data you want to include in your consignment. Use `slovenia_minimal_data.json` as a template.

### Minimal Data JSON Structure

The JSON file should follow this structure:

```json
{
  "ecmr_identifier": "SI-ECMR-260111-01",
  "issue_date": "2026-01-11T06:45:00+01:00",
  "issue_location": {
    "city": "Ljubljana",
    "country": "SI"
  },
  "consignor": {
    "name": "Sava Distribution d.o.o.",
    "address": {
      "street": "Letališka cesta",
      "building_number": "30",
      "postcode": "1000",
      "city": "Ljubljana",
      "country": "SI"
    },
    "tax_id": "SI87654321"
  },
  "consignee": {
    "name": "Adria Food d.o.o.",
    "address": {
      "street": "Radnička cesta",
      "building_number": "80",
      "postcode": "10000",
      "city": "Zagreb",
      "country": "HR"
    },
    "tax_id": "12345678901"
  },
  "delivery_location": {
    "name": "",
    "address": {
      "city": "Zagreb",
      "country": "HR"
    }
  },
  "pickup": {
    "location": {
      "city": "Ljubljana",
      "country": "SI"
    },
    "datetime": "2026-01-11T07:15:00+01:00"
  },
  "attached_documents": [
    {
      "id": "INV-2601-0456",
      "type": "Invoice"
    }
  ],
  "carrier": {
    "name": "TransLogistika d.o.o.",
    "address": {
      "street": "Dunajska cesta",
      "building_number": "150",
      "postcode": "1000",
      "city": "Ljubljana",
      "country": "SI"
    },
    "tax_id": "SI12345678"
  },
  "carrier_reservations": "",
  "goods": {
    "marks": "AF-PLT-2026-01",
    "package_count": 10,
    "packaging_description": "10 paleta (EUR)",
    "nature": "Pakirani prehrambeni proizvodi (neopasno)",
    "hs_code": "21069098",
    "gross_weight": {
      "value": 6500.00,
      "unit": "KGM"
    },
    "volume": {
      "value": 24.00,
      "unit": "MTQ"
    }
  },
  "sender_instructions": "",
  "cod_amount": {
    "value": 0.00,
    "currency": "EUR"
  },
  "freight_payment": "PREPAID",
  "payment_party": "CONSIGNOR",
  "special_agreements": "",
  "signatures": {
    "consignor": {
      "company": "Sava Distribution d.o.o.",
      "person": ""
    },
    "carrier": {
      "company": "TransLogistika d.o.o.",
      "person": ""
    },
    "consignee": {
      "company": "Adria Food d.o.o.",
      "person": ""
    }
  },
  "vehicle": {
    "id": "SI-LJ-1234AB",
    "trailer_id": "SI-LJ-5678CD",
    "model": ""
  },
  "tariff": {
    "basis": "per_km",
    "amount": {
      "value": 175.00,
      "currency": "EUR"
    }
  }
}
```

### Field Descriptions

| Field | Description | Example |
|-------|-------------|---------|
| `ecmr_identifier` | ECMR document identifier | `SI-ECMR-260111-01` |
| `issue_date` | Issue date/time (ISO 8601 format) | `2026-01-11T06:45:00+01:00` |
| `issue_location` | Location where document was issued | `{"city": "Ljubljana", "country": "SI"}` |
| `consignor` | Consignor (sender) information | Name, address, tax ID |
| `consignee` | Consignee (receiver) information | Name, address, tax ID |
| `delivery_location` | Delivery location | Name and address |
| `pickup` | Pickup location and datetime | Location and datetime |
| `attached_documents` | List of attached documents | Array of document IDs and types |
| `carrier` | Carrier information | Name, address, tax ID |
| `goods` | Goods information | Marks, package count, weight, volume, etc. |
| `vehicle` | Vehicle and trailer IDs | Vehicle ID and trailer ID |
| `tariff` | Tariff information | Calculation basis and amount |

### How to Generate Minimal JSON

You can create the JSON file manually or use the existing `slovenia_minimal_data.json` as a starting point:

1. **Copy the template:**
   ```powershell
   Copy-Item "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda\slovenia_minimal_data.json" "my_data.json"
   ```

2. **Edit the JSON file** with your specific data:
   - Update ECMR identifier
   - Update dates and times
   - Update company names and addresses
   - Update vehicle IDs
   - Update goods information
   - Update tariff information

3. **Save the file** in the `cda` directory

## Step 3: Use Valid Template XML

The script requires a valid base XML file to update. Use the template XML file:

**Template XML:** `69022a3b-26d3-46f9-9282-d11617ff4afe.xml`

This file contains a complete, valid XML structure with all required elements. The script will update only the fields specified in your JSON file, leaving the rest of the XML structure intact.

### Template XML Location

```
deploy/local/efti-gate/platform/cda/69022a3b-26d3-46f9-9282-d11617ff4afe.xml
```

**Important:** Do NOT modify the template XML file directly. The script creates a new XML file with a new UUID.

## Step 4: Generate XML from Minimal Data

### Navigate to CDA Directory

```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
```

### Generate XML

**Option A: If `python` command works:**
```powershell
python update_xml_from_minimal_data.py 69022a3b-26d3-46f9-9282-d11617ff4afe.xml slovenia_minimal_data.json
```

**Option B: Use full Python path:**
```powershell
C:\Users\opera\AppData\Local\Python\bin\python.exe update_xml_from_minimal_data.py 69022a3b-26d3-46f9-9282-d11617ff4afe.xml slovenia_minimal_data.json
```

**Option C: Specify custom output UUID:**
```powershell
python update_xml_from_minimal_data.py 69022a3b-26d3-46f9-9282-d11617ff4afe.xml slovenia_minimal_data.json my-custom-uuid-here
```

### Output

The script will:
- Read the template XML file
- Read your minimal data JSON file
- Update only the fields specified in the JSON
- Create a new XML file with a new UUID (e.g., `b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f.xml`)
- Display the UUID for use in registration

**Example output:**
```
Reading data file: slovenia_minimal_data.json...
Loading working XML: 69022a3b-26d3-46f9-9282-d11617ff4afe.xml...
Updating only the fields from JSON...
  Warning: HS code '21069098' is too long (max 7 chars), skipping hazardClassificationID update
  Warning: Vehicle model '' cannot be stored in categoryCode (enumeration field), skipping
Writing updated XML to b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f.xml...

Done! Updated XML created: b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f.xml
Dataset UUID: b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f
Use this UUID when registering the dataset in ROI.
```

## Step 5: Register Dataset to Slovenia Gate

### Navigate to Scripts Directory

```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\scripts"
```

### Register Dataset to Slovenia

Use the UUID from Step 4 with Slovenia-specific parameters:

```powershell
.\register-dataset-simple.ps1 -DatasetId "b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f" -PlatformPort 8071 -Realm "eFTI_SLO" -KeycloakUrl "http://auth.gate.slovenia.eu:8080" -ClientSecret "sVJJsNVG4UPPk11iT3WbtJYxkRGYxA68"
```

**Slovenia-Specific Parameters:**
- `-PlatformPort 8071` - MASSIVE platform simulator port
- `-Realm "eFTI_SLO"` - Slovenia Keycloak realm
- `-KeycloakUrl "http://auth.gate.slovenia.eu:8080"` - Slovenia Keycloak URL
- `-ClientSecret "sVJJsNVG4UPPk11iT3WbtJYxkRGYxA68"` - Slovenia client secret

### Output

**Success:**
```
Registering dataset: b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f
XML file: D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda\b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f.xml

Getting OAuth token...
Token obtained
Uploading consignment...
Dataset registered successfully!
Consignment saved and identifiers uploaded to gate

You can now query this dataset using UIL:
  Dataset ID: b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f
```

## Complete Example

```powershell
# Step 1: Navigate to CDA directory
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"

# Step 2: Generate XML from minimal data
C:\Users\opera\AppData\Local\Python\bin\python.exe update_xml_from_minimal_data.py 69022a3b-26d3-46f9-9282-d11617ff4afe.xml slovenia_minimal_data.json
# Output: Dataset UUID: b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f

# Step 3: Register to Slovenia gate
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\scripts"
.\register-dataset-simple.ps1 -DatasetId "b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f" -PlatformPort 8071 -Realm "eFTI_SLO" -KeycloakUrl "http://auth.gate.slovenia.eu:8080" -ClientSecret "sVJJsNVG4UPPk11iT3WbtJYxkRGYxA68"
# Output: Dataset registered successfully!
```

## Troubleshooting

### Python Not Found

**Error:** `'python' is not recognized`

**Solution:**
1. Find Python: `where.exe python`
2. Use full path: `C:\Users\opera\AppData\Local\Python\bin\python.exe update_xml_from_minimal_data.py ...`

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
- Check file exists in `platform/cda/` directory
- Use `-XmlFile` parameter with full path if needed
- **Note:** After registration, XML is stored in `consignment_xml` database table, not in the file system

### Registration Failed - Authentication Error

**Error:** `Invalid client or Invalid client credentials`

**Solution:**
- Verify you're using the correct client secret for Slovenia: `sVJJsNVG4UPPk11iT3WbtJYxkRGYxA68`
- Check Keycloak is accessible: `http://auth.gate.slovenia.eu:8080`
- Verify OAuth client `simulator` exists in realm `eFTI_SLO`
- Ensure platform simulator is running on port 8071: `docker ps | findstr 8071`

### Registration Failed - Platform Not Running

**Error:** `Failed to register dataset` or connection refused

**Solution:**
1. Verify platform simulator is running: `docker ps | findstr platform-MASSIVE`
2. Check platform logs: `docker logs efti-gate-platform-MASSIVE-1`
3. Restart platform if needed: `docker restart efti-gate-platform-MASSIVE-1`

## Slovenia-Specific Configuration

### Platform Simulator
- **Port:** `8071`
- **Container:** `efti-gate-platform-MASSIVE-1`
- **Profile:** `MASSIVE`

### Keycloak
- **URL:** `http://auth.gate.slovenia.eu:8080`
- **Realm:** `eFTI_SLO`
- **Client ID:** `simulator`
- **Client Secret:** `sVJJsNVG4UPPk11iT3WbtJYxkRGYxA68`

### Database Schema
- **ROI Schema:** `eftislo` (Slovenia schema in ROI database)
- **Gate ID:** `slovenia`
- **Platform ID:** `slovenia eFTI platform`

## Where Data is Stored

### XML File (Generated in Step 4 - Temporary)
- **Location:** `deploy/local/efti-gate/platform/cda/`
- **Format:** `{uuid}.xml`
- **Example:** `b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f.xml`
- **Purpose:** Temporary source file for registration
- **Note:** This file is used during registration but **XML content is stored in the database**, not kept in this folder

### Database Storage (Registered in Step 5)

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
- **Schema:** `eftislo` (for Slovenia)
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
WHERE dataset_id = 'b2f69a1c-9027-4c07-80bf-e3dbc7f1a85f';

-- Check identifiers in ROI database (Slovenia schema)
docker exec -it efti-gate-psql-meta-1 psql -U postgres -d efti
SET search_path TO eftislo;
SELECT dataset_id, gate_id, platform_id, createddate FROM consignment;
```

## Field Mapping Notes

### HS Code Limitation
- **Warning:** HS codes longer than 7 characters will be skipped
- The `hazardClassificationID` field has a maximum length of 7 characters
- Example: HS code `21069098` (8 chars) will generate a warning and be skipped

### Vehicle Model
- **Warning:** Vehicle model cannot be stored in `categoryCode` field
- The `categoryCode` field is an enumeration with specific allowed values
- Vehicle model information will be skipped if provided

### Date Format
- Dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss+TZ:TZ`
- Example: `2026-01-11T06:45:00+01:00`

## Related Documentation

- **Quick Start Guide:** `../QUICK_START_XML_GENERATION_AND_REGISTRATION.md`
- **Registration Details:** `../scripts/README.md`
- **Database Access:** `../../DATABASE_ACCESS_GUIDE.md`
- **Croatian Data Generation:** `GENERATE_CROATIAN_DATA_README.md`

## Template XML Structure

The template XML (`69022a3b-26d3-46f9-9282-d11617ff4afe.xml`) contains a complete, valid eFTI consignment structure with:

- Associated document information
- Consignor, consignee, and carrier details
- Transport movement information
- Goods items
- Service charges and tariffs
- Signatures
- All required XML namespaces and schema references

The script (`update_xml_from_minimal_data.py`) updates only the fields specified in your JSON file, preserving the rest of the XML structure.




