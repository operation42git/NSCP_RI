# Analysis: Exact Field Mapping for XML Generation

## User Requirement

Allow specifying exact production values for CMR fields (1-28), where:
- Only specified fields are populated
- Rest of XML remains empty/minimal
- Used for production data and specific test scenarios

## Current Architecture

```
┌─────────────────────┐
│ Python Script       │  Generates full XML with random realistic data
│ (generate_*.py)    │  → Output: {uuid}.xml in cda/ folder
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Registration Script │  Uploads XML file to platform simulator
│ (register-*.ps1)   │  → Platform stores in consignment_xml table
└─────────────────────┘
```

## Proposed Architecture Options

### Option A: Extend Python Generation Script ⭐ **RECOMMENDED**

**Approach:**
- Add `--data-file` parameter to `generate_realistic_croatian_data.py`
- Accept JSON/YAML file with field mappings
- Generate minimal XML with only specified fields populated
- Keep existing random generation as default

**Flow:**
```
User provides data.json
    ↓
Python script reads data.json
    ↓
Generates minimal XML (only specified fields)
    ↓
Output: {uuid}.xml
    ↓
Registration script uploads it
```

**Pros:**
- ✅ Keeps generation logic in one place
- ✅ Can reuse existing field mapping logic
- ✅ Maintains separation of concerns (generation vs registration)
- ✅ Easy to extend with new modes
- ✅ Can combine with existing modes (e.g., `--mode NORMAL --data-file data.json`)

**Cons:**
- ⚠️ Script becomes more complex
- ⚠️ Need to maintain CMR field → XML path mapping
- ⚠️ Need to handle schema validation for minimal XML

### Option B: Create Separate Minimal XML Generator

**Approach:**
- New script: `generate_minimal_xml.py`
- Dedicated to minimal XML generation
- Registration script stays unchanged

**Pros:**
- ✅ Separation of concerns
- ✅ Doesn't complicate existing script
- ✅ Can be simpler, focused tool

**Cons:**
- ❌ Code duplication (field mapping logic)
- ❌ Two scripts to maintain
- ❌ User needs to know which script to use

### Option C: Add to Registration Script

**Approach:**
- Registration script accepts data file
- Generates XML on-the-fly before uploading

**Pros:**
- ✅ Single command for generation + registration

**Cons:**
- ❌ Mixes concerns (generation + registration)
- ❌ Registration script becomes complex
- ❌ Harder to test generation separately
- ❌ Can't generate XML without registering

## Recommended Solution: Option A

**Implementation Plan:**

### 1. Data Input Format (JSON)

```json
{
  "ecmr_identifier": "HR-ECMR-2026-000123",
  "issue_date": "2026-01-11T09:15:00+01:00",
  "issue_location": {
    "city": "Zagreb",
    "country": "HR"
  },
  "consignor": {
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
  "consignee": {
    "name": "Dalmacija Retail d.o.o.",
    "address": {
      "street": "Vukovarska",
      "building_number": "220",
      "postcode": "21000",
      "city": "Split",
      "country": "HR"
    },
    "tax_id": "98765432109"
  },
  "delivery_location": {
    "name": "Skladište \"DR-SPL-01\"",
    "address": {
      "street": "Vukovarska",
      "building_number": "220",
      "postcode": "21000",
      "city": "Split",
      "country": "HR"
    }
  },
  "pickup": {
    "location": {
      "city": "Zagreb",
      "street": "Radnička cesta",
      "building_number": "80",
      "postcode": "10000",
      "country": "HR"
    },
    "datetime": "2026-01-11T10:00:00+01:00"
  },
  "attached_documents": [
    {"id": "INV-2026-00456", "type": "Invoice"},
    {"id": "PL-2026-00198", "type": "Packing list"}
  ],
  "carrier": {
    "name": "TransLogistika d.o.o.",
    "address": {
      "street": "Slavonska avenija",
      "building_number": "52",
      "postcode": "10000",
      "city": "Zagreb",
      "country": "HR"
    },
    "tax_id": "11223344556"
  },
  "carrier_reservations": "Bez rezervi. Ambalaža neoštećena.",
  "goods": {
    "marks": "AF-PLT-2026-01",
    "package_count": 10,
    "packaging_description": "10 paleta (EUR)",
    "nature": "Pakirani prehrambeni proizvodi (neopasno)",
    "hs_code": "21069098",
    "gross_weight": {"value": 6500.00, "unit": "KGM"},
    "volume": {"value": 24.00, "unit": "MTQ"}
  },
  "sender_instructions": "Isporuka radnim danom 08:00–16:00, najava 1h prije dolaska.",
  "cod_amount": {"value": 0.00, "currency": "EUR"},
  "freight_payment": "PREPAID",
  "payment_party": "SENDER",
  "special_agreements": "Temperaturni režim: 5–25 °C (bez hlađenja)",
  "signatures": {
    "consignor": {"company": "Adria Food d.o.o.", "person": "Ivan Horvat"},
    "carrier": {"company": "TransLogistika d.o.o.", "person": "Marko Kovač"},
    "consignee": {"company": "Dalmacija Retail d.o.o.", "person": "Ana Marić"}
  },
  "vehicle": {
    "id": "HR ZG-1234-AB",
    "trailer_id": "HR ZG-5678-CD",
    "model": "MAN TGX 18.440 + Schmitz S.KO"
  },
  "tariff": {
    "basis": "per_km",
    "amount": {"value": 620.00, "currency": "EUR"}
  }
}
```

### 2. CMR Field to XML Path Mapping

| CMR Field | Description | XML Path |
|-----------|-------------|----------|
| 1 | Pošiljatelj (Sender) | `/consignment/consignor` |
| 2 | Primatelj (Consignee) | `/consignment/consignee` |
| 3 | Adresa isporuke | `/consignment/consigneeReceiptLocation` |
| 4 | Mjesto i datum preuzimanja | `/consignment/carrierAcceptanceLocation` + `carrierAcceptanceDateTime` |
| 5 | Priloženi dokumenti | `/consignment/associatedDocument` |
| 6 | Oznake i brojevi | `/consignment/includedConsignmentItem/shippingMarks/markingText` |
| 7 | Broj paketa | `/consignment/includedConsignmentItem/goodsUnitQuantity` |
| 8 | Opis pakiranja | `/consignment/includedConsignmentItem/description` |
| 9 | Priroda robe | `/consignment/includedConsignmentItem/natureIdentificationTransportCargo` |
| 10 | Stat. broj (HS) | `/consignment/includedConsignmentItem/harmonizedCommodityCode` |
| 11 | Bruto masa | `/consignment/grossWeight` |
| 12 | Volumen | `/consignment/grossVolume` |
| 13 | Upute pošiljatelja | `/consignment/consignorProvidedInformationText` |
| 14 | Pouzeće | `/consignment/cODAmount` |
| 15 | Upute za plaćanje vozarine | `/consignment/applicableServiceCharge/paymentArrangementCode` |
| 16 | Prijevoznik | `/consignment/carrier` |
| 17 | Sljedeći prijevoznik | `/consignment/connectingCarrier` |
| 18 | Rezervacije prijevoznika | `/consignment/information` (in carrier context) |
| 19 | Plaća | `/consignment/applicableServiceCharge/payingPartyRoleCode` |
| 20 | Posebni sporazumi | `/consignment/contractTermsText` |
| 21 | Datum i mjesto izdavanja | `/consignment/associatedDocument/issueLocation` + `formattedIssueDateTime` |
| 22 | Potpis pošiljatelja | `/consignment/consignor/authoritativeSignatoryPerson` |
| 23 | Potpis prijevoznika | `/consignment/carrier/authoritativeSignatoryPerson` |
| 24 | Roba zaprimljena | `/consignment/consignee/authoritativeSignatoryPerson` |
| 25 | Broj vozila | `/consignment/mainCarriageTransportMovement/usedTransportMeans/id` |
| 26 | Model vozila | `/consignment/usedTransportEquipment` (model info) |
| 27 | Tarifa | `/consignment/applicableServiceCharge/calculationBasisCode` |
| 28 | Tarife | `/consignment/applicableServiceCharge/appliedAmount` |

### 3. Implementation Considerations

#### Schema Validation
- **Question:** Can XML be partially empty?
- **Answer:** Need to check XSD schema for `minOccurs` requirements
- **Solution:** Only include elements that are specified OR required by schema

#### Required vs Optional Fields
- Some fields may be required by schema (e.g., `consignment` root, namespaces)
- Need to ensure minimal valid XML structure
- Optional fields can be omitted entirely

#### Empty vs Minimal Structure
- **Empty:** Element not present in XML
- **Minimal:** Element present but with minimal required attributes/children
- **Decision:** Use empty (omit elements) for better clarity

#### Template Approach
- Start with minimal valid XML template
- Only populate specified fields
- Remove all unspecified optional elements

### 4. Usage Examples

**Command:**
```powershell
# Generate minimal XML with exact data
python generate_realistic_croatian_data.py --mode MINIMAL --data-file production_data.json --uuid cdcf9024-9454-4444-a467-bcb4b947d859

# Then register
.\register-dataset-simple.ps1 -DatasetId cdcf9024-9454-4444-a467-bcb4b947d859
```

**Or combined:**
```powershell
# Generate and register in one command (if we add --register flag)
python generate_realistic_croatian_data.py --mode MINIMAL --data-file production_data.json --register
```

### 5. Technical Challenges

#### Challenge 1: Field Mapping Complexity
- **Issue:** CMR fields don't map 1:1 to XML structure
- **Example:** Field 4 (pickup) maps to both `carrierAcceptanceLocation` AND `carrierAcceptanceDateTime`
- **Solution:** Create mapping dictionary with transformation logic

#### Challenge 2: Nested Structures
- **Issue:** Some fields require nested XML elements
- **Example:** Address requires `postalAddress` with multiple children
- **Solution:** Use structured JSON input matching XML hierarchy

#### Challenge 3: Data Type Validation
- **Issue:** Need to validate data types (dates, numbers, codes)
- **Solution:** Add validation layer before XML generation

#### Challenge 4: Schema Compliance
- **Issue:** Generated XML must validate against XSD
- **Solution:** 
  - Use XML validation after generation
  - Provide clear error messages for invalid data
  - Include required attributes (namespaces, formatId, etc.)

### 6. Benefits

✅ **Production-Ready Data**
- Use exact production values
- No random data contamination
- Reproducible test scenarios

✅ **Minimal XML**
- Only necessary data
- Easier to understand
- Smaller file size

✅ **Flexible**
- Can combine with existing modes
- Can override specific fields
- Can use templates

### 7. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema validation failures | High | Validate against XSD, provide clear errors |
| Missing required fields | High | Document required fields, validate input |
| Complex field mappings | Medium | Create comprehensive mapping documentation |
| Maintenance burden | Medium | Keep mapping table separate, well-documented |
| User confusion | Low | Clear examples, good error messages |

### 8. Alternative: Two-Phase Approach

**Phase 1:** Generate minimal XML structure (always)
**Phase 2:** Populate only specified fields

This ensures:
- Always valid XML structure
- Only specified fields have data
- Easier to validate

### 9. Recommendation

**✅ YES, implement this feature, but:**

1. **Add to Python generation script** (Option A) - not registration script
2. **Use JSON input format** - structured, easy to parse
3. **Create comprehensive field mapping** - CMR fields → XML paths
4. **Validate against schema** - ensure generated XML is valid
5. **Keep as separate mode** - `--mode MINIMAL --data-file data.json`
6. **Document required fields** - what must be present for valid XML

**Why NOT in registration script:**
- Registration script should focus on uploading/registering
- Generation logic belongs in generation script
- Better separation of concerns
- Easier to test and maintain

**Implementation Priority:**
- **High Value:** Production data scenarios
- **Medium Complexity:** Field mapping and validation
- **Low Risk:** Can be added as optional feature

## Conclusion

**Yes, it makes sense to add this feature**, but it should be part of the **generation script**, not the registration script. This maintains proper separation of concerns and allows for better testing and maintenance.




