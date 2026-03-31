const DATASET_SECTION_NAV = [
  { id: "section-efti-sazetak", label: "Operativni sažetak" },
  { id: "section-efti-posiljatelj", label: "Pošiljatelj" },
  { id: "section-efti-primatelj", label: "Primatelj" },
  { id: "section-efti-prijevoznici", label: "Prijevoznici" },
  { id: "section-efti-lokacije", label: "Lokacije i ruta" },
  { id: "section-efti-vozila", label: "Prijevoz i kretanje" },
  { id: "section-efti-regulatorno", label: "Opasna roba (ADR)" },
];

interface Props {
  onBack: () => void;
  navMode?: "dataset" | "search";
  inspectionStarted?: boolean;
  hasAdr?: boolean;
  onOpenEadr?: () => void;
}

export default function InspectionSidebar({
  onBack,
  navMode = "search",
  hasAdr,
  onOpenEadr,
}: Props) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showDatasetNav = navMode === "dataset";

  return (
    <aside className="w-[240px] flex-shrink-0 self-start bg-white border-r border-[#dde2ea] flex flex-col py-5 px-4 sticky top-[82px] z-20 h-[calc(100vh-82px)] min-h-0 overflow-y-auto">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold mb-2">Općenito</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md text-sm text-[#002d74] font-medium hover:bg-[#eef3ff] transition-colors text-left"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Moje inspekcije
        </button>
      </div>

      {showDatasetNav && (
        <>
          <div className="h-px bg-[#eef0f4] mb-5" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold mb-2">
              eFTI prikaz (skup podataka)
            </p>
            <div className="flex flex-col gap-1">
              {DATASET_SECTION_NAV.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-[#374151] hover:bg-[#f4f6f9] transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* eADR sidebar entry — only when ADR detected */}
          {hasAdr && onOpenEadr && (
            <>
              <div className="h-px bg-[#eef0f4] my-4" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold mb-2">
                  Opasna roba
                </p>
                <button
                  onClick={onOpenEadr}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md text-sm font-semibold text-[#c62828] hover:bg-[#fff5f5] transition-colors text-left border border-[#ffcdd2] bg-[#fffbfb]"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  eADR provjera
                </button>
              </div>
            </>
          )}
        </>
      )}
    </aside>
  );
}
