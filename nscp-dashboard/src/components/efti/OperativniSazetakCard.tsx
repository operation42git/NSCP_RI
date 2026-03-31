import { useState } from "react";
import type { EftiConsignment } from "@/types/efti";
import StatusIndicators from "./StatusIndicators";
import RouteDisplay from "./RouteDisplay";
import GoodsSummaryGrid from "./GoodsSummaryGrid";
import PartiesGrid from "./PartiesGrid";
import DocumentsPanel from "./DocumentsPanel";
import EadrTriggerButton from "@/components/eadr/EadrTriggerButton";

function FooterItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <span className="text-[12px] text-[#6b7a8d]">
      <span className="font-semibold text-[#374151]">{label}:</span> {value}
    </span>
  );
}

export default function OperativniSazetakCard({
  data,
  id,
  onShowXml,
  onDownloadXml,
  onOpenEadr,
}: {
  data: EftiConsignment;
  id?: string;
  onShowXml?: () => void;
  onDownloadXml?: () => void;
  onOpenEadr?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const regCountry =
    data.mainCarriageTransportMovement?.usedTransportMeans?.registrationCountryCode ??
    data.usedTransportEquipment?.[0]?.registrationCountryCode;

  const equipmentCount = data.usedTransportEquipment?.length ?? 0;
  const equipmentLabel = equipmentCount > 0
    ? `${equipmentCount} ${data.usedTransportEquipment?.[0]?.equipmentDescriptionText ?? "kom."}`
    : undefined;

  return (
    <div
      id={id}
      className="bg-white border border-[#dde2ea] rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,45,116,0.07)] scroll-mt-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#eef0f4]">
        <div className="flex items-center gap-4 flex-wrap min-w-0">
          <h3 className="text-[16px] font-bold text-[#1d2a3a] whitespace-nowrap">
            Operativni sažetak
          </h3>
          <StatusIndicators data={data} />
          {onOpenEadr && <EadrTriggerButton onClick={onOpenEadr} />}
        </div>

        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-md text-[#9aa5b4] hover:text-[#002d74] hover:bg-[#f4f6f9] transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="1.5" />
              <circle cx="10" cy="10" r="1.5" />
              <circle cx="10" cy="16" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#dde2ea] rounded-lg shadow-lg py-1 z-10">
              {onShowXml && (
                <button
                  onClick={() => { setMenuOpen(false); onShowXml(); }}
                  className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-[#f4f6f9]"
                >
                  Prikaži sirovi XML
                </button>
              )}
              {onDownloadXml && (
                <button
                  onClick={() => { setMenuOpen(false); onDownloadXml(); }}
                  className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-[#f4f6f9]"
                >
                  Preuzmi XML
                </button>
              )}
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full text-left px-3 py-2 text-sm text-[#374151] hover:bg-[#f4f6f9]"
              >
                Izvezi podatke
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body: two-column layout */}
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 min-w-0 p-5 flex flex-col gap-4">
          <RouteDisplay data={data} />
          <GoodsSummaryGrid data={data} />
          <PartiesGrid
            consignor={data.consignor}
            consignee={data.consignee}
            carrier={data.carrier}
          />
        </div>

        <div className="w-full lg:w-[320px] flex-shrink-0 border-t lg:border-t-0 lg:border-l border-[#eef0f4] bg-[#fafbff] p-4">
          <DocumentsPanel documents={data.associatedDocument} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-t border-[#eef0f4] bg-[#f9fbff] flex-wrap">
        <FooterItem label="Koleta" value={data.numberOfPackages} />
        <FooterItem label="Oprema" value={equipmentLabel} />
        <FooterItem label="Reg. država" value={regCountry} />
      </div>
    </div>
  );
}
