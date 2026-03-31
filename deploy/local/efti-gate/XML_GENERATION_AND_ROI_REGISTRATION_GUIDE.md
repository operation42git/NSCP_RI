# XML Generation and ROI Registration Guide

This guide explains the complete workflow for generating eFTI consignment XML files and registering them in the Registry of Identifiers (ROI).

## Overview

The process consists of two main steps:
1. **XML Generation**: Create schema-compliant XML files with realistic Croatian data
2. **ROI Registration**: Register the XML files in the identifier registry so they can be queried

## Prerequisites

- Python 3.6 or higher
- PowerShell (for Windows)
- Platform simulator running (default port 8070 for Croatia/ACME)
- Keycloak running and accessible
- Docker containers running (platform-ACME, keycloak)

## Step 1: XML Generation

### Purpose

The `generate_realistic_croatian_data.py` script transforms template XML files into schema-compliant XML files with realistic Croatian data. It ensures:
- Proper unit codes (weight vs volume elements)
- Correct element ordering (schema compliance)
- Realistic Croatian company names, addresses, and personal data

### Location

```
deploy/local/efti-gate/platform/cda/generate_realistic_croatian_data.py
```

### Usage

#### Basic Usage (with UUID)

```bash
cd deploy/local/efti-gate/platform/cda
python generate_realistic_croatian_data.py input_template.xml <dataset-uuid>
```

**Example:**
```bash
python generate_realistic_croatian_data.py 12345678-ab12-4ab6-8999-123456789abc.xml 6663f3b7-add2-4134-882f-f4037dfba482
```

This will:
- Read the input template file
- Replace all placeholder data with realistic Croatian data
- Fix schema compliance issues (unit codes, element ordering)
- Generate output file: `6663f3b7-add2-4134-882f-f4037dfba482.xml`
- **Important**: The output filename uses the provided UUID

#### Without UUID (Auto-generated)

```bash
python generate_realistic_croatian_data.py input_template.xml
```

This will generate a new UUID and create a file with that UUID as the filename.

### What the Script Does

#### 1. Data Replacement
- Replaces placeholder values (3-6 lowercase letters) with realistic Croatian data:
  - Company names (Hrvatska pošta d.o.o., INA d.d., etc.)
  - Personal names (Croatian first and last names)
  - Addresses (Croatian cities, streets, postal codes)
  - Phone numbers (Croatian format: +385 XX XXX XXX)
  - Email addresses (Croatian domains)
  - Goods descriptions (in Croatian)

#### 2. Schema Compliance Fixes

**Unit Code Fixes:**
- **Weight elements** (`weightMeasure`, `netWeight`, `grossWeight`, `explosiveCargoNetWeight`, `netGoodsWeightMeasure`, `verifiedGrossWeight`):
  - Must use: `GRM`, `KGM`, or `TNE`
  - Invalid codes like `LTR` are automatically replaced
  
- **Volume elements** (`volumeMeasure`, `grossVolume`, `netGoodsVolumeMeasure`, `grossGoodsVolumeMeasure`):
  - Must use: `MTQ` or `LTR`
  - Invalid codes are automatically replaced

**Element Ordering Fixes:**
- Ensures `transportDangerousGoods` elements come **before** `crossBorderRegulatoryProcedure` elements
- Fixes ordering at both `includedConsignmentItem` and `consignment` levels
- Prevents schema validation errors

#### 3. Address Formatting
- Removes `countrySubDivisionName` from postal addresses (Croatian format doesn't include counties)
- Ensures postal codes match their corresponding cities
- Validates city-county relationships

### Output

The script creates a new XML file with the dataset UUID as the filename:
- Input: `12345678-ab12-4ab6-8999-123456789abc.xml`
- Output: `6663f3b7-add2-4134-882f-f4037dfba482.xml` (if UUID provided)
- Output: `{generated-uuid}.xml` (if UUID not provided)

**Important**: The original template file is never modified.

### Verification

After generation, verify the XML file:
1. Check that the file exists: `ls 6663f3b7-add2-4134-882f-f4037dfba482.xml`
2. Verify file size (should be substantial, not empty)
3. Check for any obvious errors in the file

## Step 2: ROI Registration

### Purpose

Register the generated XML file in the Registry of Identifiers (ROI) so it can be queried by identifier search.

### Location

```
deploy/local/efti-gate/scripts/register-dataset-simple.ps1
```

### Usage

#### Basic Usage

```powershell
cd deploy/local/efti-gate/scripts
powershell -ExecutionPolicy Bypass -File register-dataset-simple.ps1 -DatasetId "6663f3b7-add2-4134-882f-f4037dfba482"
```

The script will:
1. Look for the XML file: `platform/cda/6663f3b7-add2-4134-882f-f4037dfba482.xml`
2. Get an OAuth token from Keycloak
3. Upload the XML to the platform simulator
4. The platform simulator registers it in ROI

#### With Custom XML File Path

```powershell
powershell -ExecutionPolicy Bypass -File register-dataset-simple.ps1 -DatasetId "6663f3b7-add2-4134-882f-f4037dfba482" -XmlFile "C:\path\to\file.xml"
```

#### Parameters

- `-DatasetId` (required): The UUID of the dataset (must match the XML filename)
- `-XmlFile` (optional): Custom path to XML file
- `-PlatformPort` (optional): Platform port (default: 8070 for Croatia/ACME)
- `-Realm` (optional): Keycloak realm (default: "eFTI_HR")
- `-KeycloakUrl` (optional): Keycloak URL (default: "http://auth.gate.croatia.eu:8080")
- `-ClientId` (optional): OAuth client ID (default: "simulator")
- `-ClientSecret` (optional): OAuth client secret

### How Registration Works

1. **OAuth Authentication**: Script obtains access token from Keycloak using client credentials
2. **File Upload**: Uploads XML file to platform simulator via `PUT /identifiers/upload/consignment/{datasetId}`
3. **Platform Processing**:
   - Platform simulator parses the XML
   - Validates against schema
   - Extracts identifier information (vehicles, equipment, etc.)
   - Registers identifiers in the gate's ROI database
   - Stores the XML file in platform's CDA folder

### Success Indicators

When registration succeeds, you'll see:
```
Registering dataset: 6663f3b7-add2-4134-882f-f4037dfba482
XML file: D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda\6663f3b7-add2-4134-882f-f4037dfba482.xml

Getting OAuth token...
Token obtained
Uploading consignment...
Dataset registered successfully!

You can now query this dataset using UIL:
  Dataset ID: 6663f3b7-add2-4134-882f-f4037dfba482
```

## Complete Workflow Example

### Full Process from Template to Registered Dataset

```bash
# Step 1: Generate XML with UUID
cd deploy/local/efti-gate/platform/cda
python generate_realistic_croatian_data.py 12345678-ab12-4ab6-8999-123456789abc.xml 6663f3b7-add2-4134-882f-f4037dfba482

# Expected output:
# Reading 12345678-ab12-4ab6-8999-123456789abc.xml...
# Replacing all placeholder data with realistic Croatian data...
# Writing updated content to 6663f3b7-add2-4134-882f-f4037dfba482.xml...
# Done! New file created: 6663f3b7-add2-4134-882f-f4037dfba482.xml

# Step 2: Register in ROI
cd ../../scripts
powershell -ExecutionPolicy Bypass -File register-dataset-simple.ps1 -DatasetId "6663f3b7-add2-4134-882f-f4037dfba482"

# Expected output:
# Registering dataset: 6663f3b7-add2-4134-882f-f4037dfba482
# Token obtained
# Uploading consignment...
# Dataset registered successfully!
```

## Troubleshooting

### XML Generation Issues

**Error: "Input file not found"**
- Verify you're in the correct directory: `deploy/local/efti-gate/platform/cda`
- Check that the template file exists
- Use absolute path if needed

**Error: "Python not found"**
- Ensure Python 3.6+ is installed and in PATH
- Try: `python3` instead of `python`

**Schema Validation Errors After Generation**
- The script should fix most issues automatically
- Check platform logs if registration fails: `docker logs efti-gate-platform-ACME-1`
- Common issues:
  - Unit code mismatches (should be fixed automatically)
  - Element ordering (should be fixed automatically)

### Registration Issues

**Error: "XML file not found"**
- Ensure the generated XML file exists in `platform/cda/` with the correct UUID as filename
- Verify the DatasetId parameter matches the XML filename (without .xml extension)

**Error: "Failed to obtain access token"**
- Verify Keycloak is running: `docker ps | grep keycloak`
- Check Keycloak is accessible: `curl http://localhost:8080`
- Verify the `simulator` client exists in the `eFTI_HR` realm
- Check client secret matches

**Error: "Failed to register dataset. HTTP Status: 400"**
- Check platform logs: `docker logs efti-gate-platform-ACME-1 --tail 50`
- Common causes:
  - XML schema validation errors (check logs for specific error)
  - Invalid unit codes (should be fixed by generation script)
  - Element ordering issues (should be fixed by generation script)
  - Malformed XML

**Error: "Invalid content: null"**
- This indicates a schema validation error
- Check platform logs for the specific validation error
- Common issues:
  - Unit code enumeration violations
  - Element ordering violations
  - Missing required elements

### Verification Steps

After registration, verify the dataset is in ROI:

1. **Check Platform Logs**:
   ```bash
   docker logs efti-gate-platform-ACME-1 | grep "6663f3b7-add2-4134-882f-f4037dfba482"
   ```

2. **Query ROI Database** (if you have access):
   ```sql
   SELECT * FROM consignment WHERE dataset_id = '6663f3b7-add2-4134-882f-f4037dfba482';
   ```

3. **Test Identifier Search**:
   - Use the portal or API to search for identifiers from the registered dataset
   - The dataset should appear in search results

## Best Practices

1. **Always use UUIDs**: Specify a UUID when generating XML to ensure consistent filenames
2. **Verify before registration**: Check that the generated XML file exists and has content
3. **Check logs**: If registration fails, always check platform logs for detailed error messages
4. **Keep templates**: Don't modify template files - the script creates new files
5. **Schema compliance**: The generation script fixes common schema issues, but always validate if you make manual changes

## Related Documentation

- **XML Generation Details**: See `platform/cda/GENERATE_CROATIAN_DATA_README.md`
- **Registration Script Details**: See `scripts/README.md`
- **Schema Information**: See `schema/xsd/README.md`
- **ROI Overview**: See `REFERENCE_IMPLEMENTATION_USER_GUIDE.md` (Section 4)

## Quick Reference

### Generate XML
```bash
cd deploy/local/efti-gate/platform/cda
python generate_realistic_croatian_data.py <template.xml> <uuid>
```

### Register in ROI
```powershell
cd deploy/local/efti-gate/scripts
powershell -ExecutionPolicy Bypass -File register-dataset-simple.ps1 -DatasetId "<uuid>"
```

### Check Platform Logs
```bash
docker logs efti-gate-platform-ACME-1 --tail 50
```

### Verify File Exists
```bash
ls deploy/local/efti-gate/platform/cda/<uuid>.xml
```




