import { useState } from "react";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import InspectionsTable from "@/components/InspectionsTable";
import Footer from "@/components/Footer";
import type { InspectionListScope } from "@/data/inspections";

export default function Dashboard() {
  const [scope, setScope] = useState<InspectionListScope>("mine");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9]">
      <Header />

      <main className="flex-1 w-full max-w-none mx-auto px-6 xl:px-10 py-8">
        <div className="mb-6">
          <div
            className="inline-flex rounded-lg border border-[#dde2ea] bg-[#f4f6f9] p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            role="tablist"
            aria-label="Pregled inspekcija"
          >
            <button
              type="button"
              role="tab"
              aria-selected={scope === "mine"}
              onClick={() => setScope("mine")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                scope === "mine"
                  ? "bg-white text-[#002d74] shadow-sm border border-[#dde2ea]/80"
                  : "text-[#6b7a8d] hover:text-[#374151]"
              }`}
            >
              Moje inspekcije
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scope === "all"}
              onClick={() => setScope("all")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                scope === "all"
                  ? "bg-white text-[#002d74] shadow-sm border border-[#dde2ea]/80"
                  : "text-[#6b7a8d] hover:text-[#374151]"
              }`}
            >
              Sve inspekcije
            </button>
          </div>
          <p className="text-sm text-[#6b7a8d] mt-3">
            {scope === "mine"
              ? "Inspekcije koje ste Vi evidentirali"
              : "Sve inspekcije u sustavu"}
          </p>
        </div>

        <FilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          reasonFilter={reasonFilter}
          onReasonChange={setReasonFilter}
        />

        <InspectionsTable
          scope={scope}
          search={search}
          statusFilter={statusFilter}
          reasonFilter={reasonFilter}
        />
      </main>

      <Footer />
    </div>
  );
}
