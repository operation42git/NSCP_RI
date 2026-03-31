export interface PostalAddress {
  buildingNumber?: string;
  streetName?: string;
  postcode?: string;
  cityName?: string;
  countrySubDivisionName?: string;
  countryCode?: string;
}

export interface Party {
  name?: string;
  postalAddress?: PostalAddress;
}

export interface Location {
  name?: string;
  postalAddress?: PostalAddress;
}

export interface ConsignmentItem {
  marksAndNumbers?: string;
  numberOfPackages?: string;
  packingDescription?: string;
  natureOfGoods?: string;
  statisticNumber?: string;
  grossWeight?: string;
  grossWeightUnit?: string;
  volume?: string;
  volumeUnit?: string;
}

export interface ServiceCharge {
  appliedAmount?: string;
  currency?: string;
  calculationBasisCode?: string;
}

export interface ECMRData {
  // Header fields
  ecmrId?: string;
  issueDate?: string;
  issueLocation?: string;
  
  // Field 1: Consignor
  consignor?: Party;
  
  // Field 2: Consignee
  consignee?: Party;
  
  // Field 3: Delivery address
  deliveryAddress?: Location;
  
  // Field 4: Carrier acceptance
  carrierAcceptanceDateTime?: string;
  carrierAcceptanceLocation?: Location;
  
  // Field 5: Annexed documents
  annexedDocuments?: string[];
  
  // Field 6-12: Goods table
  consignmentItems: ConsignmentItem[];
  
  // Totals
  totalGrossWeight?: string;
  totalGrossWeightUnit?: string;
  totalVolume?: string;
  totalVolumeUnit?: string;
  
  // Field 13: Special instructions (sender's instructions for customs and formalities)
  specialInstructions?: string;
  
  // Field 14: COD amount
  codAmount?: string;
  codCurrency?: string;
  
  // Field 15: Payment instructions for freight
  paymentInstructions?: string[];
  
  // Field 16: Carrier
  carrier?: Party;
  
  // Field 17: Following carrier
  followingCarrier?: Party;
  
  // Field 18: Carrier reservations
  carrierReservations?: string;
  
  // Field 19: Paying party
  payingParty?: string[];
  
  // Field 20: Special agreements
  specialAgreements?: string;
  
  // Field 21: Date and place of issue
  issueDateAndPlace?: string;
  
  // Field 22: Sender's signature
  senderSignature?: string;
  
  // Field 23: Carrier's signature
  carrierSignature?: string;
  
  // Field 24: Consignee's signature (goods received)
  consigneeSignature?: string;
  
  // Field 25: Vehicle and trailer numbers
  vehicleNumber?: string;
  trailerNumber?: string;
  
  // Field 26: Vehicle and trailer model
  vehicleModel?: string;
  
  // Field 27: Tariff
  tariff27?: string;
  
  // Field 28: Tariffs
  tariffs?: ServiceCharge[];

  // ADR / Dangerous Goods Data
  adrData?: ADRData;
}

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
  supplementaryInformation?: string;
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
  information?: string;
  radioactiveMaterial?: {
    activityLevelMeasure?: string;
    activityLevelUnit?: string;
    isotopeName?: string;
    fissileCriticalitySafetyIndexNumber?: string;
    radioactivePackageTransportIndexCode?: string;
    specialFormInformation?: string;
  };
}

export interface ADRData {
  freightForwarder?: Party;
  adrItems: ADRItem[];
}

