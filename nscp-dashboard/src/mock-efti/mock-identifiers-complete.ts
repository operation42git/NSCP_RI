/**
 * Same mock payload as portal-mock MockApiInterceptor.MOCK_IDENTIFIERS_COMPLETE
 */
import type { IdentifiersResponse } from "./types";

export function getMockIdentifiersComplete(requestId: string): IdentifiersResponse {
  return {
    requestId,
    status: "COMPLETE",
    errorCode: "",
    errorDescription: "",
    identifiers: [
      {
        gateIndicator: "HR",
        status: "COMPLETE",
        errorCode: "",
        errorDescription: "",
        consignments: [
          {
            id: 1,
            gateId: "croatia",
            datasetId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
            platformId: "croatia eFTI platform",
            carrierAcceptanceDatetime: "2026-03-15T08:00:00+01:00",
            deliveryEventActualOccurrenceDatetime: "2026-03-17T14:30:00+01:00",
            mainCarriageTransportMovement: [
              {
                id: 1,
                schemeAgencyId: "HR-REG",
                modeCode: 3,
                dangerousGoodsIndicator: "true",
                registrationCountryCode: "HR",
              },
            ],
            usedTransportEquipment: [
              {
                id: 1,
                sequenceNumber: 1,
                schemeAgencyId: "ZG-1234-AB",
                registrationCountryCode: "HR",
                categoryCode: "TRUCK",
                carriedTransportEquipment: [
                  { id: 1, sequenceNumber: 1, schemeAgencyId: "ZG-T-5678" },
                ],
              },
            ],
          },
          {
            id: 2,
            gateId: "croatia",
            datasetId: "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e",
            platformId: "croatia eFTI platform",
            carrierAcceptanceDatetime: "2026-03-10T06:30:00+01:00",
            deliveryEventActualOccurrenceDatetime: "2026-03-12T18:00:00+01:00",
            mainCarriageTransportMovement: [
              {
                id: 2,
                schemeAgencyId: "HR-REG",
                modeCode: 3,
                dangerousGoodsIndicator: "false",
                registrationCountryCode: "HR",
              },
            ],
            usedTransportEquipment: [
              {
                id: 2,
                sequenceNumber: 1,
                schemeAgencyId: "RI-5432-CD",
                registrationCountryCode: "HR",
                categoryCode: "VAN",
                carriedTransportEquipment: [],
              },
            ],
          },
        ],
      },
      {
        gateIndicator: "AT",
        status: "COMPLETE",
        errorCode: "",
        errorDescription: "",
        consignments: [
          {
            id: 3,
            gateId: "austria",
            datasetId: "c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f",
            platformId: "austria eFTI platform",
            carrierAcceptanceDatetime: "2026-03-14T07:00:00+01:00",
            deliveryEventActualOccurrenceDatetime: "2026-03-15T16:45:00+01:00",
            mainCarriageTransportMovement: [
              {
                id: 3,
                schemeAgencyId: "AT-REG",
                modeCode: 3,
                dangerousGoodsIndicator: "false",
                registrationCountryCode: "AT",
              },
            ],
            usedTransportEquipment: [
              {
                id: 3,
                sequenceNumber: 1,
                schemeAgencyId: "W-98765-X",
                registrationCountryCode: "AT",
                categoryCode: "TRUCK",
                carriedTransportEquipment: [
                  { id: 2, sequenceNumber: 1, schemeAgencyId: "W-T-4321" },
                ],
              },
            ],
          },
        ],
      },
      {
        gateIndicator: "SI",
        status: "COMPLETE",
        errorCode: "",
        errorDescription: "",
        consignments: [
          {
            id: 4,
            gateId: "slovenia",
            datasetId: "d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a",
            platformId: "slovenia eFTI platform",
            carrierAcceptanceDatetime: "2026-03-13T09:15:00+01:00",
            deliveryEventActualOccurrenceDatetime: "2026-03-14T11:30:00+01:00",
            mainCarriageTransportMovement: [
              {
                id: 4,
                schemeAgencyId: "SI-REG",
                modeCode: 3,
                dangerousGoodsIndicator: "false",
                registrationCountryCode: "SI",
              },
            ],
            usedTransportEquipment: [
              {
                id: 4,
                sequenceNumber: 1,
                schemeAgencyId: "LJ-2233-MB",
                registrationCountryCode: "SI",
                categoryCode: "TRUCK",
                carriedTransportEquipment: [],
              },
            ],
          },
        ],
      },
      {
        gateIndicator: "DE",
        status: "TIMEOUT",
        errorCode: "TIMEOUT",
        errorDescription:
          "Gate did not respond within the configured timeout period",
        consignments: [],
      },
    ],
  };
}
