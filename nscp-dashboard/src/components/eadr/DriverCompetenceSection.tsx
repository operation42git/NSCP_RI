import { useState } from "react";
import type { DriverCertificate } from "@/types/eadr";
import DataProvenanceTag from "./DataProvenanceTag";

const VALIDITY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  valid:     { bg: "#e8f5e9", text: "#2e7d32", label: "Valjana" },
  expired:   { bg: "#ffebee", text: "#c62828", label: "Istekla" },
  suspended: { bg: "#fff3e0", text: "#e65100", label: "Suspendirana" },
  unknown:   { bg: "#f5f5f5", text: "#757575", label: "Nepoznato" },
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold">{label}</span>
      {value ? (
        <span className="text-[13px] text-[#1d2a3a] font-medium">{value}</span>
      ) : (
        <span className="text-[13px] text-[#c4cdd8] italic">—</span>
      )}
    </div>
  );
}

export default function DriverCompetenceSection({ cert }: { cert?: DriverCertificate }) {
  const [open, setOpen] = useState(true);

  if (!cert) return null;

  const vs = VALIDITY_STYLE[cert.validityStatus] ?? VALIDITY_STYLE.unknown;
  const unavailable = cert.provenance.status === "unavailable" || cert.provenance.status === "error";

  return (
    <div className="border border-[#e2e8f2] rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fafbff] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#e3f2fd] flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-[#1565c0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-[#1d2a3a]">Vozač — ADR osposobljenost</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ backgroundColor: vs.bg, color: vs.text }}
          >
            {vs.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DataProvenanceTag prov={cert.provenance} />
          <svg
            className={`w-4 h-4 text-[#9aa5b4] transition-transform duration-200 ${open ? "rotate-90" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pb-4 pt-1 border-t border-[#eef0f4]">
          {unavailable ? (
            <p className="text-[12px] text-[#9aa5b4] italic py-2">
              {cert.provenance.errorReason ?? "Podaci o vozaču nedostupni"}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Ime vozača" value={cert.driverName} />
                <Field label="OIB" value={cert.driverOIB} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Broj potvrde" value={cert.certificateId} />
                <Field label="Izdao" value={cert.issuingAuthority} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Datum izdavanja" value={cert.issuedDate} />
                <Field label="Vrijedi do" value={cert.expiryDate} />
              </div>
              {cert.categories && cert.categories.length > 0 && (
                <div className="mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold block mb-1">Kategorije</span>
                  <div className="flex flex-wrap gap-1.5">
                    {cert.categories.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#e3f2fd] text-[#1565c0]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {cert.evidenceUri && (
                <a
                  href={cert.evidenceUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#1565c0] border border-[#90caf9] rounded-md hover:bg-[#e3f2fd] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Prikaži certifikat
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
