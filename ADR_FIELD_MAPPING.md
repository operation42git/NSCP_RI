# ADR Section Field Mapping Rules

## Overview
This document provides the complete mapping between ADR display fields (Angular/React component) and XML fields from `consignment-common.xml`.

**Data Sources:**
- Consignment level: `consignment/dangerousGoods`
- Item level: `consignment/includedConsignmentItem/transportDangerousGoods`

---

## Field Mappings

### Basic Information Fields

| Display Field (Croatian) | Display Field (English) | TypeScript Property | XML Path (Consignment Level) | XML Path (Item Level) |
|--------------------------|-------------------------|---------------------|----------------------------|----------------------|
| Oznake za otpremu | Shipping Marks | `shippingMarks` | `consignment/dangerousGoods/dangerousGoodsLogisticsPackage/shippingMarks/markingText` | `consignment/includedConsignmentItem/transportDangerousGoods/dangerousGoodsLogisticsPackage/shippingMarks/markingText` |
| Pravilno naziv za otpremu | Proper Shipping Name | `properShippingName` | `consignment/dangerousGoods/properShippingName` | `consignment/includedConsignmentItem/transportDangerousGoods/properShippingName` |
| UN broj | UN No | `unNumber` | `consignment/dangerousGoods/uNDGID` | `consignment/includedConsignmentItem/transportDangerousGoods/uNDGID` |

### Hazard Classification Fields

| Display Field (Croatian) | Display Field (English) | TypeScript Property | XML Path (Consignment Level) | XML Path (Item Level) |
|--------------------------|-------------------------|---------------------|----------------------------|----------------------|
| ID klasifikacije opasnosti | Hazard Classification ID | `hazardClass` | `consignment/dangerousGoods/hazardClassificationID` | `consignment/includedConsignmentItem/transportDangerousGoods/hazardClassificationID` |
| Kod kategorije opasnosti | Hazard Category Code | `hazardCategoryCode` | `consignment/dangerousGoods/hazardCategoryCode` | `consignment/includedConsignmentItem/transportDangerousGoods/hazardCategoryCode` |
| Kod vrste opasnosti | Hazard Type Code | `hazardTypeCode` | `consignment/dangerousGoods/hazardTypeCode` | `consignment/includedConsignmentItem/transportDangerousGoods/hazardTypeCode` |

### Packaging & Restriction Fields

| Display Field (Croatian) | Display Field (English) | TypeScript Property | XML Path (Consignment Level) | XML Path (Item Level) |
|--------------------------|-------------------------|---------------------|----------------------------|----------------------|
| Kod razine opasnosti pakiranja | Packaging Danger Level Code | `packagingDangerLevelCode` | `consignment/dangerousGoods/packagingDangerLevelCode` | `consignment/includedConsignmentItem/transportDangerousGoods/packagingDangerLevelCode` |
| Kod ograničenja tunela | Tunnel Restriction Code | `tunnelRestrictionCode` | `consignment/dangerousGoods/tunnelRestrictionCode` | `consignment/includedConsignmentItem/transportDangerousGoods/tunnelRestrictionCode` |
| Kod ograničene količine | Limited Quantity Code | `limitedQuantityCode` | `consignment/dangerousGoods/limitedQuantityCode` | `consignment/includedConsignmentItem/transportDangerousGoods/limitedQuantityCode` |
| ID posebnih odredbi | Special Provision ID | `specialProvisionID` | `consignment/dangerousGoods/specialProvisionID` | `consignment/includedConsignmentItem/transportDangerousGoods/specialProvisionID` |

### Regulatory & Identification Fields

| Display Field (Croatian) | Display Field (English) | TypeScript Property | XML Path (Consignment Level) | XML Path (Item Level) |
|--------------------------|-------------------------|---------------------|----------------------------|----------------------|
| Prijavljiva količina | Reportable Quantity | `reportableQuantity` | `consignment/dangerousGoods/reportableQuantity` | `consignment/includedConsignmentItem/transportDangerousGoods/reportableQuantity` |
| Tehnički naziv | Technical Name | `technicalName` | `consignment/dangerousGoods/technicalName` | `consignment/includedConsignmentItem/transportDangerousGoods/technicalName` |
| Regulatorno tijelo | Regulatory Authority | `regulatoryAuthorityName` | `consignment/dangerousGoods/regulatoryAuthorityName` | `consignment/includedConsignmentItem/transportDangerousGoods/regulatoryAuthorityName` |

### Package & Quantity Fields

| Display Field (Croatian) | Display Field (English) | TypeScript Property | XML Path (Consignment Level) | XML Path (Item Level) |
|--------------------------|-------------------------|---------------------|----------------------------|----------------------|
| Broj paketa | Number of Packages | `numberOfPackages` | `consignment/dangerousGoods/dangerousGoodsLogisticsPackage/itemQuantity` | `consignment/includedConsignmentItem/goodsUnitQuantity` |
| Opis pakiranja | Packing Description | `packingDescription` | N/A (not available at consignment level) | `consignment/includedConsignmentItem/dimensions/description` |

### Weight & Volume Fields

| Display Field (Croatian) | Display Field (English) | TypeScript Property | XML Path (Consignment Level) | XML Path (Item Level) | Unit Attribute |
|--------------------------|-------------------------|---------------------|----------------------------|----------------------|----------------|
| Neto masa (kg) | Net wt (kg) | `netWeight` / `netWeightUnit` | `consignment/dangerousGoods/netWeight` + `@unitId` | `consignment/includedConsignmentItem/transportDangerousGoods/netWeight` + `@unitId` | `unitId` |
| Bruto masa (kg) | Gross weight (kg) | `grossWeight` / `grossWeightUnit` | `consignment/dangerousGoods/grossWeight` + `@unitId` | `consignment/includedConsignmentItem/transportDangerousGoods/grossWeight` + `@unitId` | `unitId` |
| Volumen (m³) | Cube (m³) | `volume` / `volumeUnit` | `consignment/dangerousGoods/grossVolume` + `@unitId` | `consignment/includedConsignmentItem/transportDangerousGoods/grossVolume` + `@unitId` | `unitId` |

### Physical Properties Fields

| Display Field (Croatian) | Display Field (English) | TypeScript Property | XML Path (Consignment Level) | XML Path (Item Level) | Unit Attribute |
|--------------------------|-------------------------|---------------------|----------------------------|----------------------|----------------|
| Gustoća | Density | `densityMeasure` / `densityMeasureUnit` | `consignment/dangerousGoods/densityMeasure` + `@unitId` | `consignment/includedConsignmentItem/transportDangerousGoods/densityMeasure` + `@unitId` | `unitId` |
| Talište | Melting Point | `meltingPointTemperatureMeasure` / `meltingPointTemperatureUnit` | `consignment/dangerousGoods/meltingPointTemperatureMeasure` + `@unitId` | `consignment/includedConsignmentItem/transportDangerousGoods/meltingPointTemperatureMeasure` + `@unitId` | `unitId` |
| Neto masa eksplozivnog tereta | Explosive Cargo Net Weight | `explosiveCargoNetWeight` / `explosiveCargoNetWeightUnit` | `consignment/dangerousGoods/explosiveCargoNetWeight` + `@unitId` | `consignment/includedConsignmentItem/transportDangerousGoods/explosiveCargoNetWeight` + `@unitId` | `unitId` |

### Temperature Fields

| Display Field (Croatian) | Display Field (English) | TypeScript Property | XML Path (Consignment Level) | XML Path (Item Level) | Notes |
|--------------------------|-------------------------|---------------------|----------------------------|----------------------|-------|
| Kontrolna temperatura | Control Temperature | `controlTemperature` | `consignment/dangerousGoods/controlTemperature/conditionMeasure` + `@unitId`<br>`consignment/dangerousGoods/controlTemperature/typeCode` | `consignment/includedConsignmentItem/transportDangerousGoods/controlTemperature/conditionMeasure` + `@unitId`<br>`consignment/includedConsignmentItem/transportDangerousGoods/controlTemperature/typeCode` | Combined: `value unit (type)` |
| Temperatura za hitne slučajeve | Emergency Temperature | `emergencyTemperature` | `consignment/dangerousGoods/emergencyTemperature/conditionMeasure` + `@unitId`<br>`consignment/dangerousGoods/emergencyTemperature/typeCode` | `consignment/includedConsignmentItem/transportDangerousGoods/emergencyTemperature/conditionMeasure` + `@unitId`<br>`consignment/includedConsignmentItem/transportDangerousGoods/emergencyTemperature/typeCode` | Combined: `value unit (type)` |

### Radioactive Material Fields

| Display Field (Croatian) | Display Field (English) | TypeScript Property | XML Path (Consignment Level) | XML Path (Item Level) | Unit Attribute |
|--------------------------|-------------------------|---------------------|----------------------------|----------------------|----------------|
| Izotop | Isotope | `radioactiveMaterial.isotopeName` | `consignment/dangerousGoods/radioactiveMaterial/applicableRadioactiveIsotope/name` | `consignment/includedConsignmentItem/transportDangerousGoods/radioactiveMaterial/applicableRadioactiveIsotope/name` | N/A |
| Razina aktivnosti | Activity Level | `radioactiveMaterial.activityLevelMeasure` / `radioactiveMaterial.activityLevelUnit` | `consignment/dangerousGoods/radioactiveMaterial/applicableRadioactiveIsotope/activityLevelMeasure` + `@unitId` | `consignment/includedConsignmentItem/transportDangerousGoods/radioactiveMaterial/applicableRadioactiveIsotope/activityLevelMeasure` + `@unitId` | `unitId` |
| Indeks sigurnosti fisijskog kritičnosti | Fissile Criticality Safety Index | `radioactiveMaterial.fissileCriticalitySafetyIndexNumber` | `consignment/dangerousGoods/radioactiveMaterial/fissileCriticalitySafetyIndexNumber` | `consignment/includedConsignmentItem/transportDangerousGoods/radioactiveMaterial/fissileCriticalitySafetyIndexNumber` | N/A |
| Kod transportnog indeksa | Transport Index Code | `radioactiveMaterial.radioactivePackageTransportIndexCode` | `consignment/dangerousGoods/radioactiveMaterial/radioactivePackageTransportIndexCode` | `consignment/includedConsignmentItem/transportDangerousGoods/radioactiveMaterial/radioactivePackageTransportIndexCode` | N/A |
| Poseban oblik | Special Form | `radioactiveMaterial.specialFormInformation` | `consignment/dangerousGoods/radioactiveMaterial/specialFormInformation` | `consignment/includedConsignmentItem/transportDangerousGoods/radioactiveMaterial/specialFormInformation` | N/A |

### Information Fields

| Display Field (Croatian) | Display Field (English) | TypeScript Property | XML Path (Consignment Level) | XML Path (Item Level) |
|--------------------------|-------------------------|---------------------|----------------------------|----------------------|
| Dopunske informacije | Supplementary Info | `supplementaryInformation` | `consignment/dangerousGoods/supplementaryInformation` | `consignment/includedConsignmentItem/transportDangerousGoods/supplementaryInformation` |
| Informacije | Information | `information` | `consignment/dangerousGoods/information` | `consignment/includedConsignmentItem/transportDangerousGoods/information` |

---

## Implementation Notes

### Data Parsing Logic

1. **Consignment Level First**: The parser first checks for `consignment/dangerousGoods` at the consignment level
2. **Item Level Fallback**: If not found at consignment level, it checks each `includedConsignmentItem` for `transportDangerousGoods`
3. **Multiple Items**: Multiple ADR items can exist (one per consignment item with dangerous goods)

### Field Display Rules

- **Always Visible**: All ADR fields are always displayed in the UI, regardless of data availability
- **Empty Display**: Fields without data show "—" (em dash)
- **Unit Handling**: Fields with units combine value + unit (e.g., "100 kg")
- **Temperature Format**: Temperature fields combine value + unit + type (e.g., "25 C (MAX)")

### Special Cases

1. **Shipping Marks**: Only available from `dangerousGoodsLogisticsPackage` (not directly on dangerousGoods)
2. **Number of Packages**: 
   - Consignment level: from `dangerousGoodsLogisticsPackage/itemQuantity`
   - Item level: from `goodsUnitQuantity` (on the item itself)
3. **Packing Description**: Only available at item level from `dimensions/description`
4. **Temperature Fields**: Require combining multiple XML elements (conditionMeasure, typeCode, unitId)

---

## TypeScript Interface Reference

```typescript
export interface ADRItem {
  shippingMarks?: string;
  properShippingName?: string;
  unNumber?: string;
  hazardClass?: string;
  hazardCategoryCode?: string;
  hazardTypeCode?: string;
  packagingDangerLevelCode?: string;
  tunnelRestrictionCode?: string;
  limitedQuantityCode?: string;
  specialProvisionID?: string;
  reportableQuantity?: string;
  technicalName?: string;
  regulatoryAuthorityName?: string;
  numberOfPackages?: string;
  packingDescription?: string;
  netWeight?: string;
  netWeightUnit?: string;
  grossWeight?: string;
  grossWeightUnit?: string;
  volume?: string;
  volumeUnit?: string;
  densityMeasure?: string;
  densityMeasureUnit?: string;
  meltingPointTemperatureMeasure?: string;
  meltingPointTemperatureUnit?: string;
  explosiveCargoNetWeight?: string;
  explosiveCargoNetWeightUnit?: string;
  controlTemperature?: string;
  emergencyTemperature?: string;
  radioactiveMaterial?: RadioactiveMaterial;
  supplementaryInformation?: string;
  information?: string;
}

export interface RadioactiveMaterial {
  isotopeName?: string;
  activityLevelMeasure?: string;
  activityLevelUnit?: string;
  fissileCriticalitySafetyIndexNumber?: string;
  radioactivePackageTransportIndexCode?: string;
  specialFormInformation?: string;
}
```

---

## Related Files

- **Parser Implementation**: `portal-mock/src/react-components/ECMRDisplay/ecmrParser.ts` (lines 385-640)
- **Type Definitions**: `portal-mock/src/react-components/ECMRDisplay/ecmrTypes.ts` (lines 119-170)
- **Display Component**: `portal-mock/src/react-components/ECMRDisplay/ECMRDisplay.tsx` (lines 506-1010)
- **Visualization**: `ADR_DISPLAY_VISUALIZATION.html`



