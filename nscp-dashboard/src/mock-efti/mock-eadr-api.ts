/**
 * Mock eADR API — simulates fetching cross-registry enforcement data.
 *
 * Provides realistic Croatian mock data matching the sample inspection
 * (driver: Ivan Kovačević, vehicle: ZG-1234-AB, UN 1090 ACETONE).
 */
import type {
  EadrComplianceSummary,
  DriverCertificate,
  VehicleAdrCert,
  TransportPermit,
  EnforcementSignal,
  FetchStatus,
} from "@/types/eadr";

type DegradedScenario = "full" | "partial" | "degraded" | "offline";

const SCENARIOS: Record<DegradedScenario, Record<string, FetchStatus>> = {
  full:     { driver: "loaded", vehicle: "loaded", permits: "loaded", signals: "loaded" },
  partial:  { driver: "loaded", vehicle: "loaded", permits: "unavailable", signals: "pending" },
  degraded: { driver: "partial", vehicle: "error", permits: "unavailable", signals: "unavailable" },
  offline:  { driver: "unavailable", vehicle: "unavailable", permits: "unavailable", signals: "unavailable" },
};

let activeScenario: DegradedScenario = "full";

export function setEadrScenario(s: DegradedScenario) {
  activeScenario = s;
}

export function getEadrScenario(): DegradedScenario {
  return activeScenario;
}

export const EADR_SCENARIOS: { key: DegradedScenario; label: string }[] = [
  { key: "full",     label: "Puni podaci" },
  { key: "partial",  label: "Djelomični" },
  { key: "degraded", label: "Degradirani" },
  { key: "offline",  label: "Offline" },
];

function now(): string {
  return new Date().toISOString();
}

function buildDriverCert(): DriverCertificate {
  const s = SCENARIOS[activeScenario].driver;
  return {
    certificateId: s === "loaded" || s === "partial" ? "ADR-HR-2024-V-08812" : undefined,
    driverName: "Ivan Kovačević",
    driverOIB: "98765432109",
    categories: s === "loaded" ? ["Osnovno", "Klasa 1", "Cisterne"] : s === "partial" ? ["Osnovno"] : undefined,
    issuedDate: "12.03.2024.",
    expiryDate: "12.03.2029.",
    issuingAuthority: "HAK — Hrvatski autoklub",
    validityStatus: s === "loaded" || s === "partial" ? "valid" : "unknown",
    evidenceUri: s === "loaded" ? "https://eadr.hr/certs/ADR-HR-2024-V-08812.pdf" : undefined,
    provenance: {
      source: "HR-ADR-CERT-DB",
      fetchedAt: s !== "unavailable" ? now() : undefined,
      status: s as FetchStatus,
      errorReason: s === "error" ? "Sustav nedostupan — pokušajte kasnije" : s === "unavailable" ? "Veza sa sustavom nije moguća" : undefined,
    },
  };
}

function buildVehicleCert(): VehicleAdrCert {
  const s = SCENARIOS[activeScenario].vehicle;
  return {
    vehicleRegNumber: "ZG-1234-AB",
    vehicleType: s === "loaded" ? "FL" : undefined,
    certificateId: s === "loaded" ? "ADR-VOZ-HR-2025-00341" : undefined,
    validFrom: s === "loaded" ? "01.06.2025." : undefined,
    validTo: s === "loaded" ? "01.06.2026." : undefined,
    validityStatus: s === "loaded" ? "valid" : "unknown",
    annualInspectionStatus: s === "loaded" ? "passed" : "unknown",
    inspectionDate: s === "loaded" ? "15.01.2026." : undefined,
    issuingAuthority: s === "loaded" ? "HAK — Stanica za tehnički pregled" : undefined,
    provenance: {
      source: "HR-VEHICLE-REGISTRY",
      fetchedAt: s !== "unavailable" ? now() : undefined,
      status: s as FetchStatus,
      errorReason: s === "error" ? "Greška pri dohvatu iz registra vozila" : s === "unavailable" ? "Registar vozila nedostupan" : undefined,
    },
  };
}

function buildPermits(): TransportPermit[] {
  const s = SCENARIOS[activeScenario].permits;
  if (s === "unavailable" || s === "error") {
    return [
      {
        type: "explosives",
        typeLabel: "Eksplozivi (MUP/OKC)",
        status: "unknown",
        provenance: { source: "MUP-OKC", fetchedAt: undefined, status: s as FetchStatus, errorReason: "Sustav MUP-OKC nije dostupan" },
      },
      {
        type: "radioactive",
        typeLabel: "Radioaktivni materijali (DZRNS)",
        status: "unknown",
        provenance: { source: "DZRNS", fetchedAt: undefined, status: s as FetchStatus, errorReason: "Sustav DZRNS nije dostupan" },
      },
    ];
  }
  return [
    {
      permitId: "EXP-2026-HR-00129",
      type: "explosives",
      typeLabel: "Eksplozivi (MUP/OKC)",
      status: "not_required",
      issuingAuthority: "MUP — Ravnateljstvo policije",
      notes: "UN 1090 (Klasa 3) ne zahtijeva posebnu dozvolu MUP-a",
      provenance: { source: "MUP-OKC", fetchedAt: now(), status: "loaded" },
    },
    {
      permitId: "RAD-2026-HR-N/A",
      type: "radioactive",
      typeLabel: "Radioaktivni materijali (DZRNS)",
      status: "not_required",
      issuingAuthority: "DZRNS",
      notes: "Pošiljka ne sadrži radioaktivne materijale",
      provenance: { source: "DZRNS", fetchedAt: now(), status: "loaded" },
    },
    {
      permitId: "HCDG-2026-HR-04418",
      type: "hcdg_notification",
      typeLabel: "Najava HCDG prijevoza",
      status: "approved",
      issuingAuthority: "MUP — OKC",
      issuedDate: "27.03.2026.",
      validTo: "30.03.2026.",
      notes: "Najava prihvaćena za rutu Zagreb → München via Spielfeld",
      provenance: { source: "MUP-OKC", fetchedAt: now(), status: "loaded" },
    },
    {
      type: "route_restriction",
      typeLabel: "Ograničenja rute",
      status: "approved",
      routeRestrictions: "Tunel D/E ograničenje: zabranjeno korištenje tunela kategorije D i E. Ruta preko Spielfeld/Šentilj zadovoljava uvjete.",
      provenance: { source: "HR-ROUTE-DB", fetchedAt: now(), status: "loaded" },
    },
  ];
}

function buildSignals(): EnforcementSignal[] {
  const s = SCENARIOS[activeScenario].signals;
  if (s === "unavailable" || s === "error" || s === "pending") {
    return [
      {
        source: "FINIS",
        signalType: "violation_history",
        severity: "info",
        summary: s === "pending" ? "Dohvaćanje podataka iz FINIS-a..." : "FINIS sustav nedostupan",
        provenance: { source: "FINIS", fetchedAt: undefined, status: s as FetchStatus },
      },
    ];
  }
  return [
    {
      source: "FINIS",
      signalType: "violation_history",
      severity: "info",
      summary: "Nema zabilježenih prekršaja za prijevoznika u posljednjih 12 mjeseci",
      detail: "Prijevoznička d.o.o. (OIB: 11122233344) — 0 prekršaja, 0 otvorenih postupaka",
      provenance: { source: "FINIS", fetchedAt: now(), status: "loaded" },
    },
    {
      source: "SOTAH",
      signalType: "risk_score",
      severity: "info",
      summary: "Razina rizika: NISKA (ocjena 12/100)",
      detail: "Temeljem SOTAH analize: stabilan vozač, redoviti prijevoznik, uredna dokumentacija u prethodnim kontrolama",
      provenance: { source: "SOTAH", fetchedAt: now(), status: "loaded" },
    },
  ];
}

function deriveVerdict(
  driver: DriverCertificate,
  vehicle: VehicleAdrCert,
  permits: TransportPermit[],
  signals: EnforcementSignal[],
): { verdict: EadrComplianceSummary["overallVerdict"]; reasons: string[]; degraded: boolean; degradedReason?: string } {
  const reasons: string[] = [];
  let hasError = false;
  let hasUnknown = false;

  if (driver.provenance.status === "unavailable" || driver.provenance.status === "error") hasUnknown = true;
  if (vehicle.provenance.status === "unavailable" || vehicle.provenance.status === "error") hasUnknown = true;

  if (driver.validityStatus === "valid") reasons.push("Vozačka ADR potvrda valjana");
  else if (driver.validityStatus === "expired") { reasons.push("Vozačka ADR potvrda ISTEKLA"); hasError = true; }
  else if (driver.validityStatus === "suspended") { reasons.push("Vozačka ADR potvrda SUSPENDIRANA"); hasError = true; }

  if (vehicle.validityStatus === "valid") reasons.push("ADR certifikat vozila valjan");
  else if (vehicle.validityStatus === "expired") { reasons.push("ADR certifikat vozila ISTEKAO"); hasError = true; }

  if (vehicle.annualInspectionStatus === "overdue") { reasons.push("Godišnji tehnički pregled PREKORAČEN"); hasError = true; }
  else if (vehicle.annualInspectionStatus === "passed") reasons.push("Godišnji tehnički pregled uredan");

  const deniedPermit = permits.find((p) => p.status === "denied");
  if (deniedPermit) { reasons.push(`Dozvola odbijena: ${deniedPermit.typeLabel ?? deniedPermit.type}`); hasError = true; }

  const criticalSignal = signals.find((s) => s.severity === "critical");
  if (criticalSignal) { reasons.push(`Kritični signal: ${criticalSignal.summary}`); hasError = true; }

  const degraded = hasUnknown;
  const degradedReason = degraded ? "Neki sustavi nedostupni — prikazani su samo djelomični podaci" : undefined;

  let verdict: EadrComplianceSummary["overallVerdict"];
  if (hasError) verdict = "non_compliant";
  else if (hasUnknown) verdict = "partial";
  else verdict = "compliant";

  if (reasons.length === 0) reasons.push("Nedovoljno podataka za procjenu");

  return { verdict, reasons, degraded, degradedReason };
}

export async function fetchEadrSummary(_vehicleReg?: string, _driverName?: string): Promise<EadrComplianceSummary> {
  await new Promise((r) => setTimeout(r, 600));

  const driver = buildDriverCert();
  const vehicle = buildVehicleCert();
  const permits = buildPermits();
  const signals = buildSignals();
  const { verdict, reasons, degraded, degradedReason } = deriveVerdict(driver, vehicle, permits, signals);

  return {
    overallVerdict: verdict,
    verdictReasons: reasons,
    driverCertificate: driver,
    vehicleCert: vehicle,
    permits,
    signals,
    retrievedAt: now(),
    degradedMode: degraded,
    degradedReason,
  };
}
