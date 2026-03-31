# Data Subsets Display Analysis & Recommendations

## Executive Summary

This document analyzes the current ECMR display implementation and proposes a card-based approach for displaying additional data subsets from `consignment-common.xml`, including ADR (dangerous goods) data and other specialized sections.

## Current Implementation Analysis

### Current Display Structure
The ECMR display component currently shows road transport data in a card-based layout:

1. **Header Card** - eCMR metadata (ID, dates, location)
2. **Basic Information Card** - Consignor, consignee, carrier, delivery address
3. **Goods Card** - Table of consignment items (fields 6-12)
4. **Instructions & Payment Card** - Payment and special instructions (fields 13-21)
5. **Signatures Card** - Signatures from parties (fields 22-24)
6. **Vehicle & Tariff Card** - Vehicle details and tariffs (fields 25-28)

### Current Architecture
- **Component**: `ecmr-display.component.ts`
- **Parser Service**: `ecmr-parser.service.ts`
- **Model**: `ecmr.model.ts`
- **Styling**: Modern card-based design with CSS variables

## Available Data Subsets in consignment-common.xml

Based on the XML schema analysis, the following data subsets are available but not currently displayed:

### 1. **ADR / Dangerous Goods** ⚠️ (High Priority)
**Location**: `<dangerousGoods>` element (lines 463-731 in example XML)

**Key Fields**:
- `uNDGID` - UN Dangerous Goods ID
- `properShippingName` - Proper shipping name
- `hazardClassificationID` - Hazard classification
- `hazardCategoryCode` - Hazard category
- `hazardTypeCode` - Hazard type
- `packagingDangerLevelCode` - Packaging danger level
- `limitedQuantityCode` - Limited quantity indicator
- `tunnelRestrictionCode` - Tunnel restriction code
- `controlTemperature` - Control temperature requirements
- `emergencyTemperature` - Emergency temperature
- `radioactiveMaterial` - Radioactive material details
- `dangerousGoodsLogisticsPackage` - Package information
- `grossWeight`, `netWeight`, `grossVolume` - Weights and volumes
- `information` - Additional information
- `supplementaryInformation` - Supplementary information
- `relatedDocument` - Related documents

**Also available at item level**: `<transportDangerousGoods>` within `<includedConsignmentItem>`

### 2. **Delivery Events** 📦
**Location**: `<deliveryEvent>` element

**Key Fields**:
- `actualOccurrenceDateTime` - Actual delivery date/time
- `estimatedOccurrenceDateTime` - Estimated delivery date/time
- `requestedOccurrenceDateTime` - Requested delivery date/time
- `scheduledOccurrenceDateTime` - Scheduled delivery date/time
- `scheduledOccurrencePeriod` - Scheduled period
- `occurrenceLocation` - Delivery location
- `typeCode` - Event type
- `certifyingParty` - Certifying party
- `additionalSecurityMeasures` - Security measures
- `relatedObservation` - Observations

### 3. **Transport Movement** 🚛
**Location**: `<mainCarriageTransportMovement>` element

**Key Fields**:
- `arrivalEvent` - Arrival event details
- `departureEvent` - Departure event details
- `usedTransportMeans` - Transport means (vehicle) details
- `modeCode` - Transport mode code
- `dangerousGoodsIndicator` - Dangerous goods indicator

### 4. **Risk Analysis** 🔒
**Location**: `<logisticsRiskAnalysisResult>` element

**Key Fields**:
- `levelCode` - Risk level
- `consignmentRiskRelatedCode` - Risk code
- `screeningMethodCode` - Screening method
- `securityExemptionCode` - Security exemption
- `description` - Description
- `informationText` - Information text

### 5. **Associated Parties** 👥
**Location**: `<associatedParty>` elements (multiple)

**Key Fields**:
- `name` - Party name
- `roleCode` - Role code
- `postalAddress` - Address
- `definedContactDetails` - Contact information
- `applicableLicence` - Licenses
- `taxRegistration` - Tax registration

### 6. **Freight Forwarder** 📋
**Location**: `<freightForwarder>` element

**Key Fields**:
- `name` - Name
- `id` - ID
- `postalAddress` - Address
- `definedContactDetails` - Contact details
- `roleCode` - Role code

### 7. **Service Charges** 💰 (Partially displayed)
**Location**: `<applicableServiceCharge>` elements

**Additional Fields**:
- `calculationBasisPrice` - Calculation basis price
- `payingPartyRoleCode` - Paying party role
- `paymentArrangementCode` - Payment arrangement
- Multiple charges can be displayed in detail

### 8. **Associated Documents** 📄 (Partially displayed)
**Location**: `<associatedDocument>` elements

**Additional Fields**:
- `typeCode` - Document type
- `subtypeCode` - Document subtype
- `referenceTypeCode` - Reference type
- `attachedBinaryFile` - Attached files
- `attachedBinaryObject` - Binary objects
- `issuer` - Document issuer
- `issueLocation` - Issue location

## Recommended Approach: Card-Based Display

### Design Philosophy

1. **Modular Cards**: Each data subset gets its own card
2. **Conditional Display**: Cards only show when data is present
3. **Visual Hierarchy**: Important cards (like ADR) get visual emphasis
4. **Expandable Sections**: Complex data can be collapsed/expanded
5. **Consistent Styling**: Reuse existing card design patterns

### Proposed Card Structure

```
┌─────────────────────────────────────────┐
│  [Current ECMR Cards]                  │
│  - Header                               │
│  - Basic Information                    │
│  - Goods                                │
│  - Instructions & Payment               │
│  - Signatures                           │
│  - Vehicle & Tariff                     │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🆕 ADR / Dangerous Goods Card          │
│  [New Card]                             │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🆕 Delivery Events Card                │
│  [New Card]                             │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🆕 Transport Movement Card              │
│  [New Card]                             │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🆕 Risk Analysis Card                   │
│  [New Card]                             │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  🆕 Additional Parties Card              │
│  [New Card]                             │
└─────────────────────────────────────────┘
```

## Implementation Recommendations

### Phase 1: ADR Card (High Priority)

**Why Start Here**:
- ADR data is critical for dangerous goods transport
- Already partially parsed in items but not displayed as dedicated section
- High regulatory importance

**Card Design**:
```
┌─────────────────────────────────────────────────────┐
│ ADR / Dangerous Goods                    [⚠️ Badge] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  UN Number: UN1234                                  │
│  Proper Shipping Name: Flammable Liquid              │
│  Hazard Classification: 3                            │
│  Packing Group: II                                   │
│  Tunnel Restriction: E                               │
│                                                     │
│  ┌─ Temperature Requirements ─────────────────┐   │
│  │ Control Temp: -10°C                         │   │
│  │ Emergency Temp: -20°C                       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ Package Information ───────────────────────┐   │
│  │ Package Type: Drum                           │   │
│  │ Quantity: 10                                 │   │
│  │ Gross Weight: 500 kg                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Show More Details] [Expand]                     │
└─────────────────────────────────────────────────────┘
```

**Implementation Steps**:
1. Extend `ECMRData` model with `dangerousGoods` property
2. Update parser service to extract ADR data
3. Create ADR card component or section
4. Add conditional display logic

### Phase 2: Delivery Events Card

**Card Design**:
```
┌─────────────────────────────────────────────────────┐
│ Delivery Events                         [📦 Badge]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Actual Delivery: 2024-01-15 14:30                 │
│  Location: Warehouse A, Zagreb                     │
│                                                     │
│  Scheduled: 2024-01-15 10:00 - 18:00                │
│  Estimated: 2024-01-15 15:00                        │
│                                                     │
│  [Show Event Details]                               │
└─────────────────────────────────────────────────────┘
```

### Phase 3: Additional Cards

Implement remaining cards based on priority and user needs.

## Technical Implementation Plan

### 1. Model Extensions

**File**: `portal-mock/src/app/core/models/ecmr.model.ts`

Add new interfaces:
```typescript
export interface DangerousGoods {
  unNumber?: string;
  properShippingName?: string;
  hazardClassificationID?: string;
  hazardCategoryCode?: string;
  hazardTypeCode?: string;
  packagingDangerLevelCode?: string;
  limitedQuantityCode?: string;
  tunnelRestrictionCode?: string;
  controlTemperature?: {
    value?: string;
    unit?: string;
    typeCode?: string;
  };
  emergencyTemperature?: {
    value?: string;
    unit?: string;
    typeCode?: string;
  };
  grossWeight?: string;
  grossWeightUnit?: string;
  netWeight?: string;
  netWeightUnit?: string;
  grossVolume?: string;
  grossVolumeUnit?: string;
  information?: string;
  supplementaryInformation?: string;
  // ... more fields
}

export interface DeliveryEvent {
  actualOccurrenceDateTime?: string;
  estimatedOccurrenceDateTime?: string;
  requestedOccurrenceDateTime?: string;
  scheduledOccurrenceDateTime?: string;
  occurrenceLocation?: Location;
  typeCode?: string;
  // ... more fields
}

// Extend ECMRData
export interface ECMRData {
  // ... existing fields
  dangerousGoods?: DangerousGoods[];
  deliveryEvent?: DeliveryEvent;
  transportMovement?: TransportMovement;
  riskAnalysis?: RiskAnalysis;
  associatedParties?: Party[];
  freightForwarder?: Party;
}
```

### 2. Parser Service Extensions

**File**: `portal-mock/src/app/core/services/ecmr-parser.service.ts`

Add parsing methods:
```typescript
parseDangerousGoods(element: Element | null): DangerousGoods | undefined {
  // Parse dangerous goods data
}

parseDeliveryEvent(element: Element | null): DeliveryEvent | undefined {
  // Parse delivery event data
}

// Update parseXML to include new data subsets
```

### 3. Component Updates

**File**: `portal-mock/src/app/pages/ecmr-display/ecmr-display.component.html`

Add new card sections:
```html
<!-- ADR / Dangerous Goods Card -->
<div class="card" *ngIf="ecmrData.dangerousGoods && ecmrData.dangerousGoods.length > 0">
  <div class="card-header">
    <h2>ADR / Opasna roba</h2>
    <span class="badge danger-badge">⚠️ ADR</span>
  </div>
  <div class="card-body">
    <!-- ADR content -->
  </div>
</div>

<!-- Delivery Events Card -->
<div class="card" *ngIf="ecmrData.deliveryEvent">
  <!-- Delivery event content -->
</div>
```

### 4. Styling Enhancements

**File**: `portal-mock/src/app/pages/ecmr-display/ecmr-display.component.css`

Add card-specific styles:
```css
.danger-badge {
  background: #fee2e2;
  color: #991b1b;
}

.card.collapsible {
  /* Collapsible card styles */
}

.card.expanded {
  /* Expanded state styles */
}
```

## UI/UX Considerations

### Visual Indicators

1. **Badges**: Use colored badges to indicate card types
   - ADR: Red/orange warning badge
   - Delivery: Blue info badge
   - Risk: Yellow warning badge

2. **Icons**: Add icons to card headers for quick recognition
   - ⚠️ for ADR
   - 📦 for Delivery
   - 🔒 for Risk Analysis
   - 👥 for Parties

3. **Collapsible Sections**: Allow users to expand/collapse detailed information

4. **Empty States**: Show helpful messages when data is not available

### Responsive Design

- Cards stack vertically on mobile
- Tables scroll horizontally if needed
- Touch-friendly expand/collapse controls

## Priority Recommendations

### High Priority (Implement First)
1. ✅ **ADR / Dangerous Goods Card** - Critical for dangerous goods transport
2. ✅ **Delivery Events Card** - Important for tracking and logistics

### Medium Priority
3. **Transport Movement Card** - Useful for transport details
4. **Risk Analysis Card** - Important for security/compliance

### Low Priority (Nice to Have)
5. **Associated Parties Card** - Additional context
6. **Freight Forwarder Card** - If frequently used
7. **Enhanced Service Charges Card** - More detailed financial info

## Benefits of This Approach

1. **Modularity**: Each card is independent and can be developed separately
2. **Maintainability**: Easy to add/remove cards without affecting others
3. **User Experience**: Users can focus on relevant sections
4. **Performance**: Conditional rendering means only present data is displayed
5. **Scalability**: Easy to add new data subsets in the future
6. **Consistency**: Reuses existing design patterns

## Next Steps

1. **Review & Approval**: Review this analysis with stakeholders
2. **Prioritize**: Decide which cards to implement first
3. **Design Mockups**: Create detailed UI mockups for selected cards
4. **Implementation**: Start with ADR card as Phase 1
5. **Testing**: Test with real XML data
6. **Iteration**: Gather feedback and refine

## Example XML Data Locations

For reference, here are key XML paths:

- **ADR**: `/consignment/dangerousGoods` or `/consignment/includedConsignmentItem/transportDangerousGoods`
- **Delivery**: `/consignment/deliveryEvent`
- **Transport**: `/consignment/mainCarriageTransportMovement`
- **Risk**: `/consignment/logisticsRiskAnalysisResult`
- **Parties**: `/consignment/associatedParty`
- **Forwarder**: `/consignment/freightForwarder`

## Conclusion

The card-based approach provides a clean, scalable solution for displaying multiple data subsets from `consignment-common.xml`. Starting with the ADR card addresses the most critical use case while establishing a pattern for future additions.

