# Data Subsets Display - Quick Reference

## Overview

This document provides a quick reference for displaying additional data subsets from `consignment-common.xml` beyond the current ECMR road transport display.

## Current Status

✅ **Currently Displayed**: ECMR road transport data (fields 1-28)
🆕 **To Be Added**: ADR, Delivery Events, Transport Movement, Risk Analysis, etc.

## Recommended Approach: Card-Based Display

### Architecture Pattern

```
┌─────────────────────────────────────┐
│  Component: ecmr-display             │
│  ├─ Parser: ecmr-parser.service      │
│  ├─ Model: ecmr.model.ts             │
│  └─ Template: ecmr-display.component │
│     .html                             │
└─────────────────────────────────────┘
```

### Implementation Pattern

1. **Extend Model** → Add interfaces to `ecmr.model.ts`
2. **Extend Parser** → Add parsing methods to `ecmr-parser.service.ts`
3. **Update Component** → Add card sections to template
4. **Add Styles** → Style new cards consistently

## Available Data Subsets

| Subset | XML Path | Priority | Status |
|--------|----------|----------|--------|
| **ADR / Dangerous Goods** | `/consignment/dangerousGoods` | 🔴 High | 📋 Planned |
| **Delivery Events** | `/consignment/deliveryEvent` | 🟡 Medium | 📋 Planned |
| **Transport Movement** | `/consignment/mainCarriageTransportMovement` | 🟡 Medium | 📋 Planned |
| **Risk Analysis** | `/consignment/logisticsRiskAnalysisResult` | 🟡 Medium | 📋 Planned |
| **Associated Parties** | `/consignment/associatedParty` | 🟢 Low | 📋 Planned |
| **Freight Forwarder** | `/consignment/freightForwarder` | 🟢 Low | 📋 Planned |

## Key XML Elements Reference

### ADR / Dangerous Goods
```xml
<dangerousGoods>
  <uNDGID>UN1202</uNDGID>
  <properShippingName>Gasoline</properShippingName>
  <hazardClassificationID>3</hazardClassificationID>
  <controlTemperature>...</controlTemperature>
  <dangerousGoodsLogisticsPackage>...</dangerousGoodsLogisticsPackage>
</dangerousGoods>
```

### Delivery Event
```xml
<deliveryEvent>
  <actualOccurrenceDateTime formatId="205">202401010000</actualOccurrenceDateTime>
  <occurrenceLocation>...</occurrenceLocation>
  <typeCode>...</typeCode>
</deliveryEvent>
```

### Transport Movement
```xml
<mainCarriageTransportMovement>
  <modeCode>3</modeCode>
  <dangerousGoodsIndicator>true</dangerousGoodsIndicator>
  <usedTransportMeans>...</usedTransportMeans>
</mainCarriageTransportMovement>
```

## Implementation Checklist

### Phase 1: ADR Card
- [ ] Extend `ECMRData` model with `DangerousGoods` interface
- [ ] Add `parseDangerousGoods()` method to parser service
- [ ] Update `parseXML()` to extract dangerous goods data
- [ ] Add ADR card section to component template
- [ ] Add ADR-specific CSS styles
- [ ] Test with XML containing dangerous goods data

### Phase 2: Delivery Events Card
- [ ] Extend model with `DeliveryEvent` interface
- [ ] Add parsing method
- [ ] Add card template
- [ ] Add styles
- [ ] Test

### Phase 3: Additional Cards
- [ ] Implement remaining cards based on priority
- [ ] Gather user feedback
- [ ] Refine implementation

## File Locations

### Core Files
- **Model**: `portal-mock/src/app/core/models/ecmr.model.ts`
- **Parser**: `portal-mock/src/app/core/services/ecmr-parser.service.ts`
- **Component**: `portal-mock/src/app/pages/ecmr-display/ecmr-display.component.ts`
- **Template**: `portal-mock/src/app/pages/ecmr-display/ecmr-display.component.html`
- **Styles**: `portal-mock/src/app/pages/ecmr-display/ecmr-display.component.css`

### Documentation
- **Analysis**: `DATA_SUBSETS_DISPLAY_ANALYSIS.md`
- **ADR Example**: `ADR_CARD_IMPLEMENTATION_EXAMPLE.md`
- **This File**: `DATA_SUBSETS_QUICK_REFERENCE.md`

## Design Principles

1. **Conditional Display**: Only show cards when data is present
2. **Consistent Styling**: Reuse existing card design patterns
3. **Visual Hierarchy**: Use badges and icons for quick recognition
4. **Responsive**: Ensure mobile-friendly layout
5. **Accessible**: Maintain semantic HTML and ARIA labels

## CSS Variables (Reusable)

```css
--ink: #1f2937;
--muted: #6b7280;
--line: #e5e7eb;
--paper: #ffffff;
--bg: #f9fafb;
--accent: #2563eb;
--accent-light: rgba(37, 99, 235, 0.1);
--border-radius: 12px;
```

## Badge Colors by Card Type

- **ADR**: Red (`#fee2e2` background, `#991b1b` text)
- **Delivery**: Blue (`#dbeafe` background, `#1e40af` text)
- **Risk**: Yellow (`#fef3c7` background, `#92400e` text)
- **Transport**: Green (`#d1fae5` background, `#065f46` text)

## Next Steps

1. ✅ Review analysis documents
2. ✅ Decide on implementation priority
3. ⏭️ Start with ADR card (Phase 1)
4. ⏭️ Test and iterate
5. ⏭️ Implement additional cards

## Questions to Consider

- Which data subsets are most important for your users?
- Should cards be collapsible/expandable?
- Do you need print-friendly versions?
- Should there be filtering/search within cards?
- How should multiple instances be displayed (e.g., multiple dangerous goods)?

## Support

For detailed implementation guidance, see:
- `DATA_SUBSETS_DISPLAY_ANALYSIS.md` - Full analysis and recommendations
- `ADR_CARD_IMPLEMENTATION_EXAMPLE.md` - Complete ADR card implementation example

