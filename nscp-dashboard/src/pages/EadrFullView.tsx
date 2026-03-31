import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { EadrComplianceSummary } from "@/types/eadr";
import {
  fetchEadrSummary,
  EADR_SCENARIOS,
  setEadrScenario,
  getEadrScenario,
} from "@/mock-efti/mock-eadr-api";

import EadrStatusBadge from "@/components/eadr/EadrStatusBadge";
import DegradedModeBanner from "@/components/eadr/DegradedModeBanner";
import DriverCompetenceSection from "@/components/eadr/DriverCompetenceSection";
import VehicleCertSection from "@/components/eadr/VehicleCertSection";
import PermitsSection from "@/components/eadr/PermitsSection";
import SignalsSection from "@/components/eadr/SignalsSection";

export default function EadrFullView() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const [summary, setSummary] = useState<EadrComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scenario, setScenario] = useState(getEadrScenario);

  const load = useCallback(async () => {
    setLoading(true);
    setSummary(null);
    try {
      const data = await fetchEadrSummary();
      setSummary(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleScenarioChange = (key: string) => {
    setEadrScenario(key as Parameters<typeof setEadrScenario>[0]);
    setScenario(key as ReturnType<typeof getEadrScenario>);
    load();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9]">
      <Header />

      <main className="flex-1 min-w-0 max-w-5xl mx-auto w-full p-6 flex flex-col gap-5">
        {/* Breadcrumb / back */}
        <div className="flex items-center gap-2 text-[13px]">
          <button
            onClick={() => navigate(`/inspection/${id}`)}
            className="text-[#002d74] hover:underline font-medium"
          >
            Inspekcija {id}
          </button>
          <span className="text-[#9aa5b4]">/</span>
          <span className="text-[#374151] font-semibold">eADR — Puni pregled</span>
        </div>

        {/* Header card */}
        <div className="bg-white border-2 border-[#ef9a9a] rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(198,40,40,0.1)]">
          <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-[#ffcdd2] bg-gradient-to-r from-[#fff5f5] to-white">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-[#ffebee] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#c62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-[20px] font-bold text-[#c62828]">
                  eADR — Provjera usklađenosti opasne robe
                </h1>
                <p className="text-[13px] text-[#b0616a] mt-0.5">
                  Puni radni prostor za detaljnu provjeru, pregledavanje dokumenata i usklađenost
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/inspection/${id}`)}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-[#002d74] border border-[#d6e2ff] bg-[#eef3ff] hover:bg-[#dce9ff] transition-colors whitespace-nowrap"
            >
              Povratak na inspekciju
            </button>
          </div>

          <div className="px-6 py-4">
            {/* Scenario picker */}
            <div className="flex items-center gap-2 flex-wrap mb-5">
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

            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-10 h-10 border-3 border-[#ef9a9a] border-t-[#c62828] rounded-full animate-spin" />
                <p className="text-[13px] text-[#9aa5b4]">Dohvaćanje eADR podataka…</p>
              </div>
            )}

            {!loading && summary && (
              <div className="flex flex-col gap-5">
                <EadrStatusBadge verdict={summary.overallVerdict} reasons={summary.verdictReasons} />
                {summary.degradedMode && <DegradedModeBanner reason={summary.degradedReason} />}

                <p className="text-[10px] text-[#9aa5b4] text-right -mt-2">
                  Dohvaćeno: {new Date(summary.retrievedAt).toLocaleTimeString("hr-HR")}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <DriverCompetenceSection cert={summary.driverCertificate} />
                  <VehicleCertSection cert={summary.vehicleCert} />
                </div>

                <PermitsSection permits={summary.permits} />
                <SignalsSection signals={summary.signals} />

                {/* Actions row */}
                <div className="flex items-center gap-3 pt-3 border-t border-[#eef0f4]">
                  <button
                    type="button"
                    onClick={load}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e2e8f2] text-[12px] font-semibold text-[#6b7a8d] hover:bg-[#f4f6f9] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Osvježi podatke
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e2e8f2] text-[12px] font-semibold text-[#6b7a8d] hover:bg-[#f4f6f9] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Izvezi izvještaj
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12px] font-semibold text-white bg-[#c62828] hover:bg-[#b71c1c] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Eskalacija — prijavi neusklađenost
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Placeholder for future deep-work sections */}
        <div className="border-2 border-dashed border-[#d5ddeb] rounded-xl p-8 text-center bg-[#fbfcff]">
          <p className="text-[14px] font-semibold text-[#374151] mb-1">
            Prošireni radni prostor
          </p>
          <p className="text-[12px] text-[#9aa5b4] max-w-lg mx-auto">
            Ovaj prostor je predviđen za detaljni pregled dokumenata, višekoračne provjere,
            duboku analizu iz FINIS/SOTAH sustava te interakciju s operativnim bazama podataka
            — funkcionalnosti koje će biti dodane u sljedećim fazama pilot projekta.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
