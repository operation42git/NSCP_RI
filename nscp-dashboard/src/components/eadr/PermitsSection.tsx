import { useState } from "react";
import type { TransportPermit } from "@/types/eadr";
import DataProvenanceTag from "./DataProvenanceTag";

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  approved:     { bg: "#e8f5e9", text: "#2e7d32", label: "Odobreno" },
  pending:      { bg: "#e3f2fd", text: "#1565c0", label: "U obradi" },
  denied:       { bg: "#ffebee", text: "#c62828", label: "Odbijeno" },
  not_required: { bg: "#f5f5f5", text: "#757575", label: "Nije potrebno" },
  unknown:      { bg: "#fff8e1", text: "#e65100", label: "Nepoznato" },
};

export default function PermitsSection({ permits }: { permits: TransportPermit[] }) {
  const [open, setOpen] = useState(true);

  if (permits.length === 0) return null;

  const allOk = permits.every(
    (p) => p.status === "approved" || p.status === "not_required"
  );
  const anyDenied = permits.some((p) => p.status === "denied");
  const headerBadge = anyDenied
    ? { bg: "#ffebee", text: "#c62828", label: "Postoji odbijanje" }
    : allOk
      ? { bg: "#e8f5e9", text: "#2e7d32", label: "U redu" }
      : { bg: "#fff8e1", text: "#e65100", label: "Provjera" };

  return (
    <div className="border border-[#e2e8f2] rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fafbff] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#f3e5f5] flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-[#7b1fa2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-[#1d2a3a]">Dozvole i najave</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: headerBadge.bg, color: headerBadge.text }}
          >
            {headerBadge.label}
          </span>
          <span className="text-[10px] text-[#9aa5b4]">{permits.length}</span>
        </div>
        <svg
          className={`w-4 h-4 text-[#9aa5b4] transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="border-t border-[#eef0f4] flex flex-col divide-y divide-[#f0f3f8]">
          {permits.map((p, i) => {
            const ss = STATUS_STYLE[p.status] ?? STATUS_STYLE.unknown;
            const unavailable = p.provenance.status === "unavailable" || p.provenance.status === "error";

            return (
              <div key={p.permitId ?? i} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold text-[#1d2a3a]">
                      {p.typeLabel ?? p.type}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ backgroundColor: ss.bg, color: ss.text }}
                    >
                      {ss.label}
                    </span>
                  </div>
                  <DataProvenanceTag prov={p.provenance} />
                </div>

                {unavailable ? (
                  <p className="text-[11px] text-[#9aa5b4] italic">
                    {p.provenance.errorReason ?? "Podaci nedostupni"}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {p.permitId && (
                      <span className="text-[11px] text-[#6b7a8d]">ID: {p.permitId}</span>
                    )}
                    {p.issuingAuthority && (
                      <span className="text-[11px] text-[#6b7a8d]">Izdao: {p.issuingAuthority}</span>
                    )}
                    {(p.issuedDate || p.validTo) && (
                      <span className="text-[11px] text-[#6b7a8d]">
                        {p.issuedDate && `Od: ${p.issuedDate}`}
                        {p.issuedDate && p.validTo && " · "}
                        {p.validTo && `Do: ${p.validTo}`}
                      </span>
                    )}
                    {p.routeRestrictions && (
                      <p className="text-[11px] text-[#374151] bg-[#f9fbff] rounded px-2 py-1.5 mt-1 border border-[#eef0f4] leading-snug">
                        {p.routeRestrictions}
                      </p>
                    )}
                    {p.notes && (
                      <p className="text-[11px] text-[#6b7a8d] italic">{p.notes}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
