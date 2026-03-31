# XSLT Transformation: XML to HTML Field Mapping Documentation

## Overview

The portal uses an XSLT transformation to convert EFTI consignment XML data into HTML for display. The transformation file is located at:
- **File**: `portal-mock/src/assets/xslt/eCMR.xslt`
- **Usage**: Applied in `portal-mock/src/app/pages/uil-search/uil-search.component.ts` (lines 160-176)

## Transformation Process

1. XML data is retrieved from the backend (base64 encoded)
2. XSLT stylesheet (`eCMR.xslt`) is loaded from assets
3. Browser's `XSLTProcessor` transforms XML to HTML
4. Result is displayed in a new browser window

## XML Namespace

- **Namespace**: `http://efti.eu/v1/consignment/common`
- **Prefix**: `efti:`
- **Root Element**: `/efti:consignment`

---

## Complete Field Mapping

### Section 1: SENDER (Consignor) - Top Left

**HTML Location**: First table cell, top-left (Section 1)

| XML Field Path | HTML Display Location | Notes |
|---------------|----------------------|-------|
| `/efti:consignment/efti:consignor/efti:postalAddress/efti:buildingNumber` | Line 1 (with street name, postcode, city) | Combined with other address fields |
| `/efti:consignment/efti:consignor/efti:postalAddress/efti:streetName` | Line 1 | Combined with building number, postcode, city |
| `/efti:consignment/efti:consignor/efti:postalAddress/efti:postcode` | Line 1 | Combined with other address fields |
| `/efti:consignment/efti:consignor/efti:postalAddress/efti:cityName` | Line 1 | Combined with other address fields |
| `/efti:consignment/efti:consignor/efti:postalAddress/efti:countrySubDivisionName` | Line 2 (separate line) | State/Province |
| `/efti:consignment/efti:consignor/efti:name` | Line 3 (separate line) | Company/Person name |

**NOT MAPPED (Available in XML but not displayed)**:
- `consignor/id`
- `consignor/postalAddress/additionalStreetName`
- `consignor/postalAddress/countryCode`
- `consignor/postalAddress/departmentName`
- `consignor/postalAddress/postOfficeBox`
- `consignor/definedContactDetails/*`
- `consignor/taxRegistration/*`
- `consignor/roleCode`
- All other consignor fields

---

### Section 2: CONSIGNEE - Bottom Left (First Row)

**HTML Location**: Second table row, left cell (Section 2)

| XML Field Path | HTML Display Location | Notes |
|---------------|----------------------|-------|
| `/efti:consignment/efti:consignee/efti:postalAddress/efti:buildingNumber` | Line 1 (with street name, postcode, city) | Combined with other address fields |
| `/efti:consignment/efti:consignee/efti:postalAddress/efti:streetName` | Line 1 | Combined with building number, postcode, city |
| `/efti:consignment/efti:consignee/efti:postalAddress/efti:postcode` | Line 1 | Combined with other address fields |
| `/efti:consignment/efti:consignee/efti:postalAddress/efti:cityName` | Line 1 | Combined with other address fields |
| `/efti:consignment/efti:consignee/efti:postalAddress/efti:countrySubDivisionName` | Line 2 (separate line) | State/Province |
| `/efti:consignment/efti:consignee/efti:name` | Line 3 (separate line) | Company/Person name |

**NOT MAPPED (Available in XML but not displayed)**:
- `consignee/id`
- `consignee/postalAddress/additionalStreetName`
- `consignee/postalAddress/countryCode`
- `consignee/postalAddress/departmentName`
- `consignee/postalAddress/postOfficeBox`
- `consignee/definedContactDetails/*`
- `consignee/taxRegistration/*`
- `consignee/roleCode`
- All other consignee fields

---

### Section 3: DELIVERY ADDRESS (Consignee Receipt Location) - Bottom Left (Second Row)

**HTML Location**: Third table row, left cell (Section 3)

| XML Field Path | HTML Display Location | Notes |
|---------------|----------------------|-------|
| `/efti:consignment/efti:consigneeReceiptLocation/efti:postalAddress/efti:buildingNumber` | Line 1 (with street name, postcode, city) | Combined with other address fields |
| `/efti:consignment/efti:consigneeReceiptLocation/efti:postalAddress/efti:streetName` | Line 1 | Combined with building number, postcode, city |
| `/efti:consignment/efti:consigneeReceiptLocation/efti:postalAddress/efti:postcode` | Line 1 | Combined with other address fields |
| `/efti:consignment/efti:consigneeReceiptLocation/efti:postalAddress/efti:cityName` | Line 1 | Combined with other address fields |
| `/efti:consignment/efti:consigneeReceiptLocation/efti:postalAddress/efti:countrySubDivisionName` | Line 2 (separate line) | State/Province |
| `/efti:consignment/efti:consigneeReceiptLocation/efti:name` | Line 3 (separate line) | Location name |

**NOT MAPPED (Available in XML but not displayed)**:
- `consigneeReceiptLocation/id`
- `consigneeReceiptLocation/postalAddress/additionalStreetName`
- `consigneeReceiptLocation/postalAddress/countryCode`
- `consigneeReceiptLocation/postalAddress/departmentName`
- `consigneeReceiptLocation/postalAddress/postOfficeBox`
- `consigneeReceiptLocation/geographicalCoordinates/*`
- All other consigneeReceiptLocation fields

---

### Section 4: Place and Date of Taking Over Goods - Bottom Left (Third Row)

**HTML Location**: Fourth table row, left cell (Section 4)

| XML Field Path | HTML Display Location | Notes |
|---------------|----------------------|-------|
| `/efti:consignment/efti:carrierAcceptanceDateTime` | Line 1 (separate line) | Date/time when carrier accepted goods |
| `/efti:consignment/efti:carrierAcceptanceLocation/efti:postalAddress/efti:buildingNumber` | Line 2 (with street name, postcode, city) | Combined with other address fields |
| `/efti:consignment/efti:carrierAcceptanceLocation/efti:postalAddress/efti:streetName` | Line 2 | Combined with building number, postcode, city |
| `/efti:consignment/efti:carrierAcceptanceLocation/efti:postalAddress/efti:postcode` | Line 2 | Combined with other address fields |
| `/efti:consignment/efti:carrierAcceptanceLocation/efti:postalAddress/efti:cityName` | Line 2 | Combined with other address fields |
| `/efti:consignment/efti:carrierAcceptanceLocation/efti:postalAddress/efti:countrySubDivisionName` | Line 3 (separate line) | State/Province |
| `/efti:consignment/efti:carrierAcceptanceLocation/efti:name` | Line 4 (separate line) | Location name |

**NOT MAPPED (Available in XML but not displayed)**:
- `carrierAcceptanceLocation/id`
- `carrierAcceptanceLocation/postalAddress/additionalStreetName`
- `carrierAcceptanceLocation/postalAddress/countryCode`
- `carrierAcceptanceLocation/postalAddress/departmentName`
- `carrierAcceptanceLocation/postalAddress/postOfficeBox`
- `carrierAcceptanceLocation/geographicalCoordinates/*`
- All other carrierAcceptanceLocation fields

---

### Section 16: CARRIER - Top Right (First Row)

**HTML Location**: Second table row, right cell (Section 16)

| XML Field Path | HTML Display Location | Notes |
|---------------|----------------------|-------|
| `/efti:consignment/efti:carrier/efti:name` | Line 1 (separate line) | Carrier company/person name |
| `/efti:consignment/efti:carrier/efti:postalAddress/efti:buildingNumber` | Line 2 (with street name, postcode, city) | Combined with other address fields |
| `/efti:consignment/efti:carrier/efti:postalAddress/efti:streetName` | Line 2 | Combined with building number, postcode, city |
| `/efti:consignment/efti:carrier/efti:postalAddress/efti:postcode` | Line 2 | Combined with other address fields |
| `/efti:consignment/efti:carrier/efti:postalAddress/efti:cityName` | Line 2 | Combined with other address fields |
| `/efti:consignment/carrier/efti:postalAddress/efti:countrySubDivisionName` | Line 3 (separate line) | **NOTE**: Missing `efti:` prefix in XSLT (line 88) - potential bug |

**NOT MAPPED (Available in XML but not displayed)**:
- `carrier/id`
- `carrier/postalAddress/additionalStreetName`
- `carrier/postalAddress/countryCode`
- `carrier/postalAddress/departmentName`
- `carrier/postalAddress/postOfficeBox`
- `carrier/definedContactDetails/*`
- `carrier/taxRegistration/*`
- `carrier/roleCode`
- `carrier/applicableLicence/*`
- `carrier/agreedContract/*`
- All other carrier fields

---

### Section 11 & 12: Gross Weight and Volume - Goods Table Footer

**HTML Location**: Inner table, total row (Sections 11 & 12)

| XML Field Path | HTML Display Location | Notes |
|---------------|----------------------|-------|
| `/efti:consignment/efti:grossWeight` | Column 11 (Gross weight value) | Weight value |
| `/efti:consignment/efti:grossWeight/@unitId` | Column 11 (after value) | Unit (e.g., "kg", "lb") |
| `/efti:consignment/efti:grossVolume` | Column 12 (Volume value) | Volume value |
| `/efti:consignment/efti:grossVolume/@unitId` | Column 12 (after value) | Unit (e.g., "m3", "ft3") |

**NOT MAPPED (Available in XML but not displayed)**:
- All individual goods items (the table rows 6-12 are hardcoded with sample data)
- `consignment/transportEquipmentItem/*`
- `consignment/transportHandlingUnit/*`
- `consignment/transportPackage/*`
- Individual package details, marks, descriptions, etc.

---

## Sections with NO XML Mapping (Hardcoded/Empty)

The following sections in the HTML template have **NO XML field mappings** and are either hardcoded or empty:

### Section 5: Annexed Documents
- **Location**: Bottom left, fifth row
- **Status**: Empty - no XML mapping

### Section 6-12: Goods Table (Individual Items)
- **Location**: Inner table rows
- **Status**: **HARDCODED** with sample data:
  - Row 1: "1.", "4", "truc cool", "Moteur Harley", "", "200KG", "200m3"
  - Row 2: "2.", "4", "mega truc cool", "Poney Hollandais courte patte", "", "1200KG", "500m3"
  - Total row: "8 Item" (hardcoded)
- **Should map to**: `consignment/transportEquipmentItem/*`, `transportHandlingUnit/*`, `transportPackage/*`, etc.

### Section 13: Sender's Instructions
- **Location**: Bottom table, left cell
- **Status**: Empty - no XML mapping
- **Could map to**: `consignment/cargoInsuranceInstructions`, `consignment/specialInstructions`, etc.

### Section 14: Cash on Delivery
- **Location**: Bottom table, left cell
- **Status**: Empty - no XML mapping
- **Could map to**: `consignment/cODAmount`, `consignment/cODPaymentArrangementCode`, etc.

### Section 15: Directions as to Freight Payment
- **Location**: Bottom table, left cell
- **Status**: Empty - no XML mapping
- **Could map to**: `consignment/applicableServiceCharge/*`, payment arrangements, etc.

### Section 17: Following Carrier
- **Location**: Third table row, right cell
- **Status**: Empty - no XML mapping
- **Could map to**: `consignment/connectingCarrier/*`, `consignment/subsequentCarrier/*`, etc.

### Section 18: Carrier's Reservations and Observations
- **Location**: Fourth table row, right cell (rowspan=2)
- **Status**: Empty - no XML mapping
- **Could map to**: `consignment/carrierRemarks`, observations, etc.

### Section 19: To be Paid By
- **Location**: Bottom table, right cell
- **Status**: Empty - no XML mapping
- **Could map to**: `consignment/applicableServiceCharge/payingPartyRoleCode`, etc.

### Section 20: Special Agreements
- **Location**: Bottom table, right cell
- **Status**: Empty - no XML mapping
- **Could map to**: `consignment/agreedContract/*`, special terms, etc.

### Section 21: Date and Place of Issue
- **Location**: Bottom table, left cell
- **Status**: Empty - no XML mapping
- **Could map to**: `consignment/issueDateTime`, `consignment/issueLocation/*`, etc.

### Section 22-24: Signatures
- **Location**: Signature table
- **Status**: Empty - no XML mapping
- **Could map to**: `consignment/consignor/authoritativeSignatoryPerson/*`, `consignment/carrier/authoritativeSignatoryPerson/*`, etc.

### Section 25-27: Vehicle Information
- **Location**: Vehicle table
- **Status**: Empty - no XML mapping
- **Could map to**: `consignment/mainCarriageTransportMovement/usedTransportMeans/*`, `consignment/usedTransportEquipment/*`, etc.

### Section 28: Tarifs
- **Location**: Bottom table
- **Status**: Empty - no XML mapping
- **Could map to**: `consignment/applicableServiceCharge/*`, tariff information, etc.

---

## Known Issues

### 1. Missing Namespace Prefix (Line 88)
```xml
<xsl:value-of select="/efti:consignment/carrier/efti:postalAddress/efti:countrySubDivisionName"/>
```
**Issue**: Missing `efti:` prefix before `carrier`
**Should be**: `/efti:consignment/efti:carrier/efti:postalAddress/efti:countrySubDivisionName`

### 2. Hardcoded Goods Items
The goods table (sections 6-12) contains hardcoded sample data instead of mapping to actual XML transport items. This should be replaced with:
- `xsl:for-each` loops over `transportEquipmentItem`, `transportHandlingUnit`, or `transportPackage`
- Dynamic mapping of marks, package counts, descriptions, weights, volumes, etc.

### 3. Missing Field Mappings
Many XML fields available in the schema are not mapped to HTML, including:
- Contact details (email, phone, fax)
- Tax registration information
- Transport movement details
- Equipment identifiers
- Document references
- Financial information
- And many more...

---

## Summary Statistics

- **Total XML Fields Mapped**: 25 fields
- **Sections with Mappings**: 5 sections (1, 2, 3, 4, 16, 11, 12)
- **Sections Empty/Hardcoded**: 23 sections
- **Address Fields Mapped**: 18 fields (building number, street, postcode, city, country subdivision, name)
- **Date/Time Fields Mapped**: 1 field (carrierAcceptanceDateTime)
- **Weight/Volume Fields Mapped**: 2 fields (grossWeight, grossVolume)

---

## Recommendations

1. **Fix the namespace bug** on line 88
2. **Implement dynamic goods table** using `xsl:for-each` to iterate over transport items
3. **Add mappings for empty sections** based on available XML fields
4. **Consider adding contact information** (email, phone) for consignor, consignee, carrier
5. **Add transport movement details** (vehicle numbers, equipment IDs, etc.)
6. **Add document references** and associated documents
7. **Add financial information** (charges, payment arrangements, COD amounts)

---

## XSLT File Location

- **Path**: `portal-mock/src/assets/xslt/eCMR.xslt`
- **Lines**: 368 total lines
- **Transformation Method**: Browser XSLTProcessor (client-side)
- **Output Format**: HTML table structure mimicking eCMR consignment note format







