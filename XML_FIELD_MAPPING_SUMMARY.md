# XML Field Mapping Summary for eCMR XSLT Transformation

This document lists the available XML fields for filling the empty/hardcoded fields in the eCMR XSLT transformation.

## Fields 6-12: Goods Table (Roba)

Currently hardcoded with sample data. Available XML fields:

**XML Path**: `/efti:consignment/efti:includedConsignmentItem`

Each item contains:
- **Field 6 - Marks and numbers (Oznake i brojevi)**: 
  - `/efti:shippingMarks/efti:markingText`
  - OR `/efti:transportDangerousGoods/efti:dangerousGoodsLogisticsPackage/efti:shippingMarks/efti:markingText`

- **Field 7 - Number of packages (Broj paketa)**:
  - `/efti:goodsUnitQuantity`
  - OR `/efti:transportDangerousGoods/efti:dangerousGoodsLogisticsPackage/efti:itemQuantity`

- **Field 8 - Description of packing (Opis pakiranja)**:
  - `/efti:dimensions/efti:description`
  - OR `/efti:associatedTransportEquipment/efti:id` (equipment ID)
  - Note: May need to map from transportPackage/transportHandlingUnit if available

- **Field 9 - Nature of goods / Shipping name (Priroda robe / Naziv)**:
  - `/efti:transportDangerousGoods/efti:properShippingName`
  - OR `/efti:transportDangerousGoods/efti:information`
  - Note: May need to use a description field from elsewhere

- **Field 10 - Statistic number (Stat. broj)**:
  - Not clearly found in XML schema - may need to check for customs/statistics codes
  - Could be in `/efti:transportDangerousGoods/efti:hazardClassificationID`

- **Field 11 - Gross weight (Bruto masa)**: 
  - `/efti:grossWeight` + `@unitId`

- **Field 12 - Volume (Volumen)**:
  - `/efti:grossVolume` + `@unitId`

**Totals**:
- Total items: Count of `/efti:includedConsignmentItem`
- Total gross weight: `/efti:consignment/efti:grossWeight` + `@unitId` (already mapped)
- Total volume: `/efti:consignment/efti:grossVolume` + `@unitId` (already mapped)

---

## Field 5: Annexed Documents (Priloženi dokumenti)

**XML Path**: `/efti:consignment/efti:associatedDocument`

Fields available:
- `/efti:id` - Document ID
- `/efti:typeCode` - Document type
- `/efti:referenceTypeCode` - Reference type
- `/efti:formattedIssueDateTime` - Issue date
- `/efti:issueLocation/efti:name` - Issue location
- `/efti:uRI` - Document URI

Note: Multiple documents may exist - use `xsl:for-each` to iterate.

---

## Field 13: Sender's Instructions (Upute pošiljatelja)

**XML Paths**:
- `/efti:consignment/efti:consignorProvidedBorderClearanceInstructions/efti:description`
- `/efti:consignment/efti:cargoInsuranceInstructions`
- `/efti:consignment/efti:consignorProvidedInformationText`

Note: Multiple `description` elements may exist - concatenate them.

---

## Field 14: Cash on Delivery (Pouzeće)

**XML Path**: `/efti:consignment/efti:cODAmount` + `@currencyId`

---

## Field 15: Directions as to Freight Payment (Upute za plaćanje vozarine)

**XML Path**: `/efti:consignment/efti:applicableServiceCharge/efti:paymentArrangementCode`

Note: Multiple service charges may exist - may need to select the appropriate one or concatenate.

---

## Field 17: Following Carrier (Sljedeći prijevoznik)

**XML Path**: `/efti:consignment/efti:connectingCarrier`

Fields available:
- `/efti:connectingCarrier/efti:name`
- `/efti:connectingCarrier/efti:postalAddress/*` (address fields)
- `/efti:connectingCarrier/efti:id`

Note: Format similar to Field 16 (Carrier) - use similar address formatting template.

---

## Field 18: Carrier's Reservations (Rezerve i napomene prijevoznika)

**XML Paths** (may not exist in schema):
- Not clearly defined in the XML schema
- Could potentially use `/efti:consignment/efti:information` if available
- OR carrier-specific remarks fields if they exist

Note: This field may not have a direct XML mapping in the current schema.

---

## Field 19: To be Paid By (Plaća)

**XML Path**: `/efti:consignment/efti:applicableServiceCharge/efti:payingPartyRoleCode`

Note: Multiple service charges may exist - may need to select the appropriate one or concatenate.

---

## Field 20: Special Agreements (Posebni sporazumi)

**XML Paths**:
- `/efti:consignment/efti:carrier/efti:agreedContract/efti:signedLocation/efti:name`
- `/efti:consignment/efti:consignor/efti:agreedContract/efti:issueDateTime`
- `/efti:consignment/efti:contractTermsText`

Note: Multiple agreed contracts may exist for different parties. May need to concatenate or select carrier's contract.

---

## Field 21: Date and Place of Issue (Datum i mjesto izdavanja)

**XML Paths**:
- Date: `/efti:consignment/efti:associatedDocument/efti:formattedIssueDateTime`
- Place: `/efti:consignment/efti:associatedDocument/efti:issueLocation/efti:name`
- OR address: `/efti:consignment/efti:associatedDocument/efti:issueLocation/efti:postalAddress/*`

Note: Format date and location together.

---

## Fields 22-24: Signatures (Potpisi)

### Field 22: Sender's Signature (Potpis i pečat pošiljatelja)
**XML Path**: `/efti:consignment/efti:consignor/efti:authoritativeSignatoryPerson/efti:name`

### Field 23: Carrier's Signature (Potpis i pečat prijevoznika)
**XML Path**: `/efti:consignment/efti:carrier/efti:authoritativeSignatoryPerson/efti:name`

### Field 24: Goods Received (Roba zaprimljena)
**XML Path**: `/efti:consignment/efti:consignee/efti:authoritativeSignatoryPerson/efti:name`

Note: Multiple signatory persons may exist - may need to select first or concatenate.

---

## Fields 25-27: Vehicle and Tariff (Vozilo i tarifa)

### Field 25: Vehicle and Trailer Number (Broj vozila i prikolice)
**XML Paths**:
- Vehicle: `/efti:consignment/efti:mainCarriageTransportMovement/efti:usedTransportMeans/efti:id`
- Trailer: `/efti:consignment/efti:usedTransportEquipment/efti:id` (first equipment, if applicable)

Note: Format: "Vehicle: {id} / Trailer: {equipmentId}"

### Field 26: Vehicle and Trailer Model (Model vozila i prikolice)
**XML Paths**:
- Not clearly found in XML schema
- Could potentially use `/efti:consignment/efti:usedTransportEquipment/efti:categoryCode` (equipment category)
- May not be available in current schema

### Field 27: Tariff (Tarifa)
**XML Path**: `/efti:consignment/efti:applicableServiceCharge/efti:calculationBasisCode`
- OR `/efti:consignment/efti:applicableServiceCharge/efti:appliedAmount` + `@currencyId`

Note: Multiple service charges may exist - may need to select the appropriate one or concatenate.

---

## Field 28: Tariffs (Tarife)

**XML Path**: `/efti:consignment/efti:applicableServiceCharge`

Fields to display:
- `/efti:appliedAmount` + `@currencyId` - Amount
- `/efti:calculationBasisCode` - Basis code
- `/efti:payingPartyRoleCode` - Paying party
- `/efti:paymentArrangementCode` - Payment arrangement

Note: Multiple service charges may exist - use `xsl:for-each` to iterate and display all tariffs.

---

## Implementation Notes

1. **Multiple Items**: Many fields support multiple occurrences (e.g., `includedConsignmentItem`, `applicableServiceCharge`, `associatedDocument`). Use `xsl:for-each` to iterate.

2. **Concatenation**: Some fields have multiple values (e.g., `consignorProvidedBorderClearanceInstructions/description`). Concatenate with line breaks or commas.

3. **Conditional Display**: Some fields may not exist - use `xsl:if` to check for existence before displaying.

4. **Formatting**: Use helper templates for consistent formatting (dates, addresses, currency, etc.).

5. **Empty Values**: Display "—" or empty class if field doesn't exist.

6. **Namespace**: All paths use `efti:` namespace prefix: `http://efti.eu/v1/consignment/common`




