# Croatian XML Data Generator Script

## Overview

The `generate_realistic_croatian_data.py` script is a comprehensive Python tool designed to replace placeholder data in eFTI consignment XML files with realistic Croatian data. This script ensures that generated XML files contain authentic Croatian company names, addresses, personal names, and other data that conforms to Croatian standards and conventions.

## ⚠️ IMPORTANT: After Generating XML

**Generating the XML file is only the first step!**

After running this script, you **MUST register the dataset in the database** using the registration script:

```powershell
# After generating XML with UUID: cdcf9024-9454-4444-a467-bcb4b947d859
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\scripts"
.\register-dataset-simple.ps1 -DatasetId "cdcf9024-9454-4444-a467-bcb4b947d859"
```

**Why?** The XML file in the `cda` folder is just a **temporary source file**. The registration script:
1. Uploads the XML to the platform simulator
2. **Stores the full XML content in the `consignment_xml` database table**
3. Extracts identifiers from the consignment
4. **Stores identifiers in the ROI database tables**
5. Makes the dataset searchable via UIL queries

**Where data is stored after registration:**
- ✅ **XML content**: `consignment_xml` table in main database (port 9001)
- ✅ **Identifiers**: ROI database tables (port 2345, schema `eftihr` for Croatia)
- ❌ **NOT** in the `cda` folder (that's just for temporary generation)

**Without registration, the dataset will NOT appear in any searches!**

See: `../scripts/README.md` and `../QUICK_START_XML_GENERATION_AND_REGISTRATION.md`

## Three Generation Modes

The script now supports **three distinct modes** for generating consignment data:

### 1. NORMAL Mode (Default)
- **Purpose**: Generate realistic normal consignment with regular goods
- **Features**:
  - Regular, non-dangerous goods (electronics, furniture, textiles, food, etc.)
  - `dangerousGoodsIndicator` set to `false`
  - No dangerous goods sections
  - No multimodal transport (no connecting carriers)
  - Realistic weight/volume values (10-50000 KGM, 0.1-100 MTQ)
  - Consistent goods descriptions across all fields

### 2. ADR Mode
- **Purpose**: Generate dangerous goods consignment following ADR regulations
- **Features**:
  - Proper UN codes matching goods descriptions (e.g., UN3480 for Lithium Ion Batteries)
  - `dangerousGoodsIndicator` set to `true`
  - Complete ADR information:
    - Proper shipping names matching UN codes
    - Hazard classifications
    - ADR-specific shipping marks
  - Consistent dangerous goods data throughout the document
  - Realistic dangerous goods weight/volume values (1-10000 KGM)

### 3. MINIMAL Mode ⭐ **NEW**
- **Purpose**: Generate minimal XML with only specified fields from JSON data file
- **Features**:
  - Only specified fields are populated
  - Rest of XML remains empty/minimal
  - Perfect for production data and specific test scenarios
  - Uses JSON input file with exact field values
  - Maps CMR fields (1-28) to XML structure
- **Usage**:
  ```powershell
  python generate_realistic_croatian_data.py --mode MINIMAL --data-file data.json [--uuid UUID]
  ```
- **Data Format**: JSON file with structured field values (see `example_minimal_data.json`)
- **CMR Field Mapping**: Automatically maps CMR fields to correct XML paths

## Features

- **Realistic Croatian Data**: Replaces placeholder values with authentic Croatian data including:
  - Company names (e.g., "Hrvatska pošta d.o.o.", "INA d.d.", "Croatia Airlines d.d.")
  - Personal names (Croatian first and last names)
  - Addresses (streets, cities, postal codes)
  - Phone numbers (Croatian format: +385 XX XXX XXX)
  - Email addresses (Croatian domains)
  - Goods descriptions (in Croatian)
  - Contract terms and information texts (in Croatian)

- **Proper Address Format**: Croatian addresses follow the correct format:
  - Street name
  - Street number
  - City
  - Postal code
  - Country code (HR)
  - **Note**: Croatian addresses do NOT include županija (county) names

- **City-County-Postal Code Mapping**: Ensures realistic relationships:
  - Each city is correctly mapped to its županija (county)
  - Postal codes match their corresponding cities
  - Example: Karlovac → Karlovačka županija → 47000

- **Randomization**: The script uses Python's `random` module extensively, meaning:
  - Each execution produces different results
  - Multiple runs on the same input file will generate different output files
  - Data selection is randomized from predefined lists

- **Non-Destructive**: 
  - Creates new output files with timestamps
  - Never overwrites the original input file
  - Output format: `{original_name}_croatian_{timestamp}.xml`

## Requirements

- Python 3.6 or higher
- Standard library modules (no external dependencies):
  - `re` (regular expressions)
  - `random`
  - `datetime`
  - `sys`
  - `os`

## Finding Python Location (Windows)

On Windows, Python might not be in your PATH, or multiple Python installations might exist. Here's how to find and use the correct Python:

### Method 1: Find Python Location

```powershell
# Find all Python installations
where.exe python

# Common locations:
# C:\Users\<username>\AppData\Local\Python\bin\python.exe
# C:\Users\<username>\AppData\Local\Microsoft\WindowsApps\python.exe
# C:\Python3x\python.exe
```

### Method 2: Use Full Path

If `python` command doesn't work, use the full path:

```powershell
# Example with full path
C:\Users\opera\AppData\Local\Python\bin\python.exe generate_realistic_croatian_data.py --mode NORMAL
```

### Method 3: Check Python Version

```powershell
# Test if Python works
python --version
# or
python3 --version
# or use full path
C:\Users\opera\AppData\Local\Python\bin\python.exe --version
```

## Usage

### Basic Usage (Interactive Mode Selection)

**Important**: Navigate to the `cda` directory first, then run the script.

**PowerShell:**
```powershell
# Navigate to the script directory
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"

# Try standard Python command first
python generate_realistic_croatian_data.py

# If that doesn't work, use full path (replace with your Python path)
C:\Users\opera\AppData\Local\Python\bin\python.exe generate_realistic_croatian_data.py
```

**Git Bash / Linux:**
```bash
cd deploy/local/efti-gate/platform/cda
python3 generate_realistic_croatian_data.py
```

This will:
- Prompt you to select a mode (NORMAL or ADR)
- Read the default file: `648f1295-6df2-4a39-a28c-b7c762950a2a.xml` (or fallback to `12345678-ab12-4ab6-8999-123456789abc.xml`)
- Generate a new file with UUID: `{uuid}.xml`
- Leave the original file unchanged

### Command Line Mode Selection

Specify the mode directly via command line:

**PowerShell (Normal Mode):**
```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
python generate_realistic_croatian_data.py --mode NORMAL
# Or with full path:
C:\Users\opera\AppData\Local\Python\bin\python.exe generate_realistic_croatian_data.py --mode NORMAL
```

**PowerShell (ADR Mode):**
```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
python generate_realistic_croatian_data.py --mode ADR
```

**Git Bash / Linux:**
```bash
cd deploy/local/efti-gate/platform/cda
python3 generate_realistic_croatian_data.py --mode NORMAL [input_file.xml] [--uuid UUID]
python3 generate_realistic_croatian_data.py --mode ADR [input_file.xml] [--uuid UUID]
```

### Custom Input File

Specify a different input file:

**PowerShell:**
```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
python generate_realistic_croatian_data.py --mode NORMAL your_file.xml
```

**Git Bash:**
```bash
python3 generate_realistic_croatian_data.py --mode NORMAL your_file.xml
```

The output will be: `{uuid}.xml` (where UUID is either provided or auto-generated)

### Complete Examples

**Generate normal consignment (PowerShell):**
```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
python generate_realistic_croatian_data.py --mode NORMAL
```

**Generate ADR dangerous goods consignment:**
```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
python generate_realistic_croatian_data.py --mode ADR template.xml
```

**Generate with specific UUID:**
```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
python generate_realistic_croatian_data.py --mode ADR --uuid 12345678-ab12-4ab6-8999-123456789abc
```

### Example Output

**Normal Mode:**
```
============================================================
XML Generation Mode Selection
============================================================
1. NORMAL - Regular consignment with normal goods
   - No dangerous goods
   - Realistic normal transport data
   - No multimodal transport

2. ADR - Dangerous goods consignment (ADR regulations)
   - Proper UN codes matching goods descriptions
   - ADR hazard classifications
   - All required ADR information
============================================================

Select mode (1 for NORMAL, 2 for ADR, or 'n'/'a'): 1

No UUID provided, generated new UUID v4: 12345678-ab12-4ab6-8999-123456789abc

============================================================
Mode: NORMAL
Generating NORMAL consignment with:
  - Regular goods (non-dangerous)
  - No dangerous goods indicators
  - Realistic normal transport data
============================================================

Reading 12345678-ab12-4ab6-8999-123456789abc.xml...
Replacing all placeholder data with realistic Croatian data...
  - Company names...
  - Person names...
  - Street names and addresses...
  - Postal codes...
  - Building numbers...
  - Counties...
  - Cities...
  - Goods descriptions (NORMAL mode)...
  - Phone numbers...
  - Email addresses...
  - Contract terms...
  - Information texts...
  - IDs and codes...
  - Currency codes...
  - Unit codes...
  - Role codes...
  - Payment codes...
  - Type codes...
  - URIs...
Writing updated content to 12345678-ab12-4ab6-8999-123456789abc.xml...

Done! New file created: 12345678-ab12-4ab6-8999-123456789abc.xml
Original file '12345678-ab12-4ab6-8999-123456789abc.xml' was NOT modified.
All placeholder data has been replaced with realistic Croatian data (NORMAL mode).

Dataset UUID: 12345678-ab12-4ab6-8999-123456789abc
Use this UUID when registering the dataset in ROI.
```

**ADR Mode:**
```
============================================================
Mode: ADR
Generating ADR (Dangerous Goods) consignment with:
  - Proper UN codes matching goods descriptions
  - ADR hazard classifications
  - Proper shipping names
  - All required ADR information
============================================================

...

⚠️  ADR Mode: This consignment contains dangerous goods.
   Ensure all ADR regulations are properly followed.
```

## What Gets Replaced

The script identifies and replaces placeholder values (typically 3-6 lowercase letters) in the following XML elements:

### Personal Information
- `<name>` - Company names
- `<givenName>` - First names
- `<familyName>` - Last names
- `<personName>` - Full names

### Address Information
- `<streetName>` - Street names
- `<additionalStreetName>` - Additional street information
- `<buildingNumber>` - Building numbers (1-200)
- `<cityName>` - City names
- `<postcode>` - Postal codes (matched to cities)
- `<countrySubDivisionName>` - Counties (županije), but **removed from postal addresses**
- `<postOfficeBox>` - PO boxes (optional, 30% probability)

### Contact Information
- `<completeNumber>` (in telephone context) - Phone numbers
- `<completeNumber>` (in emailAddress context) - Email addresses
- `<uRI>` - Web URIs

### Business Information
- `<description>` - Goods descriptions
- `<contractTermsText>` - Contract terms
- `<consignorProvidedInformationText>` - Information texts
- `<information>` - General information fields
- `<contentText>` (in contractualClause) - Clause content

### Codes and Identifiers
- `<calculationBasisCode>` - Calculation basis codes
- `<categoryTypeCode>` - Category type codes
- `<payingPartyRoleCode>` - Role codes
- `<paymentArrangementCode>` - Payment arrangement codes
- `<statementCode>` - Statement codes
- `<typeCode>` - Type codes
- `currencyId` attributes - Currency codes (EUR, HRK, USD)
- `unitId` attributes - Unit codes (KGM, MTQ, MTR, etc.)
- `schemeAgencyId` attributes - Scheme agency IDs
- `<id>` elements - Various ID fields

## Croatian Data Sets

### Cities and Counties

The script includes a comprehensive mapping of Croatian cities to their counties and postal codes:

| City | County (Županija) | Postal Code |
|------|-------------------|-------------|
| Zagreb | Grad Zagreb | 10000 |
| Rijeka | Primorsko-goranska županija | 51000 |
| Split | Splitsko-dalmatinska županija | 21000 |
| Osijek | Osječko-baranjska županija | 31000 |
| Zadar | Zadarska županija | 23000 |
| Pula | Istarska županija | 52100 |
| Karlovac | Karlovačka županija | 47000 |
| ... | ... | ... |

### Companies

Includes major Croatian companies:
- Hrvatska pošta d.o.o.
- INA d.d.
- Konzum d.d.
- Croatia Airlines d.d.
- Jadrolinija d.d.
- HŽ Cargo d.o.o.
- And many more...

### Personal Names

Includes common Croatian first and last names:
- First names: Ivan, Marko, Josip, Ana, Marija, Ivana, etc.
- Last names: Horvat, Kovačević, Babić, Marić, Novak, etc.

## Address Format Rules

**Important**: Croatian postal addresses follow a specific format and do NOT include županija (county) names:

```
Street Name
Street Number
City
Postal Code
Country Code (HR)
```

The script automatically:
1. Removes `countrySubDivisionName` elements from `<postalAddress>` blocks
2. Ensures postal codes match their corresponding cities
3. Validates city-county relationships

## Randomization

The script uses Python's `random` module for data selection:

- **Different results each run**: Each execution produces different output
- **Random selection**: Data is randomly chosen from predefined lists
- **Realistic variation**: Phone numbers, IDs, and other numeric values are randomly generated within realistic ranges

### Example: Multiple Runs

```bash
# Run 1
python generate_realistic_croatian_data.py input.xml
# Output: input_croatian_20241215_100000.xml

# Run 2 (same input)
python generate_realistic_croatian_data.py input.xml
# Output: input_croatian_20241215_100030.xml
# Different data will be generated!
```

## Technical Details

### Pattern Matching

The script uses regular expressions to identify placeholder values:
- Pattern: `[a-z]{3,6}` (3-6 lowercase letters)
- Only replaces values that match this pattern
- Preserves legitimate values that don't match

### Processing Order

1. Company and personal names
2. Address components (streets, cities, postal codes)
3. Contact information (phones, emails)
4. Business information (goods, contracts)
5. Codes and identifiers
6. Address validation and cleanup

### Error Handling

- File not found: Script exits with error message
- Invalid input: Original file is never modified
- Encoding: Uses UTF-8 encoding for Croatian characters (č, ć, š, ž, đ)

## ADR Mode Details

When using ADR mode, the script ensures:

1. **Consistent UN Codes**: All UN codes match their corresponding goods descriptions
   - Example: UN3480 → "Litij-ionske baterije" (Lithium Ion Batteries)
   - Example: UN2796 → "Sumporna kiselina" (Sulfuric Acid)

2. **Proper Shipping Names**: Proper shipping names match UN codes
   - Croatian proper shipping names are used
   - Names correspond to the selected UN code

3. **Hazard Classifications**: Proper ADR hazard classes are assigned
   - Class 2: Gases
   - Class 3: Flammable liquids
   - Class 6: Toxic substances
   - Class 8: Corrosive substances
   - Class 9: Miscellaneous dangerous goods

4. **Dangerous Goods Indicator**: Set to `true` in `mainCarriageTransportMovement`

5. **ADR Markings**: ADR-specific shipping marks are used
   - "ADR", "DANGEROUS GOODS", "HAZARDOUS MATERIAL", etc.

## Limitations

1. **Placeholder Detection**: Only replaces values matching the pattern `[a-z]{3,6}`. Other placeholder formats may not be detected.

2. **Context Awareness**: Some replacements may occur in unexpected contexts. Review the output for accuracy.

3. **Base64 Data**: Binary data (base64 encoded) in `<includedBinaryObject>` elements is not modified.

4. **Date/Time Values**: Date and time values are not modified by the script.

5. **ADR Compliance**: While the script generates ADR-compliant data structure, always verify against current ADR regulations for production use.

## Best Practices

1. **Backup**: Always keep backups of original files (script doesn't modify originals, but good practice)

2. **Review**: Review generated files to ensure data makes sense in context

3. **Multiple Runs**: Run the script multiple times to get different variations

4. **Validation**: Validate generated XML against the schema after generation

## Troubleshooting

### Python Command Not Found

**Error**: `'python' is not recognized as an internal or external command`

**Solutions**:
1. **Find Python location:**
   ```powershell
   where.exe python
   ```

2. **Use full path to Python:**
   ```powershell
   C:\Users\<username>\AppData\Local\Python\bin\python.exe generate_realistic_croatian_data.py --mode NORMAL
   ```

3. **Add Python to PATH** (optional):
   - Open System Properties → Environment Variables
   - Add Python's `bin` directory to PATH
   - Restart PowerShell

4. **Try `python3` instead:**
   ```powershell
   python3 generate_realistic_croatian_data.py --mode NORMAL
   ```

### Script doesn't find input file

**Error**: `Error: Input file '...' not found!`

**Solutions**:
- Ensure you're running from the correct directory (`deploy/local/efti-gate/platform/cda`)
- Check file path and name
- Use absolute path if needed:
  ```powershell
  python generate_realistic_croatian_data.py --mode NORMAL "D:\full\path\to\file.xml"
  ```

### Wrong Directory Error

**Error**: `cd : Cannot find path ... because it does not exist`

**Solution**: Use absolute paths:
```powershell
Set-Location "D:\Radno\git\NSCP_RI\deploy\local\efti-gate\platform\cda"
```

### Some placeholders not replaced
- Check if they match the pattern `[a-z]{3,6}`
- Some may be legitimate values, not placeholders
- Review the XML structure

### Address format issues
- Ensure the script version includes the address cleanup logic
- Check that `countrySubDivisionName` is removed from postal addresses

### Multiple Python Installations

If you have multiple Python installations, use the one that works:

```powershell
# List all Python installations
where.exe python

# Test each one
C:\Users\opera\AppData\Local\Python\bin\python.exe --version
C:\Users\opera\AppData\Local\Microsoft\WindowsApps\python.exe --version

# Use the one that shows Python 3.6 or higher
```

## File Location

```
deploy/local/efti-gate/platform/cda/generate_realistic_croatian_data.py
```

## Version History

- **Current Version**: Includes city-county mapping, address format fixes, and comprehensive placeholder replacement
- **Previous**: Basic placeholder replacement without proper address formatting

## Support

For issues or questions:
1. Check this documentation
2. Review the script comments
3. Verify input XML structure
4. Check Python version compatibility

