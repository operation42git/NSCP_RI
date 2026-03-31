import type { DataProvenance } from "@/types/eadr";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  loaded:      { bg: "#e8f5e9", text: "#2e7d32", dot: "#2e7d32", label: "Dohvaćeno" },
  pending:     { bg: "#e3f2fd", text: "#1565c0", dot: "#1565c0", label: "Dohvaćanje…" },
  partial:     { bg: "#fff8e1", text: "#f57f17", dot: "#f57f17", label: "Djelomično" },
  unavailable: { bg: "#f3e5f5", text: "#7b1fa2", dot: "#7b1fa2", label: "Nedostupno" },
  error:       { bg: "#fce4ec", text: "#c62828", dot: "#c62828", label: "Greška" },
};

function formatTime(iso?: string): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return null;
  }
}

export default function DataProvenanceTag({ prov }: { prov: DataProvenance }) {
  const s = STATUS_STYLES[prov.status] ?? STATUS_STYLES.error;
  const time = formatTime(prov.fetchedAt);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}
      title={prov.errorReason ?? `${prov.source}${time ? ` @ ${time}` : ""}`}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.dot }} />
      {prov.source}
      {time && <span className="opacity-70">@ {time}</span>}
    </span>
  );
}
