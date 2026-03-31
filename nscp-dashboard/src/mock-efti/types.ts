export type RequestStatus =
  | "PENDING"
  | "COMPLETE"
  | "ERROR"
  | "TIMEOUT";

export interface TransportMovement {
  id: number;
  schemeAgencyId?: string;
  modeCode: number;
  dangerousGoodsIndicator?: string;
  registrationCountryCode?: string;
}

export interface CarriedEquipment {
  id: number;
  sequenceNumber: number;
  schemeAgencyId?: string;
}

export interface UsedTransportEquipment {
  id: number;
  sequenceNumber: number;
  schemeAgencyId?: string;
  registrationCountryCode?: string;
  categoryCode?: string;
  carriedTransportEquipment?: CarriedEquipment[];
}

export interface Consignment {
  id: number;
  gateId: string;
  datasetId: string;
  platformId: string;
  carrierAcceptanceDatetime: string;
  deliveryEventActualOccurrenceDatetime: string;
  mainCarriageTransportMovement?: TransportMovement[];
  usedTransportEquipment?: UsedTransportEquipment[];
}

export interface IdentifierGateResult {
  gateIndicator: string;
  status: RequestStatus;
  errorCode?: string;
  errorDescription?: string;
  consignments: Consignment[];
}

export interface IdentifiersResponse {
  requestId: string;
  status: RequestStatus;
  errorCode?: string;
  errorDescription?: string;
  identifiers: IdentifierGateResult[];
}

export interface IdentifiersSearchBody {
  modeCode: string | null;
  identifier: string;
  identifierType: string[];
  registrationCountryCode: string | null;
  dangerousGoodsIndicator: boolean | null;
  eftiGateIndicator: string[];
}

export interface UilSearchBody {
  datasetId: string;
  platformId: string;
  gateId: string;
}

export interface UilResultRow {
  requestId: string;
  status: RequestStatus;
  datasetId: string;
  gateId: string;
  platformId: string;
  errorCode?: string;
  errorDescription?: string;
  data?: string;
}
