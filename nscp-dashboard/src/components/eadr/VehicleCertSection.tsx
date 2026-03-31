import { useState } from "react";
import type { VehicleAdrCert } from "@/types/eadr";
import DataProvenanceTag from "./DataProvenanceTag";

const VALIDITY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  valid:     { bg: "#e8f5e9", text: "#2e7d32", label: "Valjan" },
  expired:   { bg: "#ffebee", text: "#c62828", label: "Istekao" },
  suspended: { bg: "#fff3e0", text: "#e65100", label: "Suspendiran" },
  unknown:   { bg: "#f5f5f5", text: "#757575", label: "Nepoznato" },
};

const INSPECTION_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  passed:  { bg: "#e8f5e9", text: "#2e7d32", label: "Uredan" },
  due:     { bg: "#fff8e1", text: "#f57f17", label: "Dospijeva" },
  overdue: { bg: "#ffebee", text: "#c62828", label: "Prekoračen" },
  unknown: { bg: "#f5f5f5", text: "#757575", label: "Nepoznato" },
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

export default function VehicleCertSection({ cert }: { cert?: VehicleAdrCert }) {
  const [open, setOpen] = useState(true);

  if (!cert) return null;

  const vs = VALIDITY_STYLE[cert.validityStatus] ?? VALIDITY_STYLE.unknown;
  const is = INSPECTION_STYLE[cert.annualInspectionStatus ?? "unknown"] ?? INSPECTION_STYLE.unknown;
  const unavailable = cert.provenance.status === "unavailable" || cert.provenance.status === "error";

  return (
    <div className="border border-[#e2e8f2] rounded-lg overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fafbff] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#fce4ec] flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-[#c62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zm0 0h6m-6 0a1 1 0 001 1h4a1 1 0 001-1v-5a1 1 0 00-1-1h-2l-3 3z" />
            </svg>
          </div>
          <span className="text-[13px] font-semibold text-[#1d2a3a]">Vozilo — ADR certifikat</span>
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
              {cert.provenance.errorReason ?? "Podaci o vozilu nedostupni"}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Registracija" value={cert.vehicleRegNumber} />
                <Field label="Tip vozila (ADR)" value={cert.vehicleType} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Broj certifikata" value={cert.certificateId} />
                <Field label="Izdao" value={cert.issuingAuthority} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Vrijedi od" value={cert.validFrom} />
                <Field label="Vrijedi do" value={cert.validTo} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold">
                  Godišnji tehnički pregled
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: is.bg, color: is.text }}
                >
                  {is.label}
                </span>
                {cert.inspectionDate && (
                  <span className="text-[11px] text-[#6b7a8d]">{cert.inspectionDate}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
