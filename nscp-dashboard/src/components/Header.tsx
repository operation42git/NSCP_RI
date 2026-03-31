import { useState } from "react";
import nscpLogo from "@/assets/logo-nscp.png";

interface InspectionInfo {
  inspectionId: string;
  isNew: boolean;
  onAction?: () => void;
}

interface HeaderProps {
  inspection?: InspectionInfo;
}

export default function Header({ inspection }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="bg-white sticky top-0 z-30 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="w-full px-6 h-[80px] flex items-center gap-4">
        <div className="flex items-center flex-shrink-0">
          <img
            src={nscpLogo}
            alt="NSCP"
            style={{ height: "130px", width: "auto", objectFit: "contain" }}
          />
        </div>

        {inspection && (
          <div className="flex items-center gap-3 flex-1 min-w-0 ml-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fff8e1] text-[#b45309] flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fb8c00]" />
              U tijeku
            </span>

            <span className="text-[13px] font-semibold text-[#002d74] font-mono flex-shrink-0">
              {inspection.inspectionId}
            </span>

            <div className="h-4 w-px bg-[#dde2ea] flex-shrink-0" />

            <span className="text-[13px] text-[#6b7a8d] truncate">
              Marko Horvat &middot; Državni inspektorat
              {!inspection.isNew && " \u00B7 Bregana (HR/SI) \u00B7 3 pretrage"}
            </span>

            <div className="flex-1" />

            <button
              onClick={inspection.onAction}
              className="px-3 py-1.5 text-[13px] font-medium rounded-md bg-[#002d74] text-white hover:bg-[#1a4a9e] transition-colors whitespace-nowrap flex-shrink-0"
            >
              Završi inspekciju
            </button>
          </div>
        )}

        {!inspection && <div className="flex-1" />}

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#dde2ea] bg-white hover:bg-[#f4f6f9] transition-colors text-[#002d74] text-sm font-medium"
          >
            <span className="w-7 h-7 rounded-full bg-[#002d74] text-white flex items-center justify-center text-xs font-semibold select-none">
              I1
            </span>
            <span>Inspector1</span>
            <svg className="w-4 h-4 text-[#6b7a8d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#dde2ea] rounded-md shadow-lg z-50">
              <div className="py-1">
                <button className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#f4f6f9]">
                  Moj profil
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#f4f6f9]">
                  Postavke
                </button>
                <div className="h-px bg-[#dde2ea] mx-2 my-1" />
                <button className="w-full text-left px-4 py-2 text-sm text-[#374151] hover:bg-[#f4f6f9]">
                  Odjava
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="h-[2px] bg-[#002d74]" />
    </header>
  );
}
