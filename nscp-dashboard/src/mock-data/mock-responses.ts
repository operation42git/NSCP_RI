/**
 * Stub file for mock API responses.
 * Each screen's mock data will be added here as we port it from the Angular project.
 */

export interface IdentifiersSearchResponse {
  requestId: string;
  status: "PENDING" | "COMPLETE" | "ERROR";
  identifiers: IdentifierResult[];
}

export interface IdentifierResult {
  gateId: string;
  platformId: string;
  datasetId: string;
  vehicleId: string;
  transportMode: string;
  isDangerousGoods: boolean;
  countryStart: string;
  countryEnd: string;
}

export interface UilSearchResponse {
  requestId: string;
  status: "PENDING" | "COMPLETE" | "ERROR";
  uilData: string | null;
}

// Placeholder: will be populated per-screen as we port logic
export const MOCK_IDENTIFIERS_RESPONSE: IdentifiersSearchResponse = {
  requestId: "mock-req-001",
  status: "COMPLETE",
  identifiers: [
    {
      gateId: "HR",
      platformId: "acme",
      datasetId: "06293b05-19d5-4e73-b18f-d193f97d3ac6",
      vehicleId: "ZG-1234-AB",
      transportMode: "Road",
      isDangerousGoods: true,
      countryStart: "HR",
      countryEnd: "DE",
    },
    {
      gateId: "AT",
      platformId: "massive",
      datasetId: "8c13b3be-fe2e-4852-80b5-99ffc0609764",
      vehicleId: "W-5678-CD",
      transportMode: "Road",
      isDangerousGoods: false,
      countryStart: "AT",
      countryEnd: "IT",
    },
  ],
};

export const MOCK_UIL_RESPONSE: UilSearchResponse = {
  requestId: "mock-req-002",
  status: "COMPLETE",
  uilData: null,
};
