import type { ReactNode } from "react";
import { ScanQrCode } from "lucide-react";

export type SearchMethod = "uil" | "identifier" | "qr";

interface Props {
  onSelect: (method: SearchMethod) => void;
}

const METHODS: {
  id: SearchMethod;
  title: string;
  subtitle: string;
  icon: ReactNode;
  tags: string[];
}[] = [
  {
    id: "uil",
    title: "UIL pretraga",
    subtitle:
      "Izravno dohvaćanje podataka putem jedinstvene eFTI oznake (UIL). Potrebno je unijeti ID dataseta, gate i platformu.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
        />
      </svg>
    ),
    tags: ["Dataset ID", "Gate", "Platforma"],
  },
  {
    id: "identifier",
    title: "Pretraga po identifikatoru",
    subtitle:
      "Pretraga registra identifikatora prema registarskoj oznaci vozila, tipu opreme ili oznaci tereta.",
    icon: (
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    tags: ["Reg. oznaka", "Tip prijevoza", "Opasna roba"],
  },
  {
    id: "qr",
    title: "UIL putem QR koda",
    subtitle:
      "Isti UIL zahtjev kao ručni unos: sadržaj iz QR koda puni Dataset ID, Gate i Platform (portal-mock / mock API logika).",
    icon: <ScanQrCode className="w-7 h-7" strokeWidth={1.8} />,
    tags: ["QR", "Dataset ID", "Gate", "Platforma"],
  },
];

export default function SearchMethodPicker({ onSelect }: Props) {
  return (
    <div className="flex flex-col items-center py-6">
      <div className="w-14 h-14 rounded-full bg-[#eef3ff] flex items-center justify-center mb-4">
        <svg
          className="w-7 h-7 text-[#002d74]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <h3 className="text-[17px] font-semibold text-[#1d2a3a] mb-1">
        Odaberite metodu pretrage
      </h3>
      <p className="text-sm text-[#6b7a8d] mb-6 max-w-md text-center">
        Pokrenite novu pretragu odabirom jedne od dostupnih metoda. Svaka metoda
        koristi različite parametre za dohvaćanje podataka.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="group flex flex-col text-left border-2 border-[#dde2ea] rounded-xl p-5 bg-white hover:border-[#002d74] hover:shadow-[0_4px_20px_rgba(0,45,116,0.12)] transition-all duration-200"
          >
            <div className="w-12 h-12 rounded-lg bg-[#f0f4ff] flex items-center justify-center text-[#002d74] group-hover:bg-[#002d74] group-hover:text-white transition-colors mb-4">
              {m.icon}
            </div>
            <h4 className="text-[15px] font-semibold text-[#1d2a3a] mb-1.5 group-hover:text-[#002d74] transition-colors">
              {m.title}
            </h4>
            <p className="text-[13px] text-[#6b7a8d] leading-relaxed mb-4 flex-1">
              {m.subtitle}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {m.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0f4ff] text-[#3b5998] group-hover:bg-[#e0e9ff] transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
