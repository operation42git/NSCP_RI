# Comprehensive Data Display Strategy for consignment-common.xml

## Executive Summary

This document proposes a **collapsible card-based UI** that displays all possible data from `consignment-common.xsd` without overwhelming users. The design prioritizes the main ECMR view while providing easy access to additional data through organized, collapsible sections.

## Design Philosophy

### Core Principles

1. **Progressive Disclosure**: Show essential ECMR data first, hide advanced data by default
2. **Logical Grouping**: Organize data into semantically meaningful categories
3. **Visual Hierarchy**: Use visual cues to indicate importance and data availability
4. **Conditional Display**: Only show cards/sections when data exists
5. **Search & Filter**: Allow users to quickly find specific data

## Data Categories Analysis

Based on the `consignment-common.xml` example, here are all data categories:

### Tier 1: Primary ECMR Data (Always Visible)
**Current Implementation** - These are the main fields users need:

1. **Header Information**
   - eCMR ID, Issue Date, Issue Location

2. **Basic Information** (Fields 1-5, 16-18)
   - Consignor, Consignee, Carrier
   - Delivery Address
   - Carrier Acceptance Location/DateTime
   - Annexed Documents

3. **Goods** (Fields 6-12)
   - Consignment Items Table
   - Marks, Packages, Description, Weight, Volume

4. **Instructions & Payment** (Fields 13-21)
   - Special Instructions
   - COD Amount
   - Payment Instructions
   - Paying Party
   - Special Agreements

5. **Signatures** (Fields 22-24)
   - Sender, Carrier, Consignee signatures

6. **Vehicle & Tariff** (Fields 25-28)
   - Vehicle/Trailer Numbers
   - Vehicle Model
   - Tariffs

### Tier 2: Extended Transport Data (Collapsible)
**Show summary, expand for details**

7. **Transport Movement** (`mainCarriageTransportMovement`)
   - Mode Code
   - Dangerous Goods Indicator
   - Used Transport Means (Vehicle details)
   - Arrival Events
   - Departure Events
   - Border Crossing Events
   - Call Events
   - Itinerary Route

8. **Transport Equipment** (`usedTransportEquipment`)
   - Equipment IDs
   - Category Codes
   - Registration Country
   - Sequence Numbers
   - Carried Transport Equipment
   - Affixed Seals
   - Loaded Dangerous Goods
   - Gross/Net Weights & Volumes
   - Stowage Positions

### Tier 3: Dangerous Goods & Safety (Collapsible)
**Critical but specialized data**

9. **ADR / Dangerous Goods** (`dangerousGoods` at consignment level)
   - UN Number, Proper Shipping Name
   - Hazard Classification
   - Temperature Requirements
   - Package Information
   - Radioactive Material
   - Related Documents

10. **Item-Level Dangerous Goods** (`transportDangerousGoods` in items)
    - Same structure as consignment-level ADR
    - Per-item dangerous goods details

### Tier 4: Events & Logistics (Collapsible)
**Timeline and event tracking**

11. **Delivery Events** (`deliveryEvent`)
    - Actual/Estimated/Requested/Scheduled DateTime
    - Occurrence Location
    - Certifying Party
    - Additional Security Measures
    - Related Observations
    - Scheduled Occurrence Period

12. **Transport Events** (in `mainCarriageTransportMovement`)
    - Arrival Events
    - Departure Events
    - Border Crossing Events
    - Call Events

### Tier 5: Parties & Contacts (Collapsible)
**Extended party information**

13. **Associated Parties** (`associatedParty`)
    - Multiple parties with roles
    - Contact Details
    - Licenses
    - Tax Registration
    - Agreements

14. **Freight Forwarder** (`freightForwarder`)
    - Forwarder details
    - Contact information
    - Licenses

15. **Extended Party Details** (in consignor/consignee/carrier)
    - Agreed Contracts
    - Applicable Licenses
    - Authoritative Signatory Person
    - Confirmed Document Authentication
    - Defined Contact Details
    - Owned Creditor Financial Account
    - Representative Person
    - Specified Contact Person
    - Tax Registration

### Tier 6: Financial & Commercial (Collapsible)
**Financial details**

16. **Service Charges** (`applicableServiceCharge`)
    - Applied Amount
    - Calculation Basis Code
    - Calculation Basis Price
    - Paying Party Role Code
    - Payment Arrangement Code

17. **Financial Information**
    - COD Amount (`cODAmount`)
    - Declared Value for Carriage (`declaredValueForCarriageAmount`)
    - Cargo Insurance Instructions (`cargoInsuranceInstructions`)

### Tier 7: Documents & References (Collapsible)
**Document management**

18. **Associated Documents** (`associatedDocument`)
    - Document IDs, Types, Subtypes
    - Attached Binary Files
    - Attached Binary Objects
    - Issue Location
    - Issuer
    - Reference Type Code
    - URI

19. **Related Documents** (in dangerous goods, etc.)
    - Referenced Documents
    - Contractual Clauses

### Tier 8: Risk & Security (Collapsible)
**Security and compliance**

20. **Risk Analysis** (`logisticsRiskAnalysisResult`)
    - Risk Level Code
    - Consignment Risk Related Code
    - Screening Method Code
    - Security Exemption Code
    - Description
    - Information Text

21. **Security Measures**
    - Additional Security Measures (in events)
    - Seals (`affixedSeal`)

### Tier 9: Additional Information (Collapsible)
**Miscellaneous data**

22. **General Information**
    - Information (`information`)
    - Delivery Information (`deliveryInformation`)
    - Consignor Provided Information Text (`consignorProvidedInformationText`)
    - Contract Terms Text (`contractTermsText`)

23. **Border Clearance**
    - Consignor Provided Border Clearance Instructions (`consignorProvidedBorderClearanceInstructions`)

24. **Locations** (Extended)
    - Carrier Acceptance Location
    - Consignee Receipt Location
    - Issue Locations (in documents)
    - Occurrence Locations (in events)
    - Geographical Coordinates

25. **Consignment Items** (Extended details)
    - Dimensions
    - Associated Transport Equipment
    - Transport Dangerous Goods (per item)
    - Gross/Net Volume & Weight Measures

## Proposed UI Structure

### Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│  [PRIMARY ECMR CARDS - Always Expanded]                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Header Card                                       │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Basic Information Card                            │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Goods Card                                        │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Instructions & Payment Card                      │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Signatures Card                                  │ │
│  └───────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Vehicle & Tariff Card                            │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  [EXTENDED DATA SECTION - Collapsed by Default]        │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ▼ Additional Data                    [Show All]  │ │
│  │   ┌───────────────────────────────────────────┐ │ │
│  │   │ [7] Transport Movement        [Expand]    │ │ │
│  │   │ [8] Transport Equipment        [Expand]   │ │ │
│  │   │ [9] ADR / Dangerous Goods      [Expand]   │ │ │
│  │   │ [10] Item-Level ADR             [Expand]  │ │ │
│  │   │ [11] Delivery Events            [Expand]  │ │ │
│  │   │ [12] Transport Events           [Expand]  │ │ │
│  │   │ [13] Associated Parties         [Expand]  │ │ │
│  │   │ [14] Freight Forwarder          [Expand]  │ │ │
│  │   │ [15] Extended Party Details     [Expand]  │ │ │
│  │   │ [16] Service Charges            [Expand]  │ │ │
│  │   │ [17] Financial Information      [Expand]  │ │ │
│  │   │ [18] Associated Documents       [Expand]  │ │ │
│  │   │ [19] Related Documents          [Expand]  │ │ │
│  │   │ [20] Risk Analysis              [Expand]  │ │ │
│  │   │ [21] Security Measures          [Expand]  │ │ │
│  │   │ [22] General Information        [Expand]  │ │ │
│  │   │ [23] Border Clearance          [Expand]  │ │ │
│  │   │ [24] Extended Locations         [Expand]  │ │ │
│  │   │ [25] Extended Item Details      [Expand]  │ │ │
│  │   └───────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Implementation Strategy

### 1. Collapsible Section Container

Create a master "Additional Data" section that:
- Shows a summary of available data categories
- Displays count badges for each category (e.g., "3 documents", "2 parties")
- Allows expanding individual cards or "Expand All"
- Remembers user preferences (localStorage)

### 2. Card States

Each extended data card has three states:

**Collapsed (Default)**
```
┌─────────────────────────────────────────┐
│ Transport Movement          [▶ Expand] │
│ Summary: Mode 3, Vehicle ABC-123       │
│ 2 events available                     │
└─────────────────────────────────────────┘
```

**Expanded**
```
┌─────────────────────────────────────────┐
│ Transport Movement          [▼ Collapse]│
├─────────────────────────────────────────┤
│ [Full card content]                    │
└─────────────────────────────────────────┘
```

**Empty/Hidden**
- Card doesn't appear if no data exists

### 3. Summary Indicators

Each collapsible card shows:
- **Icon** - Visual identifier
- **Title** - Category name
- **Summary** - Key data points (when collapsed)
- **Badge** - Count of items (e.g., "3 documents")
- **Indicator** - Visual cue if data is critical (e.g., ADR warning)

### 4. Search & Filter

Add a search bar in the extended data section:
- Filter cards by name
- Highlight matching content
- Show only cards with data matching search

## Component Structure

### Angular Component Architecture

```typescript
interface ExtendedDataCard {
  id: string;
  title: string;
  icon: string;
  category: string;
  priority: number;
  collapsed: boolean;
  hasData: boolean;
  dataCount?: number;
  summary?: string;
  critical?: boolean; // For ADR, Risk Analysis, etc.
}

@Component({
  selector: 'app-extended-data-section',
  template: `
    <div class="extended-data-section">
      <div class="section-header">
        <h2>Additional Data</h2>
        <button (click)="toggleAll()">
          {{ allExpanded ? 'Collapse All' : 'Expand All' }}
        </button>
        <input type="search" [(ngModel)]="searchFilter" 
               placeholder="Search additional data...">
      </div>
      
      <div class="cards-container">
        <app-extended-data-card
          *ngFor="let card of filteredCards"
          [card]="card"
          [data]="getCardData(card.id)"
          (toggle)="toggleCard(card.id)">
        </app-extended-data-card>
      </div>
    </div>
  `
})
```

## Card Grouping Strategy

### Group 1: Transport & Movement
- Transport Movement
- Transport Equipment
- Transport Events

### Group 2: Safety & Compliance
- ADR / Dangerous Goods
- Item-Level ADR
- Risk Analysis
- Security Measures

### Group 3: Events & Timeline
- Delivery Events
- Transport Events

### Group 4: Parties & Contacts
- Associated Parties
- Freight Forwarder
- Extended Party Details

### Group 5: Financial & Commercial
- Service Charges
- Financial Information

### Group 6: Documents & References
- Associated Documents
- Related Documents

### Group 7: Additional Information
- General Information
- Border Clearance
- Extended Locations
- Extended Item Details

## Visual Design Guidelines

### Color Coding

- **Primary ECMR Cards**: Standard white cards with blue accents
- **Critical Data** (ADR, Risk): Red/orange accent border
- **Important Data** (Events, Parties): Blue accent border
- **Informational Data**: Gray accent border

### Icons

- 🚛 Transport Movement
- 📦 Transport Equipment
- ⚠️ ADR / Dangerous Goods
- 📅 Events
- 👥 Parties
- 💰 Financial
- 📄 Documents
- 🔒 Security/Risk
- ℹ️ Information

### Badges

- Count badges: `[3]` for number of items
- Status badges: `[Critical]`, `[Important]`
- Empty state: `[No data]` or hide card

## User Experience Flow

### Default View
1. User sees primary ECMR cards (always visible)
2. Below that, a collapsed "Additional Data" section
3. Section shows summary of available data categories
4. User can expand individual cards or expand all

### Expanded View
1. User expands "Additional Data" section
2. Cards show in logical groups
3. Each card can be individually expanded/collapsed
4. Search helps find specific data quickly

### Smart Defaults
- Remember which cards user expanded (localStorage)
- Auto-expand critical cards (ADR if dangerous goods present)
- Show summary even when collapsed

## Implementation Phases

### Phase 1: Infrastructure
- Create extended data section component
- Implement collapsible card component
- Add data detection logic (check what exists in XML)

### Phase 2: Core Extended Cards
- Transport Movement
- Transport Equipment
- ADR / Dangerous Goods
- Delivery Events

### Phase 3: Additional Cards
- Parties & Contacts
- Financial & Commercial
- Documents & References

### Phase 4: Advanced Features
- Search & Filter
- User preferences
- Export functionality
- Print-friendly view

## Benefits of This Approach

1. **Non-Overwhelming**: Users see only what they need by default
2. **Comprehensive**: All data is accessible when needed
3. **Scalable**: Easy to add new data categories
4. **Flexible**: Works with any dataset (shows only what exists)
5. **User-Friendly**: Progressive disclosure reduces cognitive load
6. **Maintainable**: Clear separation between primary and extended data

## Example: Collapsed Card Display

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ ADR / Dangerous Goods                    [▶ Expand]  │
│ UN1202 - Gasoline, 3 items, Critical                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 📅 Delivery Events                          [▶ Expand]  │
│ Scheduled: 2024-01-15, Actual: 2024-01-15 14:30        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 👥 Associated Parties                       [▶ Expand]  │
│ 2 parties available                                      │
└─────────────────────────────────────────────────────────┘
```

## Example: Expanded Card Display

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ ADR / Dangerous Goods                    [▼ Collapse]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  UN Number: UN1202                                      │
│  Proper Shipping Name: Gasoline                         │
│  ... [full ADR card content]                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Conclusion

This collapsible card-based approach provides:
- **Clean default view** with essential ECMR data
- **Comprehensive access** to all possible data
- **Flexible display** that adapts to available data
- **User control** over what to view
- **Scalable architecture** for future additions

The design balances usability with completeness, ensuring users aren't overwhelmed while still having access to all data when needed.

