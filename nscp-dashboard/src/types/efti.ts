/**
 * Generic eFTI consignment data model.
 *
 * Mirrors the SupplyChainConsignment type from consignment-common.xsd
 * (namespace http://efti.eu/v1/consignment/common, version 0.8).
 *
 * Every property is optional — the XSD declares all children with minOccurs="0".
 * The interfaces use camelCase names matching the XML element local names so that
 * mapping between parsed XML and these types is trivial.
 */

// ─── Primitives ───

export interface PostalAddress {
  buildingNumber?: string;
  buildingName?: string;
  streetName?: string;
  postcode?: string;
  cityName?: string;
  countrySubDivisionName?: string;
  countryCode?: string;
  postOfficeBox?: string;
}

export interface FinancialAccount {
  id?: string;
  schemeAgencyId?: string;
}

export interface GeographicalCoordinate {
  latitude?: string;
  longitude?: string;
}

export interface TaxRegistration {
  id?: string;
  schemeAgencyId?: string;
}

export interface ContactPerson {
  givenName?: string;
  familyName?: string;
  telephoneNumber?: string;
  faxNumber?: string;
  emailAddress?: string;
}

export interface DocumentAuthentication {
  id?: string;
  schemeAgencyId?: string;
  name?: string;
  roleCode?: string;
  statementCode?: string;
}

// ─── Location ───

export interface LogisticsLocation {
  id?: string;
  schemeAgencyId?: string;
  name?: string;
  postalAddress?: PostalAddress;
  geographicalCoordinates?: GeographicalCoordinate;
}

// ─── Contracts & Licences ───

export interface AgreedContract {
  issueDateTime?: string;
  duration?: string;
  signingLocation?: string;
}

export interface ApplicableLicence {
  id?: string;
  schemeAgencyId?: string;
  typeCode?: string;
}

// ─── Parties ───

export interface TradeParty {
  name?: string;
  id?: string;
  schemeAgencyId?: string;
  roleCode?: string;
  departmentName?: string;
  postalAddress?: PostalAddress;
  taxRegistration?: TaxRegistration;
  specifiedContactPerson?: ContactPerson;
  confirmedDocumentAuthentication?: DocumentAuthentication[];
  financialAccount?: FinancialAccount;
  agreedContract?: AgreedContract;
  applicableLicence?: ApplicableLicence;
}

// ─── Documents ───

export interface BinaryFile {
  id?: string;
  uRI?: string;
  fileName?: string;
  mIMECode?: string;
  sizeMeasure?: string;
  encodingCode?: string;
}

export interface DocumentClause {
  id?: string;
  content?: string;
}

export interface ReferencedDocument {
  id?: string;
  schemeAgencyId?: string;
  typeCode?: string;
  uRI?: string;
  formattedIssueDateTime?: string;
  issueLocation?: LogisticsLocation;
  issuer?: TradeParty;
  attachedBinaryFile?: BinaryFile[];
  attachedBinaryObject?: string;
  contractualClause?: DocumentClause[];
  referenceTypeCode?: string;
}

// ─── Goods & Cargo ───

export interface NatureIdentificationCargo {
  identification?: string;
  operationalCategoryCode?: string;
  statisticalClassificationCode?: string;
}

export interface TransportPackage {
  itemQuantity?: string;
  packagingTypeCode?: string;
  packagingDescriptionText?: string;
  shippingMarks?: string;
}

export interface DangerousGoods {
  uNDGID?: string;
  properShippingName?: string;
  hazardClassificationID?: string;
  hazardCategoryCode?: string;
  hazardTypeCode?: string;
  packagingDangerLevelCode?: string;
  tunnelRestrictionCode?: string;
  limitedQuantityCode?: string;
  specialProvisionID?: string;
  reportableQuantity?: string;
  technicalName?: string;
  information?: string;
  supplementaryInformation?: string;
  regulatoryAuthorityName?: string;
  netWeight?: string;
  netWeightUnit?: string;
  grossWeight?: string;
  grossWeightUnit?: string;
  grossVolume?: string;
  grossVolumeUnit?: string;
  numberOfPackages?: string;
  packingDescription?: string;
  controlTemperature?: string;
  emergencyTemperature?: string;
  density?: string;
  meltingPoint?: string;
  hazardCode?: string;
  explosiveMass?: string;
  labelCode?: string;
  packagingTypeCode?: string;
}

export interface ConsignmentItem {
  sequenceNumber?: string;
  grossWeightMeasure?: string;
  grossWeightUnit?: string;
  grossVolumeMeasure?: string;
  grossVolumeUnit?: string;
  consignmentItemQuantity?: string;
  natureIdentificationTransportCargo?: NatureIdentificationCargo;
  statisticalClassificationCode?: string;
  transportLogisticsPackage?: TransportPackage;
  transportDangerousGoods?: DangerousGoods;
}

// ─── Transport ───

export interface TransportMeans {
  id?: string;
  schemeAgencyId?: string;
  registrationCountryCode?: string;
  equipmentDescriptionText?: string;
  typeCode?: string;
  ownerName?: string;
}

export interface TransportEvent {
  requestedOccurrenceDateTime?: string;
  plannedOccurrenceDateTime?: string;
  actualOccurrenceDateTime?: string;
  certifyingParty?: TradeParty;
  occurrenceLocation?: LogisticsLocation;
}

export interface MasterPerson {
  name?: string;
  id?: string;
  roleCode?: string;
}

export interface LogisticsTransportMovement {
  modeCode?: string;
  dangerousGoodsIndicator?: string;
  usedTransportMeans?: TransportMeans;
  masterResponsiblePerson?: MasterPerson;
  loadingEvent?: TransportEvent;
  unloadingEvent?: TransportEvent;
  sequenceNumber?: string;
}

export interface LogisticsSeal {
  id?: string;
  typeCode?: string;
  conditionCode?: string;
  issuingParty?: TradeParty;
}

export interface TransportEquipment {
  id?: string;
  schemeAgencyId?: string;
  categoryCode?: string;
  sequenceNumber?: string;
  registrationCountryCode?: string;
  equipmentDescriptionText?: string;
  affixedSeal?: LogisticsSeal[];
  grossWeight?: string;
  grossWeightUnit?: string;
}

// ─── Charges & Procedures ───

export interface ServiceCharge {
  paymentArrangementCode?: string;
  payingPartyRoleCode?: string;
  appliedAmount?: string;
  appliedAmountCurrency?: string;
  calculationBasisCode?: string;
}

export interface RegulatoryProcedure {
  typeCode?: string;
  description?: string;
}

export interface RiskAnalysisResult {
  typeCode?: string;
  description?: string;
}

export interface BorderClearanceInstructions {
  description?: string[];
}

// ─── Delivery & Route ───

export interface DeliveryTimeline {
  requestedDateTime?: string;
  plannedDateTime?: string;
  actualDateTime?: string;
  deliveryLocation?: LogisticsLocation;
}

export interface PlannedPeriod {
  startDateTime?: string;
  endDateTime?: string;
  duration?: string;
  maxDuration?: string;
}

export interface Observation {
  text?: string;
  subjectCode?: string;
}

export interface BorderCrossing {
  locationName?: string;
  dateTime?: string;
}

// ─── Root: SupplyChainConsignment ───

export interface EftiConsignment {
  /** Consignment / document type (UN/CEFACT typeCode on root consignment) */
  typeCode?: string;
  applicableServiceCharge?: ServiceCharge[];
  associatedDocument?: ReferencedDocument[];
  associatedParty?: TradeParty[];
  cODAmount?: string;
  cODAmountCurrency?: string;
  cargoInsuranceInstructions?: string[];
  carrier?: TradeParty;
  carrierAcceptanceDateTime?: string;
  carrierAcceptanceLocation?: LogisticsLocation;
  connectingCarrier?: TradeParty;
  consignee?: TradeParty;
  consigneeReceiptLocation?: LogisticsLocation;
  consignor?: TradeParty;
  consignorProvidedBorderClearanceInstructions?: BorderClearanceInstructions;
  consignorProvidedInformationText?: string[];
  contractTermsText?: string;
  dangerousGoods?: DangerousGoods;
  declaredValueForCarriageAmount?: string;
  deliveryEvent?: TransportEvent;
  deliveryInformation?: string;
  freightForwarder?: TradeParty;
  grossVolume?: string;
  grossVolumeUnit?: string;
  grossWeight?: string;
  grossWeightUnit?: string;
  includedConsignmentItem?: ConsignmentItem[];
  information?: string;
  logisticsRiskAnalysisResult?: RiskAnalysisResult[];
  mainCarriageTransportMovement?: LogisticsTransportMovement;
  natureIdentificationCargo?: NatureIdentificationCargo;
  netWeight?: string;
  netWeightUnit?: string;
  notifiedWasteMaterial?: string;
  numberOfPackages?: string;
  onCarriageTransportMovement?: LogisticsTransportMovement;
  paymentArrangementCode?: string;
  preCarriageTransportMovement?: LogisticsTransportMovement;
  regulatoryProcedure?: RegulatoryProcedure[];
  transportContractDocument?: ReferencedDocument;
  transportEquipmentQuantity?: string;
  transportEvent?: TransportEvent[];
  transportPackage?: TransportPackage[];
  transshipmentLocation?: LogisticsLocation;
  transshipmentPermittedIndicator?: string;
  usedTransportEquipment?: TransportEquipment[];
  deliveryTimeline?: DeliveryTimeline;
  plannedPeriod?: PlannedPeriod;
  observations?: Observation[];
  borderCrossings?: BorderCrossing[];
}
