# ADR Card Implementation Example

This document provides a concrete implementation example for adding an ADR (Dangerous Goods) card to the ECMR display component.

## Visual Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ADR / Opasna roba                                    [⚠️ ADR] [Badge]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ Osnovni podaci ───────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  UN Broj:                    UN1202                             │   │
│  │  Naziv za prijevoz:          Benzin                             │   │
│  │  Tehnički naziv:             Gasoline                           │   │
│  │  Klasifikacija opasnosti:    3                                  │   │
│  │  Kategorija opasnosti:       Flammable Liquid                  │   │
│  │  Tip opasnosti:              FL                                 │   │
│  │  Grupa pakiranja:            II                                 │   │
│  │  Ograničena količina:        LQ                                │   │
│  │  Tunel ograničenje:          E                                  │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Temperaturne specifikacije ──────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Kontrolna temperatura:      -10°C                              │   │
│  │  Hitna temperatura:          -20°C                              │   │
│  │  Talište:                    50°C                                │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Mase i volumen ────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Bruto masa:                  500 kg                           │   │
│  │  Neto masa:                   450 kg                           │   │
│  │  Volumen:                      200 L                            │   │
│  │  Gustoća:                      0.75 kg/L                        │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Pakiranje ────────────────────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  Tip pakiranja:               Drums                             │   │
│  │  Količina:                    10 kom                           │   │
│  │  Razina opasnosti pakiranja:  II                                │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─ Radioaktivni materijal ───────────────────────────────────────┐   │
│  │                                                                 │   │
│  │  [Podaci o radioaktivnom materijalu ako je primjenjivo]          │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Dodatne informacije:                                                  │
│  "Handle with care. Keep away from heat and open flames."              │
│                                                                         │
│  [Prikaži sve detalje] [Expand/Collapse]                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Extend the Model

**File**: `portal-mock/src/app/core/models/ecmr.model.ts`

```typescript
// Add to existing file

export interface TemperatureRequirement {
  value?: string;
  unit?: string;
  typeCode?: string;
}

export interface DangerousGoodsPackage {
  typeCode?: string;
  typeText?: string;
  itemQuantity?: string;
  information?: string;
  shippingMarks?: string[];
}

export interface RadioactiveMaterial {
  specialFormInformation?: string;
  transportIndexCode?: string;
  fissileCriticalitySafetyIndex?: string;
  isotopes?: Array<{
    name?: string;
    activityLevel?: string;
    activityLevelUnit?: string;
  }>;
}

export interface DangerousGoods {
  // Basic identification
  unNumber?: string; // uNDGID
  properShippingName?: string;
  technicalName?: string;
  hazardClassificationID?: string;
  hazardCategoryCode?: string;
  hazardTypeCode?: string;
  packagingDangerLevelCode?: string;
  limitedQuantityCode?: string;
  tunnelRestrictionCode?: string;
  
  // Temperature requirements
  controlTemperature?: TemperatureRequirement;
  emergencyTemperature?: TemperatureRequirement;
  meltingPointTemperature?: {
    value?: string;
    unit?: string;
  };
  
  // Weights and volumes
  grossWeight?: string;
  grossWeightUnit?: string;
  netWeight?: string;
  netWeightUnit?: string;
  grossVolume?: string;
  grossVolumeUnit?: string;
  explosiveCargoNetWeight?: string;
  explosiveCargoNetWeightUnit?: string;
  density?: string;
  densityUnit?: string;
  
  // Package information
  packages?: DangerousGoodsPackage[];
  
  // Radioactive material
  radioactiveMaterial?: RadioactiveMaterial;
  
  // Additional information
  information?: string;
  supplementaryInformation?: string;
  previousCargoInformation?: string;
  reportableQuantity?: string;
  specialProvisionID?: string;
  
  // Related documents
  relatedDocuments?: Array<{
    id?: string;
    typeCode?: string;
    subtypeCode?: string;
  }>;
}

// Extend ECMRData interface
export interface ECMRData {
  // ... existing fields ...
  
  // ADR / Dangerous Goods
  dangerousGoods?: DangerousGoods[]; // At consignment level
  // Note: Items can also have transportDangerousGoods
}
```

### Step 2: Extend the Parser Service

**File**: `portal-mock/src/app/core/services/ecmr-parser.service.ts`

Add these methods to the `ECMRParserService` class:

```typescript
/**
 * Parse dangerous goods data from XML element
 */
parseDangerousGoods(element: Element | null): DangerousGoods | undefined {
  if (!element) return undefined;
  
  const dangerousGoods: DangerousGoods = {};
  
  // Basic identification
  dangerousGoods.unNumber = getText(element, 'uNDGID');
  dangerousGoods.properShippingName = getText(element, 'properShippingName');
  dangerousGoods.technicalName = getText(element, 'technicalName');
  dangerousGoods.hazardClassificationID = getText(element, 'hazardClassificationID');
  dangerousGoods.hazardCategoryCode = getText(element, 'hazardCategoryCode');
  dangerousGoods.hazardTypeCode = getText(element, 'hazardTypeCode');
  dangerousGoods.packagingDangerLevelCode = getText(element, 'packagingDangerLevelCode');
  dangerousGoods.limitedQuantityCode = getText(element, 'limitedQuantityCode');
  dangerousGoods.tunnelRestrictionCode = getText(element, 'tunnelRestrictionCode');
  
  // Temperature requirements
  const controlTemp = getElement(element, 'controlTemperature');
  if (controlTemp) {
    dangerousGoods.controlTemperature = {
      value: getText(controlTemp, 'conditionMeasure'),
      unit: getAttribute(controlTemp, 'conditionMeasure', 'unitId'),
      typeCode: getText(controlTemp, 'typeCode')
    };
  }
  
  const emergencyTemp = getElement(element, 'emergencyTemperature');
  if (emergencyTemp) {
    dangerousGoods.emergencyTemperature = {
      value: getText(emergencyTemp, 'conditionMeasure'),
      unit: getAttribute(emergencyTemp, 'conditionMeasure', 'unitId'),
      typeCode: getText(emergencyTemp, 'typeCode')
    };
  }
  
  const meltingPoint = getElement(element, 'meltingPointTemperatureMeasure');
  if (meltingPoint) {
    dangerousGoods.meltingPointTemperature = {
      value: getText(element, 'meltingPointTemperatureMeasure'),
      unit: getAttribute(element, 'meltingPointTemperatureMeasure', 'unitId')
    };
  }
  
  // Weights and volumes
  dangerousGoods.grossWeight = getText(element, 'grossWeight');
  dangerousGoods.grossWeightUnit = getAttribute(element, 'grossWeight', 'unitId');
  dangerousGoods.netWeight = getText(element, 'netWeight');
  dangerousGoods.netWeightUnit = getAttribute(element, 'netWeight', 'unitId');
  dangerousGoods.grossVolume = getText(element, 'grossVolume');
  dangerousGoods.grossVolumeUnit = getAttribute(element, 'grossVolume', 'unitId');
  dangerousGoods.explosiveCargoNetWeight = getText(element, 'explosiveCargoNetWeight');
  dangerousGoods.explosiveCargoNetWeightUnit = getAttribute(element, 'explosiveCargoNetWeight', 'unitId');
  dangerousGoods.density = getText(element, 'densityMeasure');
  dangerousGoods.densityUnit = getAttribute(element, 'densityMeasure', 'unitId');
  
  // Package information
  const packages = getElements(element, 'dangerousGoodsLogisticsPackage');
  if (packages.length > 0) {
    dangerousGoods.packages = packages.map(pkg => ({
      typeCode: getText(pkg, 'typeCode'),
      typeText: getText(pkg, 'typeText'),
      itemQuantity: getText(pkg, 'itemQuantity'),
      information: getText(pkg, 'information'),
      shippingMarks: getElements(pkg, 'shippingMarks').map(mark => 
        getText(mark, 'markingText') || ''
      ).filter(m => m)
    }));
  }
  
  // Radioactive material
  const radioactive = getElement(element, 'radioactiveMaterial');
  if (radioactive) {
    dangerousGoods.radioactiveMaterial = {
      specialFormInformation: getText(radioactive, 'specialFormInformation'),
      transportIndexCode: getText(radioactive, 'radioactivePackageTransportIndexCode'),
      fissileCriticalitySafetyIndex: getText(radioactive, 'fissileCriticalitySafetyIndexNumber'),
      isotopes: getElements(radioactive, 'applicableRadioactiveIsotope').map(iso => ({
        name: getText(iso, 'name'),
        activityLevel: getText(iso, 'activityLevelMeasure'),
        activityLevelUnit: getAttribute(iso, 'activityLevelMeasure', 'unitId')
      }))
    };
  }
  
  // Additional information
  dangerousGoods.information = getText(element, 'information');
  dangerousGoods.supplementaryInformation = getText(element, 'supplementaryInformation');
  dangerousGoods.previousCargoInformation = getText(element, 'previousCargoInformation');
  dangerousGoods.reportableQuantity = getText(element, 'reportableQuantity');
  dangerousGoods.specialProvisionID = getText(element, 'specialProvisionID');
  
  // Related documents
  const relatedDocs = getElements(element, 'relatedDocument');
  if (relatedDocs.length > 0) {
    dangerousGoods.relatedDocuments = relatedDocs.map(doc => ({
      id: getText(doc, 'id'),
      typeCode: getText(doc, 'typeCode'),
      subtypeCode: getText(doc, 'subtypeCode')
    }));
  }
  
  // Only return if at least one field is populated
  if (dangerousGoods.unNumber || dangerousGoods.properShippingName) {
    return dangerousGoods;
  }
  
  return undefined;
}

// Update parseXML method to include dangerous goods parsing
// Add this in the parseXML method after parsing consignment items:

// Parse dangerous goods at consignment level
const dangerousGoodsElements = getElements(root, 'dangerousGoods');
if (dangerousGoodsElements.length > 0) {
  ecmr.dangerousGoods = dangerousGoodsElements
    .map(dg => this.parseDangerousGoods(dg))
    .filter((dg): dg is DangerousGoods => dg !== undefined);
}
```

### Step 3: Update Component Template

**File**: `portal-mock/src/app/pages/ecmr-display/ecmr-display.component.html`

Add the ADR card after the Vehicle & Tariff card:

```html
<!-- ADR / Dangerous Goods Card -->
<div class="card adr-card" *ngIf="ecmrData.dangerousGoods && ecmrData.dangerousGoods.length > 0">
  <div class="card-header">
    <h2>ADR / Opasna roba</h2>
    <span class="badge danger-badge">⚠️ ADR</span>
  </div>
  <div class="card-body">
    <div *ngFor="let dg of ecmrData.dangerousGoods; let i = index" class="dangerous-goods-item">
      <div class="dangerous-goods-header" *ngIf="ecmrData.dangerousGoods!.length > 1">
        <h3>Opasna roba #{{ i + 1 }}</h3>
      </div>
      
      <!-- Basic Information Section -->
      <div class="info-section">
        <h4 class="section-title">Osnovni podaci</h4>
        <div class="fields-grid">
          <div class="field-group" *ngIf="dg.unNumber">
            <div class="field-label">
              <span>UN Broj</span>
            </div>
            <div class="field-value">{{ dg.unNumber }}</div>
          </div>
          
          <div class="field-group" *ngIf="dg.properShippingName">
            <div class="field-label">
              <span>Naziv za prijevoz</span>
            </div>
            <div class="field-value">{{ dg.properShippingName }}</div>
          </div>
          
          <div class="field-group" *ngIf="dg.technicalName">
            <div class="field-label">
              <span>Tehnički naziv</span>
            </div>
            <div class="field-value">{{ dg.technicalName }}</div>
          </div>
          
          <div class="field-group" *ngIf="dg.hazardClassificationID">
            <div class="field-label">
              <span>Klasifikacija opasnosti</span>
            </div>
            <div class="field-value">{{ dg.hazardClassificationID }}</div>
          </div>
          
          <div class="field-group" *ngIf="dg.hazardCategoryCode">
            <div class="field-label">
              <span>Kategorija opasnosti</span>
            </div>
            <div class="field-value">{{ dg.hazardCategoryCode }}</div>
          </div>
          
          <div class="field-group" *ngIf="dg.hazardTypeCode">
            <div class="field-label">
              <span>Tip opasnosti</span>
            </div>
            <div class="field-value">{{ dg.hazardTypeCode }}</div>
          </div>
          
          <div class="field-group" *ngIf="dg.packagingDangerLevelCode">
            <div class="field-label">
              <span>Grupa pakiranja</span>
            </div>
            <div class="field-value">{{ dg.packagingDangerLevelCode }}</div>
          </div>
          
          <div class="field-group" *ngIf="dg.limitedQuantityCode">
            <div class="field-label">
              <span>Ograničena količina</span>
            </div>
            <div class="field-value">{{ dg.limitedQuantityCode }}</div>
          </div>
          
          <div class="field-group" *ngIf="dg.tunnelRestrictionCode">
            <div class="field-label">
              <span>Tunel ograničenje</span>
            </div>
            <div class="field-value">{{ dg.tunnelRestrictionCode }}</div>
          </div>
        </div>
      </div>
      
      <!-- Temperature Requirements Section -->
      <div class="info-section" *ngIf="dg.controlTemperature || dg.emergencyTemperature || dg.meltingPointTemperature">
        <h4 class="section-title">Temperaturne specifikacije</h4>
        <div class="fields-grid">
          <div class="field-group" *ngIf="dg.controlTemperature">
            <div class="field-label">
              <span>Kontrolna temperatura</span>
            </div>
            <div class="field-value">
              {{ dg.controlTemperature.value }}
              <ng-container *ngIf="dg.controlTemperature.unit"> {{ dg.controlTemperature.unit }}</ng-container>
              <ng-container *ngIf="dg.controlTemperature.typeCode"> ({{ dg.controlTemperature.typeCode }})</ng-container>
            </div>
          </div>
          
          <div class="field-group" *ngIf="dg.emergencyTemperature">
            <div class="field-label">
              <span>Hitna temperatura</span>
            </div>
            <div class="field-value">
              {{ dg.emergencyTemperature.value }}
              <ng-container *ngIf="dg.emergencyTemperature.unit"> {{ dg.emergencyTemperature.unit }}</ng-container>
              <ng-container *ngIf="dg.emergencyTemperature.typeCode"> ({{ dg.emergencyTemperature.typeCode }})</ng-container>
            </div>
          </div>
          
          <div class="field-group" *ngIf="dg.meltingPointTemperature">
            <div class="field-label">
              <span>Talište</span>
            </div>
            <div class="field-value">
              {{ dg.meltingPointTemperature.value }}
              <ng-container *ngIf="dg.meltingPointTemperature.unit"> {{ dg.meltingPointTemperature.unit }}</ng-container>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Weights and Volumes Section -->
      <div class="info-section" *ngIf="dg.grossWeight || dg.netWeight || dg.grossVolume || dg.density">
        <h4 class="section-title">Mase i volumen</h4>
        <div class="fields-grid">
          <div class="field-group" *ngIf="dg.grossWeight">
            <div class="field-label">
              <span>Bruto masa</span>
            </div>
            <div class="field-value">
              {{ dg.grossWeight }}
              <ng-container *ngIf="dg.grossWeightUnit"> {{ dg.grossWeightUnit }}</ng-container>
            </div>
          </div>
          
          <div class="field-group" *ngIf="dg.netWeight">
            <div class="field-label">
              <span>Neto masa</span>
            </div>
            <div class="field-value">
              {{ dg.netWeight }}
              <ng-container *ngIf="dg.netWeightUnit"> {{ dg.netWeightUnit }}</ng-container>
            </div>
          </div>
          
          <div class="field-group" *ngIf="dg.grossVolume">
            <div class="field-label">
              <span>Volumen</span>
            </div>
            <div class="field-value">
              {{ dg.grossVolume }}
              <ng-container *ngIf="dg.grossVolumeUnit"> {{ dg.grossVolumeUnit }}</ng-container>
            </div>
          </div>
          
          <div class="field-group" *ngIf="dg.density">
            <div class="field-label">
              <span>Gustoća</span>
            </div>
            <div class="field-value">
              {{ dg.density }}
              <ng-container *ngIf="dg.densityUnit"> {{ dg.densityUnit }}</ng-container>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Package Information Section -->
      <div class="info-section" *ngIf="dg.packages && dg.packages.length > 0">
        <h4 class="section-title">Pakiranje</h4>
        <div *ngFor="let pkg of dg.packages" class="package-item">
          <div class="fields-grid">
            <div class="field-group" *ngIf="pkg.typeCode || pkg.typeText">
              <div class="field-label">
                <span>Tip pakiranja</span>
              </div>
              <div class="field-value">{{ pkg.typeText || pkg.typeCode }}</div>
            </div>
            
            <div class="field-group" *ngIf="pkg.itemQuantity">
              <div class="field-label">
                <span>Količina</span>
              </div>
              <div class="field-value">{{ pkg.itemQuantity }} kom</div>
            </div>
            
            <div class="field-group full-width" *ngIf="pkg.information">
              <div class="field-label">
                <span>Informacije</span>
              </div>
              <div class="field-value">{{ pkg.information }}</div>
            </div>
            
            <div class="field-group full-width" *ngIf="pkg.shippingMarks && pkg.shippingMarks.length > 0">
              <div class="field-label">
                <span>Oznake</span>
              </div>
              <div class="field-value">
                <span *ngFor="let mark of pkg.shippingMarks" class="mark-badge">{{ mark }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Radioactive Material Section -->
      <div class="info-section" *ngIf="dg.radioactiveMaterial">
        <h4 class="section-title">Radioaktivni materijal</h4>
        <div class="fields-grid">
          <div class="field-group" *ngIf="dg.radioactiveMaterial.specialFormInformation">
            <div class="field-label">
              <span>Informacije o posebnom obliku</span>
            </div>
            <div class="field-value">{{ dg.radioactiveMaterial.specialFormInformation }}</div>
          </div>
          
          <div class="field-group" *ngIf="dg.radioactiveMaterial.transportIndexCode">
            <div class="field-label">
              <span>Transportni indeks</span>
            </div>
            <div class="field-value">{{ dg.radioactiveMaterial.transportIndexCode }}</div>
          </div>
          
          <div class="field-group" *ngIf="dg.radioactiveMaterial.fissileCriticalitySafetyIndex">
            <div class="field-label">
              <span>Indeks sigurnosti kritičnosti</span>
            </div>
            <div class="field-value">{{ dg.radioactiveMaterial.fissileCriticalitySafetyIndex }}</div>
          </div>
          
          <div class="field-group full-width" *ngIf="dg.radioactiveMaterial.isotopes && dg.radioactiveMaterial.isotopes.length > 0">
            <div class="field-label">
              <span>Izotopi</span>
            </div>
            <div class="field-value">
              <div *ngFor="let iso of dg.radioactiveMaterial.isotopes" class="isotope-item">
                <strong>{{ iso.name }}</strong>: {{ iso.activityLevel }}
                <ng-container *ngIf="iso.activityLevelUnit"> {{ iso.activityLevelUnit }}</ng-container>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Additional Information -->
      <div class="info-section" *ngIf="dg.information || dg.supplementaryInformation || dg.previousCargoInformation">
        <h4 class="section-title">Dodatne informacije</h4>
        <div class="fields-grid">
          <div class="field-group full-width" *ngIf="dg.information">
            <div class="field-label">
              <span>Informacije</span>
            </div>
            <div class="field-value">{{ dg.information }}</div>
          </div>
          
          <div class="field-group full-width" *ngIf="dg.supplementaryInformation">
            <div class="field-label">
              <span>Dopunske informacije</span>
            </div>
            <div class="field-value">{{ dg.supplementaryInformation }}</div>
          </div>
          
          <div class="field-group full-width" *ngIf="dg.previousCargoInformation">
            <div class="field-label">
              <span>Informacije o prethodnom teretu</span>
            </div>
            <div class="field-value">{{ dg.previousCargoInformation }}</div>
          </div>
        </div>
      </div>
      
      <!-- Related Documents -->
      <div class="info-section" *ngIf="dg.relatedDocuments && dg.relatedDocuments.length > 0">
        <h4 class="section-title">Povezani dokumenti</h4>
        <div class="document-list">
          <div *ngFor="let doc of dg.relatedDocuments" class="document-item">
            <strong>{{ doc.id }}</strong>
            <ng-container *ngIf="doc.typeCode"> ({{ doc.typeCode }})</ng-container>
            <ng-container *ngIf="doc.subtypeCode"> - {{ doc.subtypeCode }}</ng-container>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### Step 4: Add CSS Styles

**File**: `portal-mock/src/app/pages/ecmr-display/ecmr-display.component.css`

Add these styles:

```css
/* ADR Card Specific Styles */
.adr-card {
  border-left: 4px solid #dc2626; /* Red accent for danger */
}

.danger-badge {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
  font-weight: 700;
}

.dangerous-goods-item {
  padding: 20px 0;
  border-bottom: 2px solid var(--line);
}

.dangerous-goods-item:last-child {
  border-bottom: none;
}

.dangerous-goods-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
}

.dangerous-goods-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}

.info-section {
  margin-bottom: 24px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--line);
}

.package-item {
  padding: 16px;
  background: var(--bg);
  border-radius: 8px;
  margin-bottom: 12px;
}

.package-item:last-child {
  margin-bottom: 0;
}

.mark-badge {
  display: inline-block;
  padding: 4px 8px;
  margin: 2px 4px 2px 0;
  background: var(--accent-light);
  color: var(--accent);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.isotope-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
}

.isotope-item:last-child {
  border-bottom: none;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.document-item {
  padding: 12px;
  background: var(--bg);
  border-radius: 8px;
  border-left: 3px solid var(--accent);
}
```

## Testing

To test the implementation:

1. Use XML data that contains `<dangerousGoods>` elements
2. Verify that the card appears when dangerous goods data is present
3. Check that all fields are displayed correctly
4. Test with multiple dangerous goods items
5. Verify responsive design on mobile devices

## Next Steps

After implementing the ADR card:

1. Test with real XML data
2. Gather user feedback
3. Refine the UI based on feedback
4. Implement additional cards (Delivery Events, etc.) using the same pattern

