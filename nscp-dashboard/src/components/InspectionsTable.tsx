import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  INSPECTIONS,
  CURRENT_USER,
  type InspectionStatus,
  type InspectionListScope,
} from "@/data/inspections";

const STATUS_CONFIG: Record<InspectionStatus, { label: string; bg: string; text: string; dot: string }> = {
  "U tijeku": {
    label: "U tijeku",
    bg: "bg-[#fff8e1]",
    text: "text-[#e65100]",
    dot: "bg-[#fb8c00]",
  },
  "Završena": {
    label: "Završena",
    bg: "bg-[#e8f5e9]",
    text: "text-[#2e7d32]",
    dot: "bg-[#43a047]",
  },
};

interface Props {
  scope: InspectionListScope;
  search: string;
  statusFilter: string;
  reasonFilter: string;
}

const ROWS_PER_PAGE = 8;

export default function InspectionsTable({ scope, search, statusFilter, reasonFilter }: Props) {
  const [page, setPage] = useState(1);
  const [, navigate] = useLocation();

  useEffect(() => {
    setPage(1);
  }, [scope, search, statusFilter, reasonFilter]);

  const filtered = INSPECTIONS.filter((ins) => {
    const matchScope = scope === "all" || ins.inspektor === CURRENT_USER;
    const matchSearch =
      !search ||
      ins.id.toLowerCase().includes(search.toLowerCase()) ||
      ins.vozilo.toLowerCase().includes(search.toLowerCase()) ||
      ins.ruta.toLowerCase().includes(search.toLowerCase()) ||
      ins.lokacija.toLowerCase().includes(search.toLowerCase()) ||
      ins.inspektor.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || ins.status === statusFilter;
    const matchReason = reasonFilter === "all" || ins.razlog.startsWith(reasonFilter);
    return matchScope && matchSearch && matchStatus && matchReason;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  return (
    <div className="bg-white rounded-lg border border-[#dde2ea] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f4f6f9] border-b border-[#dde2ea]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider whitespace-nowrap">ID</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider whitespace-nowrap">Vozilo</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider whitespace-nowrap">Ruta</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider whitespace-nowrap">Razlog</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider whitespace-nowrap">Lokacija</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider whitespace-nowrap">Inspektor</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider whitespace-nowrap">Datum</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider whitespace-nowrap">Oznake</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider whitespace-nowrap">Akcija</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-12 text-[#9aa5b4]">
                  Nema rezultata za odabrane filtre
                </td>
              </tr>
            ) : (
              paged.map((ins, idx) => {
                const st = STATUS_CONFIG[ins.status];
                return (
                  <tr
                    key={ins.id}
                    className={`border-b border-[#f0f2f5] hover:bg-[#f8fafc] transition-colors ${idx % 2 === 0 ? "" : "bg-[#fafbfc]"}`}
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-[#002d74] font-semibold whitespace-nowrap">
                      {ins.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#9aa5b4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h3l3 3v4a2 2 0 01-2 2h-1" />
                          <circle cx="7.5" cy="17.5" r="1.5" />
                          <circle cx="17.5" cy="17.5" r="1.5" />
                        </svg>
                        <span className="text-[#374151] font-medium">{ins.vozilo}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#374151] whitespace-nowrap">{ins.ruta}</td>
                    <td className="px-4 py-3 text-[#374151] whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[#eef2ff] text-[#3730a3] font-medium">
                        {ins.razlog}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#374151] whitespace-nowrap">
                      {ins.lokacija}
                    </td>
                    <td className="px-4 py-3 text-[#374151] whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-medium">{ins.inspektor}</span>
                        {ins.inspektor === CURRENT_USER && (
                          <span className="text-[10px] font-semibold text-[#002d74] bg-[#eef3ff] px-1.5 py-0.5 rounded border border-[#d4e0ff]">
                            Vi
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#374151] whitespace-nowrap">{ins.datum}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {ins.badges?.length ? (
                        <span className="inline-flex items-center gap-1">
                          {ins.badges.map((badge) => (
                            <span
                              key={badge}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#fce4ec] text-[#b71c1c] border border-[#f8bbd0]"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                              </svg>
                              {badge}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-[#c5cdd8] text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.bg} ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/inspection/${ins.id}`)}
                        className="text-[#002d74] hover:text-[#1a4a9e] text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Pregled
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination + count */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#dde2ea] bg-[#fafbfc]">
        <span className="text-xs text-[#9aa5b4]">
          {filtered.length === 0
            ? "Nema rezultata"
            : `Prikazano ${(safePage - 1) * ROWS_PER_PAGE + 1}–${Math.min(safePage * ROWS_PER_PAGE, filtered.length)} od ${filtered.length} inspekcija`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="w-8 h-8 flex items-center justify-center rounded border border-[#dde2ea] text-[#374151] hover:bg-[#f4f6f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded border text-xs font-medium transition-colors ${
                p === safePage
                  ? "bg-[#002d74] border-[#002d74] text-white"
                  : "border-[#dde2ea] text-[#374151] hover:bg-[#f4f6f9]"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded border border-[#dde2ea] text-[#374151] hover:bg-[#f4f6f9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
