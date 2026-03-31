# UIL Search Display - Field Mapping Documentation

## Overview
This document describes how the portal displays UIL search results and maps fields from `consignment-common.xml` to the display.

## Display Flow

1. **UIL Search Form**: User enters Dataset ID, Gate ID, and Platform ID
2. **Search Results Table**: Displays search results with metadata
3. **eCMR Display Page**: Shows detailed consignment data when clicking "Open" on a COMPLETE result

---

## 1. UIL Search Results Table

### Displayed Fields:
- **Request ID**: Internal request identifier
- **Gate ID**: Gate identifier
- **Dataset ID**: Dataset identifier  
- **Platform ID**: Platform identifier
- **Status**: Request status (COMPLETE, PENDING, ERROR)
- **Action**: Buttons for Notes, Open, Download, Poll

### XML Mapping:
*Note: This table shows search metadata, not consignment data. The actual XML data is displayed when clicking "Open".*

---

## 2. eCMR Display Page

The eCMR display page shows all consignment data parsed from `consignment-common.xml`. Fields are organized into sections:

### Header Section

| Display Field | XML Path | Notes |
|--------------|----------|-------|
| eCMR identifikator | `consignment/associatedDocument/id` | Document identifier |
| Datum izdavanja | `consignment/associatedDocument/formattedIssueDateTime` | Issue date |
| Mjesto izdavanja | `consignment/associatedDocument/issueLocation/name` | Issue location name |

---

### Osnovni podaci (Basic Information) - Fields 1-5, 16-18

| Field # | Display Label | XML Path | Notes |
|---------|---------------|----------|-------|
| **1** | Pošiljatelj (Consignor) | `consignment/consignor/name`<br>`consignment/consignor/postalAddress/*` | Combines name + address |
| **2** | Primatelj (Consignee) | `consignment/consignee/name`<br>`consignment/consignee/postalAddress/*` | Combines name + address |
| **3** | Adresa isporuke (Delivery Address) | `consignment/consigneeReceiptLocation/name`<br>`consignment/consigneeReceiptLocation/postalAddress/*` | Location name + address |
| **4** | Mjesto i datum preuzimanja robe | `consignment/carrierAcceptanceDateTime`<br>`consignment/carrierAcceptanceLocation/*` | Date/time + location |
| **5** | Priloženi dokumenti (Annexed Documents) | `consignment/associatedDocument/id`<br>`consignment/associatedDocument/typeCode` | Document ID + type |
| **16** | Prijevoznik (Carrier) | `consignment/carrier/name`<br>`consignment/carrier/postalAddress/*` | Combines name + address |
| **17** | Sljedeći prijevoznik (Following Carrier) | `consignment/connectingCarrier/name`<br>`consignment/connectingCarrier/postalAddress/*` | Optional field |
| **18** | Rezerve i napomene prijevoznika | *Not mapped* | Empty in current implementation |

**Address Fields Used:**
- `postalAddress/buildingNumber`
- `postalAddress/streetName`
- `postalAddress/postcode`
- `postalAddress/cityName`
- `postalAddress/countrySubDivisionName`
- `postalAddress/countryCode`

---

### Roba (Goods) - Fields 6-12

Displayed in a table format with one row per consignment item.

| Field # | Display Label | XML Path | Notes |
|---------|---------------|----------|-------|
| **6** | Oznake i brojevi (Marks and Numbers) | `consignment/includedConsignmentItem/shippingMarks/markingText`<br>OR<br>`consignment/includedConsignmentItem/transportDangerousGoods/dangerousGoodsLogisticsPackage/shippingMarks/markingText` | Fallback to dangerous goods marks |
| **7** | Broj paketa (Number of Packages) | `consignment/includedConsignmentItem/goodsUnitQuantity`<br>OR<br>`consignment/includedConsignmentItem/transportDangerousGoods/dangerousGoodsLogisticsPackage/itemQuantity` | Fallback to dangerous goods quantity |
| **8** | Opis pakiranja (Packing Description) | `consignment/includedConsignmentItem/dimensions/description`<br>OR<br>`consignment/includedConsignmentItem/associatedTransportEquipment/id` | Fallback to equipment ID |
| **9** | Priroda robe / Naziv (Nature of Goods) | `consignment/includedConsignmentItem/transportDangerousGoods/properShippingName`<br>OR<br>`consignment/includedConsignmentItem/transportDangerousGoods/information` | Dangerous goods name or info |
| **10** | Stat. broj (Statistic Number) | `consignment/includedConsignmentItem/transportDangerousGoods/hazardClassificationID` | Hazard classification |
| **11** | Bruto masa (Gross Weight) | `consignment/includedConsignmentItem/grossWeight` + `@unitId` | Weight with unit |
| **12** | Volumen (Volume) | `consignment/includedConsignmentItem/grossVolume` + `@unitId` | Volume with unit |

**Summary Totals:**
- Ukupno stavki: Count of `consignment/includedConsignmentItem`
- Ukupno bruto: `consignment/grossWeight` + `@unitId`
- Ukupno volumen: `consignment/grossVolume` + `@unitId`

---

### Upute i plaćanje (Instructions & Payment) - Fields 13-21

| Field # | Display Label | XML Path | Notes |
|---------|---------------|----------|-------|
| **13** | Upute pošiljatelja (Sender Instructions) | `consignment/consignorProvidedBorderClearanceInstructions/description`<br>OR<br>`consignment/cargoInsuranceInstructions`<br>OR<br>`consignment/consignorProvidedInformationText` | Multiple fallback options |
| **14** | Pouzeće (COD Amount) | `consignment/cODAmount` + `@currencyId` | Cash on delivery amount |
| **15** | Upute za plaćanje vozarine (Payment Instructions) | `consignment/applicableServiceCharge/paymentArrangementCode` | Payment arrangement code(s) |
| **19** | Plaća (Paying Party) | `consignment/applicableServiceCharge/payingPartyRoleCode` | Paying party role code(s) |
| **20** | Posebni sporazumi (Special Agreements) | `consignment/contractTermsText`<br>OR<br>`consignment/carrier/agreedContract/signedLocation/name` | Contract terms or signed location |
| **21** | Datum i mjesto izdavanja | `consignment/associatedDocument/formattedIssueDateTime`<br>`consignment/associatedDocument/issueLocation/*` | Date + location |

---

### Potpisi (Signatures) - Fields 22-24

| Field # | Display Label | XML Path | Notes |
|---------|---------------|----------|-------|
| **22** | Potpis i pečat pošiljatelja | `consignment/consignor/authoritativeSignatoryPerson/name` | First name element |
| **23** | Potpis i pečat prijevoznika | `consignment/carrier/authoritativeSignatoryPerson/name` | First name element |
| **24** | Roba zaprimljena (Goods Received) | `consignment/consignee/authoritativeSignatoryPerson/name` | First name element |

---

### Vozilo i tarifa (Vehicle & Tariff) - Fields 25-28

| Field # | Display Label | XML Path | Notes |
|---------|---------------|----------|-------|
| **25** | Broj vozila i prikolice | `consignment/mainCarriageTransportMovement/usedTransportMeans/id`<br>`consignment/usedTransportEquipment/id` | Vehicle + trailer IDs |
| **26** | Model vozila i prikolice | `consignment/usedTransportEquipment/categoryCode` | Equipment category |
| **27** | Tarifa (Tariff) | `consignment/applicableServiceCharge/calculationBasisCode`<br>OR<br>`consignment/applicableServiceCharge/appliedAmount` + `@currencyId` | First service charge |
| **28** | Tarife (Tariffs) | `consignment/applicableServiceCharge/appliedAmount` + `@currencyId`<br>`consignment/applicableServiceCharge/calculationBasisCode` | All service charges |

---

## Implementation Details

### Parsing Process

1. **XML Reception**: XML data is received as base64-encoded string in the UIL search response
2. **Decoding**: Base64 is decoded to UTF-8 XML string
3. **Parsing**: `ECMRParserService.parseXML()` parses the XML using DOMParser
4. **Mapping**: XML elements are mapped to `ECMRData` TypeScript interface
5. **Display**: Angular component (`ecmr-display.component.html`) renders the data

### Key Files

- **Parser**: `portal-mock/src/app/core/services/ecmr-parser.service.ts`
- **Model**: `portal-mock/src/app/core/models/ecmr.model.ts`
- **Component**: `portal-mock/src/app/pages/ecmr-display/ecmr-display.component.html`
- **Component Logic**: `portal-mock/src/app/pages/ecmr-display/ecmr-display.component.ts`
- **Translations**: `portal-mock/src/assets/i18n/hr.json` (Croatian) and `en.json` (English)

### Field Formatting

- **Addresses**: Formatted as multi-line strings combining building number, street, postcode, city, and subdivision
- **Parties**: Name displayed below address
- **Locations**: Name displayed below address
- **Currency**: Amount + currency code (e.g., "1000.00 EUR")
- **Dates**: Displayed as formatted strings from XML

---

## Visual Reference

Open `UIL_SEARCH_DISPLAY_VISUALIZATION.html` in a web browser to see a visual mockup of the portal display with all field mappings annotated.

