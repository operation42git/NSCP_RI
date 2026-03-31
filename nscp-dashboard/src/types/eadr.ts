/**
 * eADR module types.
 *
 * These types model the additional dangerous-goods enforcement data
 * that comes from external registries (driver certs, vehicle ADR certs,
 * transport permits, FINIS/SOTAH signals) — i.e. data that is NOT part
 * of the eFTI consignment XML but is retrieved on demand when a
 * shipment is flagged as ADR.
 */

export type FetchStatus = "loaded" | "pending" | "partial" | "unavailable" | "error";

export interface DataProvenance {
  source: string;
  fetchedAt?: string;
  status: FetchStatus;
  errorReason?: string;
}

// ── Group A: Driver competence ──

export type CertValidity = "valid" | "expired" | "suspended" | "unknown";

export interface DriverCertificate {
  certificateId?: string;
  driverName?: string;
  driverOIB?: string;
  categories?: string[];
  issuedDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  validityStatus: CertValidity;
  evidenceUri?: string;
  provenance: DataProvenance;
}

// ── Group B: Vehicle ADR certification ──

export type InspectionStatus = "passed" | "due" | "overdue" | "unknown";

export interface VehicleAdrCert {
  vehicleRegNumber?: string;
  vehicleType?: string;
  certificateId?: string;
  validFrom?: string;
  validTo?: string;
  validityStatus: CertValidity;
  annualInspectionStatus?: InspectionStatus;
  inspectionDate?: string;
  issuingAuthority?: string;
  provenance: DataProvenance;
}

// ── Group C: Permits & announced transport ──

export type PermitType =
  | "explosives"
  | "radioactive"
  | "hcdg_notification"
  | "route_restriction"
  | "other";

export type PermitStatus =
  | "approved"
  | "pending"
  | "denied"
  | "not_required"
  | "unknown";

export interface TransportPermit {
  permitId?: string;
  type: PermitType;
  typeLabel?: string;
  status: PermitStatus;
  issuingAuthority?: string;
  issuedDate?: string;
  validTo?: string;
  routeRestrictions?: string;
  notes?: string;
  provenance: DataProvenance;
}

// ── Group D: Enforcement signals (FINIS / SOTAH) ──

export type SignalSeverity = "info" | "warning" | "critical";

export interface EnforcementSignal {
  source: string;
  signalType: "violation_history" | "risk_score" | "open_case" | "alert";
  severity: SignalSeverity;
  summary: string;
  detail?: string;
  provenance: DataProvenance;
}

// ── Composite summary ──

export type ComplianceVerdict = "compliant" | "non_compliant" | "partial" | "unknown";

export interface EadrComplianceSummary {
  overallVerdict: ComplianceVerdict;
  verdictReasons: string[];
  driverCertificate?: DriverCertificate;
  vehicleCert?: VehicleAdrCert;
  permits: TransportPermit[];
  signals: EnforcementSignal[];
  retrievedAt: string;
  degradedMode: boolean;
  degradedReason?: string;
}
