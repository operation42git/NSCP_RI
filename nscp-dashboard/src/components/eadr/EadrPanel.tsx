import { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { EadrComplianceSummary } from "@/types/eadr";
import {
  fetchEadrSummary,
  EADR_SCENARIOS,
  setEadrScenario,
  getEadrScenario,
} from "@/mock-efti/mock-eadr-api";

import EadrStatusBadge from "./EadrStatusBadge";
import DegradedModeBanner from "./DegradedModeBanner";
import DriverCompetenceSection from "./DriverCompetenceSection";
import VehicleCertSection from "./VehicleCertSection";
import PermitsSection from "./PermitsSection";
import SignalsSection from "./SignalsSection";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleReg?: string;
  driverName?: string;
  onOpenFullView?: () => void;
}

export default function EadrPanel({
  open,
  onOpenChange,
  vehicleReg,
  driverName,
  onOpenFullView,
}: Props) {
  const [summary, setSummary] = useState<EadrComplianceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState(getEadrScenario);

  const load = useCallback(async () => {
    setLoading(true);
    setSummary(null);
    try {
      const data = await fetchEadrSummary(vehicleReg, driverName);
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, [vehicleReg, driverName]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleScenarioChange = (key: string) => {
    setEadrScenario(key as Parameters<typeof setEadrScenario>[0]);
    setScenario(key as ReturnType<typeof getEadrScenario>);
    load();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[540px] sm:max-w-[540px] p-0 flex flex-col overflow-hidden"
      >
        {/* ── Header ── */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-[#ffcdd2] bg-gradient-to-r from-[#fff5f5] to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#ffebee] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[#c62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <SheetTitle className="text-[16px] font-bold text-[#c62828]">
                eADR — Provjera usklađenosti
              </SheetTitle>
              <SheetDescription className="text-[11px] text-[#b0616a] mt-0.5">
                Podaci iz vanjskih registara za ADR prijevoz
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Scenario picker (dev/demo tool) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold">
              Scenarij:
            </span>
            {EADR_SCENARIOS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => handleScenarioChange(s.key)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                  scenario === s.key
                    ? "bg-[#002d74] text-white"
                    : "bg-[#f0f3f9] text-[#40536f] hover:bg-[#e4eaf5]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-3 border-[#ef9a9a] border-t-[#c62828] rounded-full animate-spin" />
              <p className="text-[12px] text-[#9aa5b4]">Dohvaćanje eADR podataka…</p>
            </div>
          )}

          {/* Data loaded */}
          {!loading && summary && (
            <>
              {/* Verdict badge */}
              <EadrStatusBadge
                verdict={summary.overallVerdict}
                reasons={summary.verdictReasons}
              />

              {/* Degraded mode warning */}
              {summary.degradedMode && (
                <DegradedModeBanner reason={summary.degradedReason} />
              )}

              {/* Timestamp */}
              <p className="text-[10px] text-[#9aa5b4] text-right -mt-2">
                Dohvaćeno: {new Date(summary.retrievedAt).toLocaleTimeString("hr-HR")}
              </p>

              {/* Sections */}
              <DriverCompetenceSection cert={summary.driverCertificate} />
              <VehicleCertSection cert={summary.vehicleCert} />
              <PermitsSection permits={summary.permits} />
              <SignalsSection signals={summary.signals} />

              {/* Refresh button */}
              <button
                type="button"
                onClick={load}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#e2e8f2] text-[12px] font-semibold text-[#6b7a8d] hover:bg-[#f4f6f9] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Osvježi podatke
              </button>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 border-t border-[#eef0f4] bg-[#f9fbff] px-5 py-3 flex items-center justify-between">
          <span className="text-[10px] text-[#9aa5b4]">
            eADR modul · v0.1 pilot
          </span>
          {onOpenFullView && (
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onOpenFullView();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold text-[#002d74] border border-[#d6e2ff] bg-[#eef3ff] hover:bg-[#dce9ff] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              Otvori puni eADR pregled
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
