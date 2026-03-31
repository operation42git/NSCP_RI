import type { ComplianceVerdict } from "@/types/eadr";

const VERDICT_CFG: Record<ComplianceVerdict, { bg: string; text: string; border: string; icon: string; label: string }> = {
  compliant: {
    bg: "#e8f5e9", text: "#1b5e20", border: "#a5d6a7",
    icon: "M5 13l4 4L19 7",
    label: "Usklađeno s ADR",
  },
  non_compliant: {
    bg: "#ffebee", text: "#b71c1c", border: "#ef9a9a",
    icon: "M6 18L18 6M6 6l12 12",
    label: "Neusklađenost utvrđena",
  },
  partial: {
    bg: "#fff8e1", text: "#e65100", border: "#ffe0b2",
    icon: "M12 9v2m0 4h.01",
    label: "Djelomična procjena",
  },
  unknown: {
    bg: "#f5f5f5", text: "#616161", border: "#e0e0e0",
    icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01",
    label: "Nije moguće procijeniti",
  },
};

export default function EadrStatusBadge({ verdict, reasons }: { verdict: ComplianceVerdict; reasons: string[] }) {
  const cfg = VERDICT_CFG[verdict];

  return (
    <div
      className="rounded-xl border-2 px-4 py-3"
      style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cfg.border }}
        >
          <svg className="w-4 h-4" fill="none" stroke={cfg.text} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={cfg.icon} />
          </svg>
        </div>
        <span className="text-[15px] font-bold" style={{ color: cfg.text }}>
          {cfg.label}
        </span>
      </div>
      {reasons.length > 0 && (
        <ul className="ml-[42px] flex flex-col gap-0.5">
          {reasons.map((r, i) => (
            <li key={i} className="text-[11px] leading-snug" style={{ color: cfg.text }}>
              {r}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
