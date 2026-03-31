export interface TransportMovement {
  id: number;
  schemeAgencyId: string;
  modeCode: number;
  dangerousGoodsIndicator: string;
  registrationCountryCode: string;
}

export interface CarriedTransportEquipment {
  id: number | string;
  sequenceNumber: number;
  schemeAgencyId?: string;
}

export interface UsedTransportEquipment {
  id: number | string;
  sequenceNumber: number;
  schemeAgencyId: string;
  registrationCountryCode: string;
  categoryCode: string;
  carriedTransportEquipment: CarriedTransportEquipment[];
}

export interface Identifier {
  id?: number;
  gateId: string;
  datasetId: string;
  platformId: string;
  carrierAcceptanceDatetime: string;
  deliveryEventActualOccurrenceDatetime: string;
  mainCarriageTransportMovement: TransportMovement[];
  usedTransportEquipment: UsedTransportEquipment[];
}

export interface IdentifiersRequestResult {
  gateIndicator: string;
  status: string;
  errorCode: string;
  errorDescription: string;
  consignments: Identifier[];
}

export interface IdentifiersSearchParams {
  modeCode?: string;
  identifier: string;
  identifierType: string[];
  registrationCountryCode?: string;
  dangerousGoodsIndicator: boolean | null;
  eftiGateIndicator: string[];
}

export interface IdentifiersResponse {
  eFTIGate?: string;
  requestId: string;
  status: string;
  errorCode?: string;
  errorDescription?: string;
  identifiers: IdentifiersRequestResult[];
}
