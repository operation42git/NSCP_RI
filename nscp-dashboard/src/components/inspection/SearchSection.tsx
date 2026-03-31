import { useCallback, useEffect, useState } from "react";
import type { EftiConsignment } from "@/types/efti";
import DatasetView, { type DatasetViewModel } from "./DatasetView";
import IdentifierSearchPanel, {
  emptySnapshot,
  type IdentifierSearchSnapshot,
} from "./identifier-search-panel";
import UilSearchPanel, {
  emptyUilSnapshot,
  type UilDatasetSelection,
  type UilSearchSnapshot,
} from "./uil-search-panel";

export interface DatasetTabModel {
  id: string;
  label: string;
  view: DatasetViewModel;
}

export interface DatasetTabSeed {
  label: string;
  consignment: EftiConsignment;
  xml: string;
  datasetId: string;
  gateId: string;
  platformId: string;
}

type SearchType = "uil" | "identifier" | "qr";

interface Props {
  activeTab: number;
  onTabChange: (i: number) => void;
  seedDatasetTabs?: DatasetTabSeed[];
  onMainTabKindChange?: (kind: "dataset" | "search") => void;
  onActiveDatasetAdrChange?: (hasAdr: boolean) => void;
  eadrOpenRequest?: number;
  onNavigateEadrFull?: () => void;
}

function datasetModelFromSeed(s: DatasetTabSeed): DatasetTabModel {
  return {
    id: crypto.randomUUID(),
    label: s.label,
    view: {
      consignment: s.consignment,
      xml: s.xml,
      datasetId: s.datasetId,
      gateId: s.gateId,
      platformId: s.platformId,
    },
  };
}

function defaultDatasetLabelFromRow(
  datasetId: string,
  consignment: EftiConsignment
): string {
  const tc = consignment.typeCode?.trim();
  if (tc && datasetId)
    return `${tc} \u00b7 ${datasetId.length > 20 ? datasetId.slice(0, 14) + "\u2026" : datasetId}`;
  if (datasetId)
    return datasetId.length > 28 ? datasetId.slice(0, 20) + "\u2026" : datasetId;
  return "Skup podataka";
}

const SEARCH_TYPES: { key: SearchType; label: string }[] = [
  { key: "uil", label: "UIL Pretraga" },
  { key: "identifier", label: "Identifikatori" },
  { key: "qr", label: "QR Skeniranje" },
];

export default function SearchSection({
  activeTab,
  onTabChange,
  seedDatasetTabs,
  onMainTabKindChange,
  onActiveDatasetAdrChange,
  eadrOpenRequest,
  onNavigateEadrFull,
}: Props) {
  const [datasetTabs, setDatasetTabs] = useState<DatasetTabModel[]>(() =>
    seedDatasetTabs?.length ? seedDatasetTabs.map(datasetModelFromSeed) : []
  );
  const [xmlPreview, setXmlPreview] = useState<string | null>(null);

  const [activeSearchType, setActiveSearchType] = useState<SearchType>("uil");
  const [uilSnap, setUilSnap] = useState<UilSearchSnapshot>(emptyUilSnapshot("manual"));
  const [qrSnap, setQrSnap] = useState<UilSearchSnapshot>(emptyUilSnapshot("qr"));
  const [idSnap, setIdSnap] = useState<IdentifierSearchSnapshot>(emptySnapshot());

  const uilSessionId = "search-uil";
  const qrSessionId = "search-qr";
  const idSessionId = "search-id";

  const searchTabIndex = datasetTabs.length;
  const totalMainTabs = searchTabIndex + 1;
  const safeMainIndex =
    totalMainTabs > 0
      ? Math.min(Math.max(0, activeTab), totalMainTabs - 1)
      : 0;
  const onDatasetTab = safeMainIndex < searchTabIndex;
  const activeDataset = onDatasetTab ? datasetTabs[safeMainIndex] : null;

  useEffect(() => {
    onMainTabKindChange?.(onDatasetTab ? "dataset" : "search");
  }, [onDatasetTab, onMainTabKindChange]);

  useEffect(() => {
    if (!onDatasetTab) setXmlPreview(null);
  }, [onDatasetTab]);

  useEffect(() => {
    if (!activeDataset) {
      onActiveDatasetAdrChange?.(false);
      return;
    }
    const c = activeDataset.view.consignment;
    const adr =
      !!c.dangerousGoods?.uNDGID ||
      !!c.dangerousGoods?.hazardClassificationID ||
      c.mainCarriageTransportMovement?.dangerousGoodsIndicator === "true" ||
      c.includedConsignmentItem?.some((i) => !!i.transportDangerousGoods) === true;
    onActiveDatasetAdrChange?.(adr);
  }, [activeDataset, onActiveDatasetAdrChange]);

  const handleUilDatasetSelected = useCallback(
    (sel: UilDatasetSelection) => {
      const label = defaultDatasetLabelFromRow(sel.row.datasetId, sel.consignment);
      const nextTab: DatasetTabModel = {
        id: crypto.randomUUID(),
        label,
        view: {
          consignment: sel.consignment,
          xml: sel.xml,
          datasetId: sel.row.datasetId,
          gateId: sel.row.gateId,
          platformId: sel.row.platformId,
        },
      };
      setDatasetTabs((prev) => {
        const next = [...prev, nextTab];
        queueMicrotask(() => onTabChange(next.length - 1));
        return next;
      });
    },
    [onTabChange]
  );

  const downloadXmlForActiveDataset = useCallback(() => {
    if (!activeDataset) return;
    try {
      const blob = new Blob([activeDataset.view.xml], { type: "application/xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${activeDataset.view.datasetId || "efti"}.xml`;
      a.click();
    } catch {
      /* ignore */
    }
  }, [activeDataset]);

  return (
    <div className="bg-white border border-[#dde2ea] rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,45,116,0.07)]">
      {/* Main tab bar: dataset tabs + Nova pretraga */}
      <div className="flex items-center gap-1 px-4 pt-4 border-b border-[#e0e6ef] bg-white flex-wrap">
        {datasetTabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTabChange(i)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap max-w-[200px] truncate ${
              safeMainIndex === i && onDatasetTab
                ? "bg-[#002d74] text-white"
                : "bg-[#f0f3f9] text-[#40536f] hover:bg-[#e4eaf5]"
            }`}
            title={t.label}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onTabChange(searchTabIndex)}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium border border-b-0 transition-colors whitespace-nowrap ${
            safeMainIndex === searchTabIndex
              ? "bg-[#002d74] text-white border-[#002d74]"
              : "text-[#002d74] bg-[#eef3ff] border-[#d6e2ff] hover:bg-[#dce9ff]"
          }`}
        >
          Nova pretraga
        </button>
      </div>

      <div className="p-5">
        {/* ── Dataset tab content ── */}
        {onDatasetTab && activeDataset && (
          <>
            <DatasetView
              model={activeDataset.view}
              onShowXml={() => setXmlPreview(activeDataset.view.xml)}
              onDownloadXml={downloadXmlForActiveDataset}
              eadrOpenRequest={eadrOpenRequest}
              onNavigateEadrFull={onNavigateEadrFull}
            />
            {xmlPreview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="bg-white rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
                  <div className="bg-[#002d74] text-white px-5 py-4 flex items-center justify-between shrink-0">
                    <h3 className="text-[15px] font-semibold">eFTI XML</h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={downloadXmlForActiveDataset}
                        className="px-3 py-1.5 rounded-md bg-white/20 text-white text-xs hover:bg-white/30"
                      >
                        Preuzmi XML
                      </button>
                      <button
                        type="button"
                        onClick={() => setXmlPreview(null)}
                        className="px-3 py-1.5 rounded-md bg-white/20 text-white text-xs hover:bg-white/30"
                      >
                        Zatvori
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto p-5 bg-[#f8f9fb]">
                    <pre className="text-xs font-mono text-[#1d2a3a] whitespace-pre-wrap leading-relaxed">
                      {xmlPreview}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Nova pretraga tab content ── */}
        {!onDatasetTab && (
          <>
            {/* Search type sub-tabs */}
            <div className="flex gap-2 mb-5">
              {SEARCH_TYPES.map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setActiveSearchType(st.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeSearchType === st.key
                      ? "bg-[#002d74] text-white"
                      : "bg-white text-[#40536f] border border-[#cfd8e6] hover:bg-[#f0f3f9]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* UIL search */}
            {activeSearchType === "uil" && (
              <UilSearchPanel
                key={uilSessionId}
                sessionId={uilSessionId}
                variant="manual"
                initial={uilSnap}
                onSnapshotChange={setUilSnap}
                onDatasetSelected={handleUilDatasetSelected}
              />
            )}

            {/* QR search (variant of UIL) */}
            {activeSearchType === "qr" && (
              <UilSearchPanel
                key={qrSessionId}
                sessionId={qrSessionId}
                variant="qr"
                initial={qrSnap}
                onSnapshotChange={setQrSnap}
                onDatasetSelected={handleUilDatasetSelected}
              />
            )}

            {/* Identifier search */}
            {activeSearchType === "identifier" && (
              <IdentifierSearchPanel
                key={idSessionId}
                sessionId={idSessionId}
                initial={idSnap}
                onSnapshotChange={setIdSnap}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
