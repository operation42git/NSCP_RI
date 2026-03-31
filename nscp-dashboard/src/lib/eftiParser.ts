/**
 * Generic eFTI XML parser.
 *
 * Parses any SupplyChainConsignment XML (namespace http://efti.eu/v1/consignment/common)
 * into the EftiConsignment TypeScript model.
 *
 * Namespace-aware with fallback: tries getElementsByTagNameNS first, then plain
 * getElementsByTagName.
 */

import type {
  EftiConsignment,
  PostalAddress,
  TradeParty,
  LogisticsLocation,
  GeographicalCoordinate,
  TaxRegistration,
  ContactPerson,
  AgreedContract,
  ApplicableLicence,
  DeliveryTimeline,
  PlannedPeriod,
  Observation,
  BorderCrossing,
  MasterPerson,
  ReferencedDocument,
  BinaryFile,
  ConsignmentItem,
  NatureIdentificationCargo,
  TransportPackage,
  DangerousGoods,
  LogisticsTransportMovement,
  TransportMeans,
  TransportEvent,
  TransportEquipment,
  LogisticsSeal,
  ServiceCharge,
  RegulatoryProcedure,
  DocumentAuthentication,
} from "@/types/efti";

const NS = "http://efti.eu/v1/consignment/common";

function getText(element: Element | null, localName: string): string | undefined {
  if (!element) return undefined;
  let nodes = element.getElementsByTagNameNS(NS, localName);
  if (nodes.length === 0) nodes = element.getElementsByTagName(localName);
  if (nodes.length > 0) {
    const text = nodes[0].textContent;
    return text ? text.trim() : undefined;
  }
  return undefined;
}

function getAttribute(element: Element | null, localName: string, attr: string): string | undefined {
  if (!element) return undefined;
  let nodes = element.getElementsByTagNameNS(NS, localName);
  if (nodes.length === 0) nodes = element.getElementsByTagName(localName);
  return nodes.length > 0 ? nodes[0].getAttribute(attr) || undefined : undefined;
}

function getEl(parent: Element | null, localName: string): Element | null {
  if (!parent) return null;
  let nodes = parent.getElementsByTagNameNS(NS, localName);
  if (nodes.length === 0) nodes = parent.getElementsByTagName(localName);
  return nodes.length > 0 ? nodes[0] : null;
}

function getEls(parent: Element | null, localName: string): Element[] {
  if (!parent) return [];
  let nodes = parent.getElementsByTagNameNS(NS, localName);
  if (nodes.length === 0) nodes = parent.getElementsByTagName(localName);
  return Array.from(nodes);
}

function directChildren(parent: Element, localName: string): Element[] {
  return Array.from(parent.children).filter(
    (c) => c.localName === localName
  );
}

// ─── Sub-parsers ───

function parsePostalAddress(el: Element | null): PostalAddress | undefined {
  if (!el) return undefined;
  const addr = getEl(el, "postalAddress");
  if (!addr) return undefined;
  return {
    buildingNumber: getText(addr, "buildingNumber"),
    buildingName: getText(addr, "buildingName"),
    streetName: getText(addr, "streetName"),
    postcode: getText(addr, "postcode"),
    cityName: getText(addr, "cityName"),
    countrySubDivisionName: getText(addr, "countrySubDivisionName"),
    countryCode: getText(addr, "countryCode"),
    postOfficeBox: getText(addr, "postOfficeBox"),
  };
}

function parseGeoCoordinates(el: Element | null): GeographicalCoordinate | undefined {
  if (!el) return undefined;
  const geo = getEl(el, "geographicalCoordinates");
  if (!geo) return undefined;
  return {
    latitude: getText(geo, "latitudeMeasure") ?? getText(geo, "latitude"),
    longitude: getText(geo, "longitudeMeasure") ?? getText(geo, "longitude"),
  };
}

function parseTaxRegistration(el: Element | null): TaxRegistration | undefined {
  if (!el) return undefined;
  const tax = getEl(el, "taxRegistration");
  if (!tax) return undefined;
  const idEl = getEl(tax, "id");
  return {
    id: idEl?.textContent?.trim(),
    schemeAgencyId: idEl?.getAttribute("schemeAgencyId") || undefined,
  };
}

function parseContactPerson(el: Element | null): ContactPerson | undefined {
  if (!el) return undefined;
  const cp = getEl(el, "specifiedContactPerson");
  if (!cp) return undefined;
  return {
    givenName: getText(cp, "givenName"),
    familyName: getText(cp, "familyName"),
    telephoneNumber: getText(cp, "telephoneNumber") ?? getText(cp, "completeTelephoneNumber"),
    faxNumber: getText(cp, "faxNumber") ?? getText(cp, "completeFaxNumber"),
    emailAddress: getText(cp, "emailAddress") ?? getText(cp, "emailURIId"),
  };
}

function parseDocAuth(el: Element): DocumentAuthentication[] {
  return getEls(el, "confirmedDocumentAuthentication").map((a) => ({
    id: getText(a, "id"),
    schemeAgencyId: getAttribute(a, "id", "schemeAgencyId"),
    name: getText(a, "name"),
    roleCode: getText(a, "roleCode"),
    statementCode: getText(a, "statementCode"),
  }));
}

function parseLocation(el: Element | null): LogisticsLocation | undefined {
  if (!el) return undefined;
  const idEl = getEl(el, "id");
  return {
    id: idEl?.textContent?.trim(),
    schemeAgencyId: idEl?.getAttribute("schemeAgencyId") || undefined,
    name: getText(el, "name"),
    postalAddress: parsePostalAddress(el),
    geographicalCoordinates: parseGeoCoordinates(el),
  };
}

function parseFinancialAccount(el: Element | null): { id?: string; schemeAgencyId?: string } | undefined {
  if (!el) return undefined;
  const fa = getEl(el, "financialAccount");
  if (!fa) return undefined;
  const idEl = getEl(fa, "id");
  return {
    id: idEl?.textContent?.trim(),
    schemeAgencyId: idEl?.getAttribute("schemeAgencyId") || undefined,
  };
}

function parseAgreedContract(el: Element | null): AgreedContract | undefined {
  if (!el) return undefined;
  const ac = getEl(el, "agreedContract") ?? getEl(el, "applicableAgreedContract");
  if (!ac) return undefined;
  return {
    issueDateTime: getText(ac, "issueDateTime") ?? getText(ac, "formattedIssueDateTime"),
    duration: getText(ac, "duration") ?? getText(ac, "durationMeasure"),
    signingLocation: getText(ac, "signingLocation") ?? getText(ac, "name"),
  };
}

function parseApplicableLicence(el: Element | null): ApplicableLicence | undefined {
  if (!el) return undefined;
  const lic = getEl(el, "applicableLicence") ?? getEl(el, "applicableTransportLicence");
  if (!lic) return undefined;
  const idEl = getEl(lic, "id");
  return {
    id: idEl?.textContent?.trim(),
    schemeAgencyId: idEl?.getAttribute("schemeAgencyId") || undefined,
    typeCode: getText(lic, "typeCode") ?? getText(lic, "type"),
  };
}

function parseParty(el: Element | null): TradeParty | undefined {
  if (!el) return undefined;
  const idEl = getEl(el, "id");
  return {
    name: getText(el, "name"),
    id: idEl?.textContent?.trim(),
    schemeAgencyId: idEl?.getAttribute("schemeAgencyId") || undefined,
    roleCode: getText(el, "roleCode"),
    departmentName: getText(el, "departmentName"),
    postalAddress: parsePostalAddress(el),
    taxRegistration: parseTaxRegistration(el),
    specifiedContactPerson: parseContactPerson(el),
    confirmedDocumentAuthentication: parseDocAuth(el),
    financialAccount: parseFinancialAccount(el),
    agreedContract: parseAgreedContract(el),
    applicableLicence: parseApplicableLicence(el),
  };
}

function parseDeliveryTimeline(root: Element): DeliveryTimeline | undefined {
  const el = getEl(root, "deliveryTimeline") ?? getEl(root, "specifiedDeliveryEvent");
  if (!el) return undefined;
  return {
    requestedDateTime: getText(el, "requestedDateTime") ?? getText(el, "requestedOccurrenceDateTime"),
    plannedDateTime: getText(el, "plannedDateTime") ?? getText(el, "plannedOccurrenceDateTime"),
    actualDateTime: getText(el, "actualDateTime") ?? getText(el, "actualOccurrenceDateTime"),
    deliveryLocation: parseLocation(getEl(el, "deliveryLocation") ?? getEl(el, "occurrenceLocation")),
  };
}

function parsePlannedPeriod(root: Element): PlannedPeriod | undefined {
  const el = getEl(root, "plannedPeriod") ?? getEl(root, "plannedDeliveryPeriod");
  if (!el) return undefined;
  return {
    startDateTime: getText(el, "startDateTime"),
    endDateTime: getText(el, "endDateTime"),
    duration: getText(el, "duration") ?? getText(el, "durationMeasure"),
    maxDuration: getText(el, "maxDuration") ?? getText(el, "maximumDuration"),
  };
}

function parseObservations(root: Element): Observation[] {
  const els = getEls(root, "observation").concat(getEls(root, "specifiedObservation"));
  return els.map((el) => ({
    text: getText(el, "description") ?? getText(el, "text"),
    subjectCode: getText(el, "subjectTypeCode") ?? getText(el, "subjectCode"),
  }));
}

function parseBorderCrossings(root: Element): BorderCrossing[] {
  const els = getEls(root, "borderCrossing").concat(getEls(root, "borderCrossingEvent"));
  return els.map((el) => ({
    locationName: getText(el, "locationName") ?? getText(el, "name"),
    dateTime: getText(el, "dateTime") ?? getText(el, "actualOccurrenceDateTime"),
  }));
}

function parseBinaryFile(el: Element): BinaryFile {
  return {
    id: getText(el, "id"),
    uRI: getText(el, "uRI"),
    fileName: getText(el, "fileName"),
    mIMECode: getText(el, "mIMECode"),
    sizeMeasure: getText(el, "sizeMeasure"),
    encodingCode: getText(el, "encodingCode"),
  };
}

function parseDocument(el: Element): ReferencedDocument {
  const idEl = getEl(el, "id");
  return {
    id: idEl?.textContent?.trim(),
    schemeAgencyId: idEl?.getAttribute("schemeAgencyId") || undefined,
    typeCode: getText(el, "typeCode"),
    uRI: getText(el, "uRI"),
    formattedIssueDateTime: getText(el, "formattedIssueDateTime"),
    issueLocation: parseLocation(getEl(el, "issueLocation")),
    issuer: parseParty(getEl(el, "issuer")),
    attachedBinaryFile: getEls(el, "attachedBinaryFile").map(parseBinaryFile),
    attachedBinaryObject: getText(el, "attachedBinaryObject"),
    contractualClause: getEls(el, "contractualClause").map((c) => ({
      id: getText(c, "id"),
      content: getText(c, "content"),
    })),
    referenceTypeCode: getText(el, "referenceTypeCode"),
  };
}

function parseNatureCargo(el: Element | null): NatureIdentificationCargo | undefined {
  if (!el) return undefined;
  return {
    identification: getText(el, "identification"),
    operationalCategoryCode: getText(el, "operationalCategoryCode"),
    statisticalClassificationCode: getText(el, "statisticalClassificationCode"),
  };
}

function parseTransportPackage(el: Element | null): TransportPackage | undefined {
  if (!el) return undefined;
  const marks = getEl(el, "physicalLogisticsShippingMarks");
  return {
    itemQuantity: getText(el, "itemQuantity"),
    packagingTypeCode: getText(el, "packagingTypeCode"),
    packagingDescriptionText: getText(el, "packagingDescriptionText"),
    shippingMarks: marks ? getText(marks, "marking") ?? getText(marks, "markingText") : undefined,
  };
}

function parseDangerousGoods(el: Element | null): DangerousGoods | undefined {
  if (!el) return undefined;
  return {
    uNDGID: getText(el, "uNDGID"),
    properShippingName: getText(el, "properShippingName"),
    hazardClassificationID: getText(el, "hazardClassificationID"),
    hazardCategoryCode: getText(el, "hazardCategoryCode"),
    hazardTypeCode: getText(el, "hazardTypeCode"),
    packagingDangerLevelCode: getText(el, "packagingDangerLevelCode"),
    tunnelRestrictionCode: getText(el, "tunnelRestrictionCode"),
    limitedQuantityCode: getText(el, "limitedQuantityCode"),
    specialProvisionID: getText(el, "specialProvisionID"),
    reportableQuantity: getText(el, "reportableQuantity"),
    technicalName: getText(el, "technicalName"),
    information: getText(el, "information"),
    supplementaryInformation: getText(el, "supplementaryInformation"),
    regulatoryAuthorityName: getText(el, "regulatoryAuthorityName"),
    netWeight: getText(el, "netWeight"),
    netWeightUnit: getAttribute(el, "netWeight", "unitId"),
    grossWeight: getText(el, "grossWeight"),
    grossWeightUnit: getAttribute(el, "grossWeight", "unitId"),
    grossVolume: getText(el, "grossVolume"),
    grossVolumeUnit: getAttribute(el, "grossVolume", "unitId"),
    controlTemperature: getText(el, "controlTemperature"),
    emergencyTemperature: getText(el, "emergencyTemperature"),
    density: getText(el, "density"),
    meltingPoint: getText(el, "meltingPoint") ?? getText(el, "flashpointTemperature"),
    hazardCode: getText(el, "hazardCode") ?? getText(el, "hazardCodeID"),
    explosiveMass: getText(el, "explosiveMass") ?? getText(el, "explosiveNetMass"),
    labelCode: getText(el, "labelCode") ?? getText(el, "markingID"),
    packagingTypeCode: getText(el, "packagingTypeCode"),
  };
}

function parseConsignmentItem(el: Element): ConsignmentItem {
  return {
    sequenceNumber: getText(el, "sequenceNumber"),
    grossWeightMeasure: getText(el, "grossWeightMeasure") ?? getText(el, "grossWeight"),
    grossWeightUnit: getAttribute(el, "grossWeightMeasure", "unitCode") ?? getAttribute(el, "grossWeight", "unitId"),
    grossVolumeMeasure: getText(el, "grossVolumeMeasure") ?? getText(el, "grossVolume"),
    grossVolumeUnit: getAttribute(el, "grossVolumeMeasure", "unitCode") ?? getAttribute(el, "grossVolume", "unitId"),
    consignmentItemQuantity: getText(el, "consignmentItemQuantity") ?? getText(el, "goodsUnitQuantity"),
    natureIdentificationTransportCargo: parseNatureCargo(getEl(el, "natureIdentificationTransportCargo")),
    statisticalClassificationCode: getText(el, "statisticalClassificationCode"),
    transportLogisticsPackage: parseTransportPackage(getEl(el, "transportLogisticsPackage")),
    transportDangerousGoods: parseDangerousGoods(getEl(el, "transportDangerousGoods")),
  };
}

function parseTransportMeans(el: Element | null): TransportMeans | undefined {
  if (!el) return undefined;
  const idEl = getEl(el, "id");
  const regCountry = getEl(el, "registrationCountry");
  return {
    id: idEl?.textContent?.trim(),
    schemeAgencyId: idEl?.getAttribute("schemeAgencyId") || undefined,
    registrationCountryCode: regCountry ? getText(regCountry, "code") : undefined,
    equipmentDescriptionText: getText(el, "equipmentDescriptionText"),
    typeCode: getText(el, "typeCode"),
    ownerName: getText(el, "ownerName"),
  };
}

function parseTransportEvent(el: Element | null): TransportEvent | undefined {
  if (!el) return undefined;
  return {
    requestedOccurrenceDateTime: getText(el, "requestedOccurrenceDateTime"),
    plannedOccurrenceDateTime: getText(el, "plannedOccurrenceDateTime"),
    actualOccurrenceDateTime: getText(el, "actualOccurrenceDateTime"),
    certifyingParty: parseParty(getEl(el, "certifyingParty")),
    occurrenceLocation: parseLocation(getEl(el, "occurrenceLocation")),
  };
}

function parseMasterPerson(el: Element | null): MasterPerson | undefined {
  if (!el) return undefined;
  const mp = getEl(el, "masterResponsiblePerson") ?? getEl(el, "specifiedDriverPerson");
  if (!mp) return undefined;
  return {
    name: getText(mp, "name"),
    id: getText(mp, "id"),
    roleCode: getText(mp, "roleCode"),
  };
}

function parseTransportMovement(el: Element | null): LogisticsTransportMovement | undefined {
  if (!el) return undefined;
  return {
    modeCode: getText(el, "modeCode"),
    dangerousGoodsIndicator: getText(el, "dangerousGoodsIndicator"),
    usedTransportMeans: parseTransportMeans(getEl(el, "usedTransportMeans")),
    masterResponsiblePerson: parseMasterPerson(el),
    loadingEvent: parseTransportEvent(getEl(el, "loadingEvent")),
    unloadingEvent: parseTransportEvent(getEl(el, "unloadingEvent")),
    sequenceNumber: getText(el, "sequenceNumber"),
  };
}

function parseSeal(el: Element): LogisticsSeal {
  return {
    id: getText(el, "id"),
    typeCode: getText(el, "typeCode"),
    conditionCode: getText(el, "conditionCode"),
    issuingParty: parseParty(getEl(el, "issuingParty")),
  };
}

function parseTransportEquipment(el: Element): TransportEquipment {
  const idEl = getEl(el, "id");
  const regCountry = getEl(el, "registrationCountry");
  return {
    id: idEl?.textContent?.trim(),
    schemeAgencyId: idEl?.getAttribute("schemeAgencyId") || undefined,
    categoryCode: getText(el, "categoryCode"),
    sequenceNumber: getText(el, "sequenceNumber"),
    registrationCountryCode: regCountry ? getText(regCountry, "code") : undefined,
    equipmentDescriptionText: getText(el, "equipmentDescriptionText"),
    affixedSeal: getEls(el, "affixedSeal").map(parseSeal),
    grossWeight: getText(el, "grossWeight"),
    grossWeightUnit: getAttribute(el, "grossWeight", "unitId"),
  };
}

function parseServiceCharge(el: Element): ServiceCharge {
  return {
    paymentArrangementCode: getText(el, "paymentArrangementCode"),
    payingPartyRoleCode: getText(el, "payingPartyRoleCode"),
    appliedAmount: getText(el, "appliedAmount"),
    appliedAmountCurrency: getAttribute(el, "appliedAmount", "currencyId"),
    calculationBasisCode: getText(el, "calculationBasisCode"),
  };
}

// ─── Main entry point ───

export function parseEftiXml(xmlString: string): EftiConsignment {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error("XML parsing error: " + parseError.textContent);
  }

  const root = doc.documentElement;
  if (!root) return {};

  const result: EftiConsignment = {};

  result.typeCode = getText(root, "typeCode");

  const charges = directChildren(root, "applicableServiceCharge");
  if (charges.length) result.applicableServiceCharge = charges.map(parseServiceCharge);

  const docs = directChildren(root, "associatedDocument");
  if (docs.length) result.associatedDocument = docs.map(parseDocument);

  const parties = directChildren(root, "associatedParty");
  if (parties.length) result.associatedParty = parties.map((p) => parseParty(p)!);

  result.cODAmount = getText(root, "cODAmount");
  result.cODAmountCurrency = getAttribute(root, "cODAmount", "currencyId");

  const insuranceTexts = getEls(root, "cargoInsuranceInstructions").map((e) => e.textContent?.trim()).filter(Boolean) as string[];
  if (insuranceTexts.length) result.cargoInsuranceInstructions = insuranceTexts;

  result.carrier = parseParty(getEl(root, "carrier"));
  result.connectingCarrier = parseParty(getEl(root, "connectingCarrier"));
  result.consignee = parseParty(getEl(root, "consignee"));
  result.consignor = parseParty(getEl(root, "consignor"));
  result.freightForwarder = parseParty(getEl(root, "freightForwarder"));

  result.carrierAcceptanceDateTime = getText(root, "carrierAcceptanceDateTime");
  result.carrierAcceptanceLocation = parseLocation(getEl(root, "carrierAcceptanceLocation"));
  result.consigneeReceiptLocation = parseLocation(getEl(root, "consigneeReceiptLocation"));

  const bci = getEl(root, "consignorProvidedBorderClearanceInstructions");
  if (bci) {
    const descs = getEls(bci, "description").map((d) => d.textContent?.trim()).filter(Boolean) as string[];
    if (descs.length) result.consignorProvidedBorderClearanceInstructions = { description: descs };
  }

  const infoTexts = getEls(root, "consignorProvidedInformationText").map((e) => e.textContent?.trim()).filter(Boolean) as string[];
  if (infoTexts.length) result.consignorProvidedInformationText = infoTexts;

  result.contractTermsText = getText(root, "contractTermsText");
  result.information = getText(root, "information");
  result.deliveryInformation = getText(root, "deliveryInformation");

  result.dangerousGoods = parseDangerousGoods(getEl(root, "dangerousGoods"));

  result.grossWeight = getText(root, "grossWeight") ?? getText(root, "grossWeightMeasure");
  result.grossWeightUnit = getAttribute(root, "grossWeight", "unitId") ?? getAttribute(root, "grossWeightMeasure", "unitCode");
  result.grossVolume = getText(root, "grossVolume") ?? getText(root, "grossVolumeMeasure");
  result.grossVolumeUnit = getAttribute(root, "grossVolume", "unitId") ?? getAttribute(root, "grossVolumeMeasure", "unitCode");
  result.netWeight = getText(root, "netWeight");
  result.netWeightUnit = getAttribute(root, "netWeight", "unitId");
  result.numberOfPackages = getText(root, "numberOfPackages");
  result.transportEquipmentQuantity = getText(root, "transportEquipmentQuantity");

  const items = directChildren(root, "includedConsignmentItem");
  if (items.length) result.includedConsignmentItem = items.map(parseConsignmentItem);

  result.natureIdentificationCargo = parseNatureCargo(getEl(root, "natureIdentificationCargo"));

  const mainMovements = directChildren(root, "mainCarriageTransportMovement");
  if (mainMovements.length) result.mainCarriageTransportMovement = parseTransportMovement(mainMovements[0]);
  result.preCarriageTransportMovement = parseTransportMovement(getEl(root, "preCarriageTransportMovement"));
  result.onCarriageTransportMovement = parseTransportMovement(getEl(root, "onCarriageTransportMovement"));

  result.deliveryEvent = parseTransportEvent(getEl(root, "deliveryEvent"));
  const events = directChildren(root, "transportEvent");
  if (events.length) result.transportEvent = events.map((e) => parseTransportEvent(e)!);

  result.transportContractDocument = (() => {
    const tcd = getEl(root, "transportContractDocument");
    return tcd ? parseDocument(tcd) : undefined;
  })();

  const equipment = directChildren(root, "usedTransportEquipment");
  if (equipment.length) result.usedTransportEquipment = equipment.map(parseTransportEquipment);

  result.transshipmentLocation = parseLocation(getEl(root, "transshipmentLocation"));
  result.transshipmentPermittedIndicator = getText(root, "transshipmentPermittedIndicator");

  result.deliveryTimeline = parseDeliveryTimeline(root);
  result.plannedPeriod = parsePlannedPeriod(root);
  const obs = parseObservations(root);
  if (obs.length) result.observations = obs;
  const bcs = parseBorderCrossings(root);
  if (bcs.length) result.borderCrossings = bcs;

  const procs = directChildren(root, "regulatoryProcedure");
  if (procs.length) {
    result.regulatoryProcedure = procs.map((p) => ({
      typeCode: getText(p, "typeCode"),
      description: getText(p, "description"),
    } as RegulatoryProcedure));
  }

  const packages = directChildren(root, "transportPackage");
  if (packages.length) result.transportPackage = packages.map((p) => parseTransportPackage(p)!);

  return result;
}
