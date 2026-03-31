import { useState, useMemo, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InspectionSidebar from "@/components/inspection/InspectionSidebar";
import InspectionCard from "@/components/inspection/InspectionCard";
import SearchSection, {
  type DatasetTabSeed,
} from "@/components/inspection/SearchSection";
import { buildSampleXmlBase64 } from "@/mock-efti/mock-efti-api";
import { parseEftiXml } from "@/lib/eftiParser";

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isNew = id === "new";

  const inspectionId = isNew ? "INS-2024-0419" : id;

  const [activeSearchTab, setActiveSearchTab] = useState(0);
  const [navMode, setNavMode] = useState<"dataset" | "search">(() =>
    !isNew ? "dataset" : "search"
  );
  const [inspectionStarted, setInspectionStarted] = useState(!isNew);
  const [activeDatasetHasAdr, setActiveDatasetHasAdr] = useState(false);
  const [eadrOpenRequest, setEadrOpenRequest] = useState(0);

  const requestOpenEadr = useCallback(() => {
    setEadrOpenRequest((n) => n + 1);
  }, []);

  const seedDatasetTabs = useMemo<DatasetTabSeed[] | undefined>(() => {
    if (isNew) return undefined;
    const b64 = buildSampleXmlBase64();
    const xml = decodeURIComponent(escape(atob(b64)));
    const consignment = parseEftiXml(xml);
    return [
      {
        label: "HR-CMR-2024-88421",
        consignment,
        xml,
        datasetId: "8f3a7c21-9e12-4b56-a1c3-2d4e5f6a7b8c",
        gateId: "borduria",
        platformId: "croatia eFTI platform",
      },
    ];
  }, [isNew]);

  const handleStartInspection = () => {
    setInspectionStarted(true);
  };

  const headerInspection = inspectionStarted
    ? { inspectionId: inspectionId ?? "", isNew, onAction: undefined }
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9]">
      <Header inspection={headerInspection} />

      <div className="flex flex-1">
        <InspectionSidebar
          onBack={() => navigate("/")}
          navMode={navMode}
          inspectionStarted={inspectionStarted}
          hasAdr={activeDatasetHasAdr}
          onOpenEadr={requestOpenEadr}
        />

        <main className="flex-1 min-w-0 p-6 flex flex-col gap-5">
          <InspectionCard
            isNew={isNew}
            inspectionId={inspectionId ?? ""}
            inspectionStarted={inspectionStarted}
            onStartInspection={handleStartInspection}
          />

          {inspectionStarted ? (
            <SearchSection
              activeTab={activeSearchTab}
              onTabChange={setActiveSearchTab}
              seedDatasetTabs={seedDatasetTabs}
              onMainTabKindChange={setNavMode}
              onActiveDatasetAdrChange={setActiveDatasetHasAdr}
              eadrOpenRequest={eadrOpenRequest}
              onNavigateEadrFull={() => navigate(`/inspection/${inspectionId}/eadr`)}
            />
          ) : (
            <div className="border-2 border-dashed border-[#d5ddeb] rounded-xl p-10 text-center bg-[#fbfcff]">
              <div className="w-14 h-14 rounded-full bg-[#eef3ff] flex items-center justify-center mx-auto mb-4">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <p className="text-[16px] font-semibold text-[#374151] mb-1">
                Pokrenite inspekciju za pristup pretragama
              </p>
              <p className="text-sm text-[#6b7a8d] mb-5 max-w-md mx-auto">
                Prije pokretanja pretraga potrebno je započeti inspekciju.
                Ispunite podatke o inspekciji iznad i kliknite &ldquo;Pokreni
                inspekciju&rdquo;.
              </p>
              <button
                onClick={handleStartInspection}
                className="px-5 py-2.5 text-sm font-medium rounded-lg bg-[#002d74] text-white hover:bg-[#1a4a9e] transition-colors"
              >
                Pokreni inspekciju
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
