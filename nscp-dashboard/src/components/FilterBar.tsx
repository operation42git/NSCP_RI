import { useLocation } from "wouter";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  reasonFilter: string;
  onReasonChange: (v: string) => void;
}

export default function FilterBar({
  search, onSearchChange,
  statusFilter, onStatusChange,
  reasonFilter, onReasonChange,
}: FilterBarProps) {
  const [, navigate] = useLocation();
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px] max-w-[320px]">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9aa5b4]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Pretraži inspekcije..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-[#dde2ea] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#002d74]/20 focus:border-[#002d74] placeholder:text-[#9aa5b4]"
        />
      </div>

      {/* Status dropdown */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="py-2 px-3 text-sm border border-[#dde2ea] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#002d74]/20 focus:border-[#002d74] text-[#374151] min-w-[160px]"
      >
        <option value="all">Svi statusi</option>
        <option value="U tijeku">U tijeku</option>
        <option value="Završena">Završena</option>
      </select>

      {/* Reason dropdown */}
      <select
        value={reasonFilter}
        onChange={(e) => onReasonChange(e.target.value)}
        className="py-2 px-3 text-sm border border-[#dde2ea] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#002d74]/20 focus:border-[#002d74] text-[#374151] min-w-[160px]"
      >
        <option value="all">Svi razlozi</option>
        <option value="Redovna">Redovna kontrola</option>
        <option value="Prometna">Prometna nesreća</option>
        <option value="Ciljana">Ciljana inspekcija</option>
        <option value="Žalba">Žalba</option>
      </select>

      {/* Spacer */}
      <div className="flex-1" />

      {/* New Inspection button */}
      <button
        onClick={() => navigate("/inspection/new")}
        className="flex items-center gap-2 px-4 py-2 bg-[#002d74] hover:bg-[#1a4a9e] text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nova inspekcija
      </button>
    </div>
  );
}
