import { useState } from "react";

const ACTIONS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <circle cx="12" cy="5" r="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3m-3-3l-3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17l-2 4m8-4l2 4" />
      </svg>
    ),
    label: "Veliki pokazivač",
    description: "Povećaj kursor miša",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
      </svg>
    ),
    label: "Monokromatski prikaz",
    description: "Ukloni boje sa stranice",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path strokeLinecap="round" d="M7 12h10M12 7v10" />
      </svg>
    ),
    label: "Visoki kontrast",
    description: "Pojačaj kontrast boja",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" d="M4 8h16M4 16h16" />
        <path strokeLinecap="round" d="M8 4v16" />
      </svg>
    ),
    label: "Veći tekst",
    description: "Povećaj veličinu fonta",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 3l4 4-9 9H8v-4l9-9z" />
      </svg>
    ),
    label: "Istakni veze",
    description: "Naglasi sve poveznice",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" d="M3 10h18" />
        <path strokeLinecap="round" d="M3 6h18M3 14h18M3 18h18" />
      </svg>
    ),
    label: "Vodič za čitanje",
    description: "Prikaži liniju za lakše čitanje",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    label: "Povećalo",
    description: "Uvećaj sadržaj ispod pokazivača",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    label: "Čitač zaslona",
    description: "Optimiziraj za čitač zaslona",
  },
];

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setActive((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start gap-2">
      {/* Panel */}
      {open && (
        <div className="bg-white border border-[#dde2ea] rounded-xl shadow-[0_8px_32px_rgba(0,45,116,0.15)] w-[280px] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#eef0f4] flex items-center justify-between">
            <div>
              <p className="text-[13px] font-semibold text-[#002d74]">Pristupačnost</p>
              <p className="text-[11px] text-[#9aa5b4]">Odaberite opcije prikaza</p>
            </div>
            <button
              onClick={() => setActive(new Set())}
              className="text-[11px] text-[#9aa5b4] hover:text-[#002d74] transition-colors"
            >
              Resetiraj
            </button>
          </div>
          <div className="p-2 max-h-[380px] overflow-y-auto">
            {ACTIONS.map((action, i) => {
              const isActive = active.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-0.5 ${
                    isActive
                      ? "bg-[#eef3ff] text-[#002d74] border border-[#d6e2ff]"
                      : "hover:bg-[#f4f6f9] text-[#374151] border border-transparent"
                  }`}
                >
                  <span className={`flex-shrink-0 ${isActive ? "text-[#002d74]" : "text-[#9aa5b4]"}`}>
                    {action.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium leading-tight">{action.label}</p>
                    <p className="text-[11px] text-[#9aa5b4] leading-tight mt-0.5">{action.description}</p>
                  </div>
                  {isActive && (
                    <span className="ml-auto flex-shrink-0 w-4 h-4 rounded-full bg-[#002d74] flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Pristupačnost"
        className={`w-12 h-12 rounded-full shadow-[0_4px_16px_rgba(0,45,116,0.25)] flex items-center justify-center transition-all ${
          open ? "bg-[#002d74] text-white" : "bg-white text-[#002d74] border border-[#dde2ea]"
        }`}
      >
        {active.size > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#002d74] text-white text-[10px] font-bold flex items-center justify-center">
            {active.size}
          </span>
        )}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
          <circle cx="12" cy="5" r="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7c-4 0-7 2-7 5h14c0-3-3-5-7-5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l-2 7m6-7v7m4-7l2 7" />
        </svg>
      </button>
    </div>
  );
}
