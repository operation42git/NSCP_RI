import { ECMRData, Party, Location, ConsignmentItem, PostalAddress, ServiceCharge, ADRData, ADRItem, RadioactiveMaterial } from './ecmrTypes';
import { formatAddressString, formatCurrency } from './ecmrFormatter';

const NS = 'http://efti.eu/v1/consignment/common';

export function parseXML(xmlString: string): ECMRData {
  // Ensure UTF-8 encoding is preserved
  const parser = new DOMParser();
  // Parse with text/xml to preserve UTF-8 encoding properly
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('XML parsing error: ' + parserError.textContent);
  }
  
  const ecmr: ECMRData = {
    consignmentItems: []
  };

  // Helper function to get text content with namespace (with fallback)
  const getText = (element: Element | null, localName: string): string | undefined => {
    if (!element) return undefined;
    // Try with namespace first
    let nodes = element.getElementsByTagNameNS(NS, localName);
    // Fallback: try without namespace if namespace lookup fails
    if (nodes.length === 0) {
      nodes = element.getElementsByTagName(localName);
    }
    if (nodes.length > 0) {
      const text = nodes[0].textContent;
      return text ? text.trim() : undefined;
    }
    return undefined;
  };

  const getAttribute = (element: Element | null, localName: string, attr: string): string | undefined => {
    if (!element) return undefined;
    let nodes = element.getElementsByTagNameNS(NS, localName);
    if (nodes.length === 0) {
      nodes = element.getElementsByTagName(localName);
    }
    return nodes.length > 0 ? nodes[0].getAttribute(attr) || undefined : undefined;
  };

  const getElement = (element: Element | null, localName: string): Element | null => {
    if (!element) return null;
    let nodes = element.getElementsByTagNameNS(NS, localName);
    if (nodes.length === 0) {
      nodes = element.getElementsByTagName(localName);
    }
    return nodes.length > 0 ? nodes[0] : null;
  };

  const getElements = (element: Element | null, localName: string): Element[] => {
    if (!element) return [];
    let nodes = element.getElementsByTagNameNS(NS, localName);
    if (nodes.length === 0) {
      nodes = element.getElementsByTagName(localName);
    }
    return Array.from(nodes);
  };

  // Helper to format address
  const formatAddress = (addressElement: Element | null): PostalAddress | undefined => {
    if (!addressElement) return undefined;
    return {
      buildingNumber: getText(addressElement, 'buildingNumber'),
      streetName: getText(addressElement, 'streetName'),
      postcode: getText(addressElement, 'postcode'),
      cityName: getText(addressElement, 'cityName'),
      countrySubDivisionName: getText(addressElement, 'countrySubDivisionName'),
      countryCode: getText(addressElement, 'countryCode')
    };
  };

  // Helper to format party with address
  const formatParty = (partyElement: Element | null): Party | undefined => {
    if (!partyElement) return undefined;
    const address = getElement(partyElement, 'postalAddress');
    return {
      name: getText(partyElement, 'name'),
      postalAddress: formatAddress(address)
    };
  };

  // Helper to format location with address
  const formatLocation = (locationElement: Element | null): Location | undefined => {
    if (!locationElement) return undefined;
    const address = getElement(locationElement, 'postalAddress');
    return {
      name: getText(locationElement, 'name'),
      postalAddress: formatAddress(address)
    };
  };

  // Get root element
  const root = xmlDoc.documentElement;
  if (!root) {
    console.error('No root element found in XML');
    return ecmr;
  }
  
  // Debug: log root element info
  console.log('Root element:', root.localName, 'namespace:', root.namespaceURI);
  console.log('Root element children count:', root.children.length);

  // Header fields
  const associatedDocument = getElement(root, 'associatedDocument');
  if (associatedDocument) {
    ecmr.ecmrId = getText(associatedDocument, 'id');
    ecmr.issueDate = getText(associatedDocument, 'formattedIssueDateTime');
    const issueLocation = getElement(associatedDocument, 'issueLocation');
    ecmr.issueLocation = getText(issueLocation, 'name');
  }

  // Field 1: Consignor
  const consignor = getElement(root, 'consignor');
  ecmr.consignor = formatParty(consignor);

  // Field 2: Consignee
  const consignee = getElement(root, 'consignee');
  ecmr.consignee = formatParty(consignee);

  // Field 3: Delivery address
  const deliveryLocation = getElement(root, 'consigneeReceiptLocation');
  ecmr.deliveryAddress = formatLocation(deliveryLocation);

  // Field 4: Carrier acceptance
  ecmr.carrierAcceptanceDateTime = getText(root, 'carrierAcceptanceDateTime');
  const acceptanceLocation = getElement(root, 'carrierAcceptanceLocation');
  ecmr.carrierAcceptanceLocation = formatLocation(acceptanceLocation);

  // Field 5: Annexed documents
  const documents = getElements(root, 'associatedDocument');
  if (documents.length > 0) {
    ecmr.annexedDocuments = documents.map(doc => {
      const id = getText(doc, 'id');
      const typeCode = getText(doc, 'typeCode');
      return typeCode ? `${id} (${typeCode})` : id || '';
    }).filter(d => d);
  }

  // Field 6-12: Consignment items
  const items = getElements(root, 'includedConsignmentItem');
  ecmr.consignmentItems = items.map(item => {
    const consignmentItem: ConsignmentItem = {};
    
    // Field 6: Marks and numbers
    const shippingMarks = getElement(item, 'shippingMarks');
    if (shippingMarks) {
      consignmentItem.marksAndNumbers = getText(shippingMarks, 'markingText');
    } else {
      const dangerousGoods = getElement(item, 'transportDangerousGoods');
      if (dangerousGoods) {
        const logisticsPackage = getElement(dangerousGoods, 'dangerousGoodsLogisticsPackage');
        if (logisticsPackage) {
          const packageMarks = getElement(logisticsPackage, 'shippingMarks');
          consignmentItem.marksAndNumbers = getText(packageMarks, 'markingText');
        }
      }
    }
    
    // Field 7: Number of packages
    consignmentItem.numberOfPackages = getText(item, 'goodsUnitQuantity');
    if (!consignmentItem.numberOfPackages) {
      const dangerousGoods = getElement(item, 'transportDangerousGoods');
      if (dangerousGoods) {
        const logisticsPackage = getElement(dangerousGoods, 'dangerousGoodsLogisticsPackage');
        consignmentItem.numberOfPackages = getText(logisticsPackage, 'itemQuantity');
      }
    }
    
    // Field 8: Description of packing
    const dimensions = getElement(item, 'dimensions');
    consignmentItem.packingDescription = getText(dimensions, 'description');
    if (!consignmentItem.packingDescription) {
      const equipment = getElement(item, 'associatedTransportEquipment');
      consignmentItem.packingDescription = getText(equipment, 'id');
    }
    
    // Field 9: Nature of goods / Shipping name
    const dangerousGoods = getElement(item, 'transportDangerousGoods');
    if (dangerousGoods) {
      consignmentItem.natureOfGoods = getText(dangerousGoods, 'properShippingName') || 
                                     getText(dangerousGoods, 'information');
    }
    
    // Field 10: Statistic number
    if (dangerousGoods) {
      consignmentItem.statisticNumber = getText(dangerousGoods, 'hazardClassificationID');
    }
    
    // Field 11: Gross weight
    const grossWeight = getElement(item, 'grossWeight');
    if (grossWeight) {
      consignmentItem.grossWeight = getText(item, 'grossWeight');
      consignmentItem.grossWeightUnit = getAttribute(item, 'grossWeight', 'unitId');
    }
    
    // Field 12: Volume
    const grossVolume = getElement(item, 'grossVolume');
    if (grossVolume) {
      consignmentItem.volume = getText(item, 'grossVolume');
      consignmentItem.volumeUnit = getAttribute(item, 'grossVolume', 'unitId');
    }
    
    return consignmentItem;
  });

  // Totals
  const totalGrossWeight = getElement(root, 'grossWeight');
  if (totalGrossWeight) {
    ecmr.totalGrossWeight = getText(root, 'grossWeight');
    ecmr.totalGrossWeightUnit = getAttribute(root, 'grossWeight', 'unitId');
  }
  
  const totalGrossVolume = getElement(root, 'grossVolume');
  if (totalGrossVolume) {
    ecmr.totalVolume = getText(root, 'grossVolume');
    ecmr.totalVolumeUnit = getAttribute(root, 'grossVolume', 'unitId');
  }

  // Field 16: Carrier
  const carrier = getElement(root, 'carrier');
  ecmr.carrier = formatParty(carrier);

  // Field 17: Following carrier
  const connectingCarrier = getElement(root, 'connectingCarrier');
  ecmr.followingCarrier = formatParty(connectingCarrier);

  // Field 13: Special instructions (sender's instructions for customs and formalities)
  const borderClearanceInstructions = getElement(root, 'consignorProvidedBorderClearanceInstructions');
  if (borderClearanceInstructions) {
    const descriptions = getElements(borderClearanceInstructions, 'description');
    if (descriptions.length > 0) {
      ecmr.specialInstructions = descriptions.map(d => d.textContent?.trim() || '').filter(d => d).join('\n');
    }
  }
  if (!ecmr.specialInstructions) {
    ecmr.specialInstructions = getText(root, 'cargoInsuranceInstructions') || getText(root, 'consignorProvidedInformationText');
  }

  // Field 14: COD amount
  const codAmount = getElement(root, 'cODAmount');
  if (codAmount) {
    ecmr.codAmount = getText(root, 'cODAmount');
    ecmr.codCurrency = getAttribute(root, 'cODAmount', 'currencyId');
  }

  // Field 15: Payment instructions for freight
  const paymentCodes = getElements(root, 'applicableServiceCharge').flatMap(charge => {
    const codes = getElements(charge, 'paymentArrangementCode');
    return codes.map(c => c.textContent?.trim() || '').filter(c => c);
  });
  if (paymentCodes.length > 0) {
    ecmr.paymentInstructions = paymentCodes;
  }

  // Field 19: Paying party
  const payingParties = getElements(root, 'applicableServiceCharge').flatMap(charge => {
    const codes = getElements(charge, 'payingPartyRoleCode');
    return codes.map(c => c.textContent?.trim() || '').filter(c => c);
  });
  if (payingParties.length > 0) {
    ecmr.payingParty = payingParties;
  }

  // Field 20: Special agreements
  ecmr.specialAgreements = getText(root, 'contractTermsText');
  if (!ecmr.specialAgreements && carrier) {
    const agreedContract = getElement(carrier, 'agreedContract');
    if (agreedContract) {
      const signedLocation = getElement(agreedContract, 'signedLocation');
      ecmr.specialAgreements = getText(signedLocation, 'name');
    }
  }

  // Field 21: Date and place of issue
  if (associatedDocument) {
    const issueDate = getText(associatedDocument, 'formattedIssueDateTime');
    const issueLoc = getElement(associatedDocument, 'issueLocation');
    if (issueDate || issueLoc) {
      const parts: string[] = [];
      if (issueDate) parts.push(issueDate);
      if (issueLoc) {
        const locName = getText(issueLoc, 'name');
        const locAddressElement = getElement(issueLoc, 'postalAddress');
        const locAddressObj = formatAddress(locAddressElement);
        const locAddress = locAddressObj ? formatAddressString(locAddressObj) : '';
        if (locName) {
          parts.push(locName + (locAddress ? ', ' + locAddress : ''));
        } else if (locAddress) {
          parts.push(locAddress);
        }
      }
      ecmr.issueDateAndPlace = parts.join('\n');
    }
  }

  // Fields 22-24: Signatures
  if (consignor) {
    const signatory = getElement(consignor, 'authoritativeSignatoryPerson');
    if (signatory) {
      const names = getElements(signatory, 'name');
      if (names.length > 0) {
        ecmr.senderSignature = names[0].textContent?.trim() || undefined;
      }
    }
  }

  if (carrier) {
    const signatory = getElement(carrier, 'authoritativeSignatoryPerson');
    if (signatory) {
      const names = getElements(signatory, 'name');
      if (names.length > 0) {
        ecmr.carrierSignature = names[0].textContent?.trim() || undefined;
      }
    }
  }

  if (consignee) {
    const signatory = getElement(consignee, 'authoritativeSignatoryPerson');
    if (signatory) {
      const names = getElements(signatory, 'name');
      if (names.length > 0) {
        ecmr.consigneeSignature = names[0].textContent?.trim() || undefined;
      }
    }
  }

  // Field 25: Vehicle and trailer numbers
  const transportMovement = getElement(root, 'mainCarriageTransportMovement');
  if (transportMovement) {
    const transportMeans = getElement(transportMovement, 'usedTransportMeans');
    if (transportMeans) {
      ecmr.vehicleNumber = getText(transportMeans, 'id');
    }
  }
  const transportEquipment = getElements(root, 'usedTransportEquipment');
  if (transportEquipment.length > 0) {
    ecmr.trailerNumber = getText(transportEquipment[0], 'id');
  }

  // Field 26: Vehicle and trailer model
  if (transportEquipment.length > 0) {
    ecmr.vehicleModel = getText(transportEquipment[0], 'categoryCode');
  }

  // Field 27: Tariff
  const firstServiceCharge = getElements(root, 'applicableServiceCharge')[0];
  if (firstServiceCharge) {
    ecmr.tariff27 = getText(firstServiceCharge, 'calculationBasisCode');
    if (!ecmr.tariff27) {
      const amount = getElement(firstServiceCharge, 'appliedAmount');
      if (amount) {
        ecmr.tariff27 = formatCurrency(
          getText(firstServiceCharge, 'appliedAmount'),
          getAttribute(firstServiceCharge, 'appliedAmount', 'currencyId')
        );
      }
    }
  }

  // Field 25-28: Service charges (for field 28)
  const serviceCharges = getElements(root, 'applicableServiceCharge');
  ecmr.tariffs = serviceCharges.map(charge => {
    const serviceCharge: ServiceCharge = {};
    const amount = getElement(charge, 'appliedAmount');
    if (amount) {
      serviceCharge.appliedAmount = getText(charge, 'appliedAmount');
      serviceCharge.currency = getAttribute(charge, 'appliedAmount', 'currencyId');
    }
    serviceCharge.calculationBasisCode = getText(charge, 'calculationBasisCode');
    return serviceCharge;
  });

  // Parse ADR data
  ecmr.adrData = parseADRData(root, getElement, getElements, getText, getAttribute, formatParty);

  return ecmr;
}

function parseADRData(
  root: Element,
  getElement: (element: Element | null, localName: string) => Element | null,
  getElements: (element: Element | null, localName: string) => Element[],
  getText: (element: Element | null, localName: string) => string | undefined,
  getAttribute: (element: Element | null, localName: string, attr: string) => string | undefined,
  formatParty: (partyElement: Element | null) => Party | undefined
): ADRData {
  const adrData: ADRData = {
    adrItems: []
  };

  // Dangerous Goods at consignment level
  const dangerousGoods = getElement(root, 'dangerousGoods');
  if (dangerousGoods) {
    const adrItem: ADRItem = {};
    
    adrItem.properShippingName = getText(dangerousGoods, 'properShippingName');
    adrItem.unNumber = getText(dangerousGoods, 'uNDGID');
    adrItem.hazardClass = getText(dangerousGoods, 'hazardClassificationID');
    adrItem.hazardCategoryCode = getText(dangerousGoods, 'hazardCategoryCode');
    adrItem.hazardTypeCode = getText(dangerousGoods, 'hazardTypeCode');
    adrItem.packagingDangerLevelCode = getText(dangerousGoods, 'packagingDangerLevelCode');
    adrItem.tunnelRestrictionCode = getText(dangerousGoods, 'tunnelRestrictionCode');
    adrItem.limitedQuantityCode = getText(dangerousGoods, 'limitedQuantityCode');
    adrItem.specialProvisionID = getText(dangerousGoods, 'specialProvisionID');
    adrItem.reportableQuantity = getText(dangerousGoods, 'reportableQuantity');
    adrItem.technicalName = getText(dangerousGoods, 'technicalName');
    adrItem.supplementaryInformation = getText(dangerousGoods, 'supplementaryInformation');
    adrItem.regulatoryAuthorityName = getText(dangerousGoods, 'regulatoryAuthorityName');
    adrItem.information = getText(dangerousGoods, 'information');
    
    // Net weight
    const netWeight = getElement(dangerousGoods, 'netWeight');
    if (netWeight) {
      adrItem.netWeight = getText(dangerousGoods, 'netWeight');
      adrItem.netWeightUnit = getAttribute(dangerousGoods, 'netWeight', 'unitId');
    }
    
    // Gross weight
    const grossWeight = getElement(dangerousGoods, 'grossWeight');
    if (grossWeight) {
      adrItem.grossWeight = getText(dangerousGoods, 'grossWeight');
      adrItem.grossWeightUnit = getAttribute(dangerousGoods, 'grossWeight', 'unitId');
    }
    
    // Volume
    const grossVolume = getElement(dangerousGoods, 'grossVolume');
    if (grossVolume) {
      adrItem.volume = getText(dangerousGoods, 'grossVolume');
      adrItem.volumeUnit = getAttribute(dangerousGoods, 'grossVolume', 'unitId');
    }
    
    // Density measure
    const densityMeasure = getElement(dangerousGoods, 'densityMeasure');
    if (densityMeasure) {
      adrItem.densityMeasure = getText(dangerousGoods, 'densityMeasure');
      adrItem.densityMeasureUnit = getAttribute(dangerousGoods, 'densityMeasure', 'unitId');
    }
    
    // Melting point temperature
    const meltingPointTemp = getElement(dangerousGoods, 'meltingPointTemperatureMeasure');
    if (meltingPointTemp) {
      adrItem.meltingPointTemperatureMeasure = getText(dangerousGoods, 'meltingPointTemperatureMeasure');
      adrItem.meltingPointTemperatureUnit = getAttribute(dangerousGoods, 'meltingPointTemperatureMeasure', 'unitId');
    }
    
    // Explosive cargo net weight
    const explosiveNetWeight = getElement(dangerousGoods, 'explosiveCargoNetWeight');
    if (explosiveNetWeight) {
      adrItem.explosiveCargoNetWeight = getText(dangerousGoods, 'explosiveCargoNetWeight');
      adrItem.explosiveCargoNetWeightUnit = getAttribute(dangerousGoods, 'explosiveCargoNetWeight', 'unitId');
    }
    
    // Radioactive material
    const radioactiveMaterial = getElement(dangerousGoods, 'radioactiveMaterial');
    if (radioactiveMaterial) {
      adrItem.radioactiveMaterial = {};
      const isotope = getElement(radioactiveMaterial, 'applicableRadioactiveIsotope');
      if (isotope) {
        adrItem.radioactiveMaterial.activityLevelMeasure = getText(isotope, 'activityLevelMeasure');
        adrItem.radioactiveMaterial.activityLevelUnit = getAttribute(isotope, 'activityLevelMeasure', 'unitId');
        adrItem.radioactiveMaterial.isotopeName = getText(isotope, 'name');
      }
      adrItem.radioactiveMaterial.fissileCriticalitySafetyIndexNumber = getText(radioactiveMaterial, 'fissileCriticalitySafetyIndexNumber');
      adrItem.radioactiveMaterial.radioactivePackageTransportIndexCode = getText(radioactiveMaterial, 'radioactivePackageTransportIndexCode');
      adrItem.radioactiveMaterial.specialFormInformation = getText(radioactiveMaterial, 'specialFormInformation');
    }
    
    // Control temperature
    const controlTemp = getElement(dangerousGoods, 'controlTemperature');
    if (controlTemp) {
      const tempValue = getText(controlTemp, 'conditionMeasure');
      const tempType = getText(controlTemp, 'typeCode');
      const tempUnit = getAttribute(controlTemp, 'conditionMeasure', 'unitId');
      if (tempValue) {
        adrItem.controlTemperature = `${tempValue}${tempUnit ? ' ' + tempUnit : ''}${tempType ? ' (' + tempType + ')' : ''}`;
      }
    }
    
    // Emergency temperature
    const emergencyTemp = getElement(dangerousGoods, 'emergencyTemperature');
    if (emergencyTemp) {
      const tempValue = getText(emergencyTemp, 'conditionMeasure');
      const tempType = getText(emergencyTemp, 'typeCode');
      const tempUnit = getAttribute(emergencyTemp, 'conditionMeasure', 'unitId');
      if (tempValue) {
        adrItem.emergencyTemperature = `${tempValue}${tempUnit ? ' ' + tempUnit : ''}${tempType ? ' (' + tempType + ')' : ''}`;
      }
    }
    
    // Shipping marks from dangerous goods logistics package
    const logisticsPackage = getElement(dangerousGoods, 'dangerousGoodsLogisticsPackage');
    if (logisticsPackage) {
      const packageMarks = getElement(logisticsPackage, 'shippingMarks');
      if (packageMarks) {
        adrItem.shippingMarks = getText(packageMarks, 'markingText');
      }
      adrItem.numberOfPackages = getText(logisticsPackage, 'itemQuantity');
    }
    
    if (adrItem.properShippingName || adrItem.unNumber || adrItem.hazardClass) {
      adrData.adrItems.push(adrItem);
    }
  }

  // Dangerous Goods from consignment items
  const items = getElements(root, 'includedConsignmentItem');
  items.forEach(item => {
    const transportDangerousGoods = getElement(item, 'transportDangerousGoods');
    if (transportDangerousGoods) {
      const adrItem: ADRItem = {};
      
      adrItem.properShippingName = getText(transportDangerousGoods, 'properShippingName');
      adrItem.unNumber = getText(transportDangerousGoods, 'uNDGID');
      adrItem.hazardClass = getText(transportDangerousGoods, 'hazardClassificationID');
      adrItem.hazardCategoryCode = getText(transportDangerousGoods, 'hazardCategoryCode');
      adrItem.hazardTypeCode = getText(transportDangerousGoods, 'hazardTypeCode');
      adrItem.packagingDangerLevelCode = getText(transportDangerousGoods, 'packagingDangerLevelCode');
      adrItem.tunnelRestrictionCode = getText(transportDangerousGoods, 'tunnelRestrictionCode');
      adrItem.limitedQuantityCode = getText(transportDangerousGoods, 'limitedQuantityCode');
      adrItem.specialProvisionID = getText(transportDangerousGoods, 'specialProvisionID');
      adrItem.reportableQuantity = getText(transportDangerousGoods, 'reportableQuantity');
      adrItem.technicalName = getText(transportDangerousGoods, 'technicalName');
      adrItem.supplementaryInformation = getText(transportDangerousGoods, 'supplementaryInformation');
      adrItem.regulatoryAuthorityName = getText(transportDangerousGoods, 'regulatoryAuthorityName');
      adrItem.information = getText(transportDangerousGoods, 'information');
      
      // Number of packages
      adrItem.numberOfPackages = getText(item, 'goodsUnitQuantity');
      
      // Packing description
      const dimensions = getElement(item, 'dimensions');
      adrItem.packingDescription = getText(dimensions, 'description');
      
      // Net weight
      const netWeight = getElement(transportDangerousGoods, 'netWeight');
      if (netWeight) {
        adrItem.netWeight = getText(transportDangerousGoods, 'netWeight');
        adrItem.netWeightUnit = getAttribute(transportDangerousGoods, 'netWeight', 'unitId');
      }
      
      // Gross weight
      const grossWeight = getElement(transportDangerousGoods, 'grossWeight');
      if (grossWeight) {
        adrItem.grossWeight = getText(transportDangerousGoods, 'grossWeight');
        adrItem.grossWeightUnit = getAttribute(transportDangerousGoods, 'grossWeight', 'unitId');
      }
      
      // Volume
      const grossVolume = getElement(transportDangerousGoods, 'grossVolume');
      if (grossVolume) {
        adrItem.volume = getText(transportDangerousGoods, 'grossVolume');
        adrItem.volumeUnit = getAttribute(transportDangerousGoods, 'grossVolume', 'unitId');
      }
      
      // Density measure
      const densityMeasure = getElement(transportDangerousGoods, 'densityMeasure');
      if (densityMeasure) {
        adrItem.densityMeasure = getText(transportDangerousGoods, 'densityMeasure');
        adrItem.densityMeasureUnit = getAttribute(transportDangerousGoods, 'densityMeasure', 'unitId');
      }
      
      // Melting point temperature
      const meltingPointTemp = getElement(transportDangerousGoods, 'meltingPointTemperatureMeasure');
      if (meltingPointTemp) {
        adrItem.meltingPointTemperatureMeasure = getText(transportDangerousGoods, 'meltingPointTemperatureMeasure');
        adrItem.meltingPointTemperatureUnit = getAttribute(transportDangerousGoods, 'meltingPointTemperatureMeasure', 'unitId');
      }
      
      // Explosive cargo net weight
      const explosiveNetWeight = getElement(transportDangerousGoods, 'explosiveCargoNetWeight');
      if (explosiveNetWeight) {
        adrItem.explosiveCargoNetWeight = getText(transportDangerousGoods, 'explosiveCargoNetWeight');
        adrItem.explosiveCargoNetWeightUnit = getAttribute(transportDangerousGoods, 'explosiveCargoNetWeight', 'unitId');
      }
      
      // Radioactive material
      const radioactiveMaterial = getElement(transportDangerousGoods, 'radioactiveMaterial');
      if (radioactiveMaterial) {
        adrItem.radioactiveMaterial = {};
        const isotope = getElement(radioactiveMaterial, 'applicableRadioactiveIsotope');
        if (isotope) {
          adrItem.radioactiveMaterial.activityLevelMeasure = getText(isotope, 'activityLevelMeasure');
          adrItem.radioactiveMaterial.activityLevelUnit = getAttribute(isotope, 'activityLevelMeasure', 'unitId');
          adrItem.radioactiveMaterial.isotopeName = getText(isotope, 'name');
        }
        adrItem.radioactiveMaterial.fissileCriticalitySafetyIndexNumber = getText(radioactiveMaterial, 'fissileCriticalitySafetyIndexNumber');
        adrItem.radioactiveMaterial.radioactivePackageTransportIndexCode = getText(radioactiveMaterial, 'radioactivePackageTransportIndexCode');
        adrItem.radioactiveMaterial.specialFormInformation = getText(radioactiveMaterial, 'specialFormInformation');
      }
      
      // Shipping marks
      const logisticsPackage = getElement(transportDangerousGoods, 'dangerousGoodsLogisticsPackage');
      if (logisticsPackage) {
        const packageMarks = getElement(logisticsPackage, 'shippingMarks');
        if (packageMarks) {
          adrItem.shippingMarks = getText(packageMarks, 'markingText');
        }
        if (!adrItem.numberOfPackages) {
          adrItem.numberOfPackages = getText(logisticsPackage, 'itemQuantity');
        }
      }
      
      // Control temperature
      const controlTemp = getElement(transportDangerousGoods, 'controlTemperature');
      if (controlTemp) {
        const tempValue = getText(controlTemp, 'conditionMeasure');
        const tempType = getText(controlTemp, 'typeCode');
        const tempUnit = getAttribute(controlTemp, 'conditionMeasure', 'unitId');
        if (tempValue) {
          adrItem.controlTemperature = `${tempValue}${tempUnit ? ' ' + tempUnit : ''}${tempType ? ' (' + tempType + ')' : ''}`;
        }
      }
      
      // Emergency temperature
      const emergencyTemp = getElement(transportDangerousGoods, 'emergencyTemperature');
      if (emergencyTemp) {
        const tempValue = getText(emergencyTemp, 'conditionMeasure');
        const tempType = getText(emergencyTemp, 'typeCode');
        const tempUnit = getAttribute(emergencyTemp, 'conditionMeasure', 'unitId');
        if (tempValue) {
          adrItem.emergencyTemperature = `${tempValue}${tempUnit ? ' ' + tempUnit : ''}${tempType ? ' (' + tempType + ')' : ''}`;
        }
      }
      
      if (adrItem.properShippingName || adrItem.unNumber || adrItem.hazardClass) {
        adrData.adrItems.push(adrItem);
      }
    }
  });

  return adrData;
}

