import { useState } from "react";
import type { EnforcementSignal } from "@/types/eadr";
import DataProvenanceTag from "./DataProvenanceTag";

const SEVERITY_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  info:     { bg: "#f9fbff", text: "#374151", border: "#e2e8f2", dot: "#1565c0" },
  warning:  { bg: "#fff8e1", text: "#e65100", border: "#ffe0b2", dot: "#e65100" },
  critical: { bg: "#ffebee", text: "#c62828", border: "#ef9a9a", dot: "#c62828" },
};

export default function SignalsSection({ signals }: { signals: EnforcementSignal[] }) {
  const [open, setOpen] = useState(true);

  if (signals.length === 0) return null;

  const hasCritical = signals.some((s) => s.severity === "critical");
  const hasWarning = signals.some((s) => s.severity === "warning");
  const headerColor = hasCritical ? "#c62828" : hasWarning ? "#e65100" : "#1565c0";

  return (
    <div className="border border-[#e2e8f2] rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fafbff] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#e8eaf6] flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-[#283593]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-[#1d2a3a]">Signali (FINIS / SOTAH)</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              backgroundColor: hasCritical ? "#ffebee" : hasWarning ? "#fff8e1" : "#e8f5e9",
              color: headerColor,
            }}
          >
            {signals.length}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-[#9aa5b4] transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t border-[#eef0f4] flex flex-col gap-2 p-3">
          {signals.map((sig, i) => {
            const sv = SEVERITY_STYLE[sig.severity] ?? SEVERITY_STYLE.info;
            const isPending = sig.provenance.status === "pending";

            return (
              <div
                key={i}
                className="rounded-lg border px-3 py-2.5"
                style={{ backgroundColor: sv.bg, borderColor: sv.border }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sv.dot }}
                    />
                    <span className="text-[12px] font-semibold" style={{ color: sv.text }}>
                      {sig.source}
                    </span>
                  </div>
                  <DataProvenanceTag prov={sig.provenance} />
                </div>
                <p
                  className={`text-[12px] leading-snug ${isPending ? "italic" : ""}`}
                  style={{ color: sv.text }}
                >
                  {sig.summary}
                </p>
                {sig.detail && !isPending && (
                  <p className="text-[11px] text-[#6b7a8d] mt-1 leading-snug">
                    {sig.detail}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
