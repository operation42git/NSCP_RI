import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { Search } from "lucide-react";
import { toast } from "sonner";
import EuropeMapChart from "./europe-map-chart";
import type { Consignment, IdentifiersResponse } from "@/mock-efti/types";
import {
  GATE_COUNTRIES,
  postIdentifiersSearch,
  getIdentifiersResult,
} from "@/mock-efti/mock-efti-api";
import {
  flattenConsignments,
  getCarriedEquipmentCount,
  getDangerousGoodsIndicator,
  getMainTransportCountry,
  getMainTransportMode,
  getTransportModeName,
  getUsedEquipmentCount,
  IDENTIFIER_TYPES,
  statusBadgeClass,
} from "@/mock-efti/identifier-utils";

const inputCls =
  "w-full border border-[#cfd8e6] rounded-lg px-3 py-2.5 text-sm bg-white text-[#1d2a3a] focus:outline-none focus:ring-2 focus:ring-[#002d74]/20 focus:border-[#002d74]";
const labelCls = "text-[12px] font-semibold text-[#5f6f86] mb-1.5 block";

function getBoolDg(v: string): boolean | null {
  if (v === "YES") return true;
  if (v === "NO") return false;
  return null;
}

export interface IdentifierSearchSnapshot {
  identifier: string;
  identifierTypes: string[];
  registrationCountryCode: string;
  modeCode: string;
  dangerousGoods: string;
  gateIndicators: string[];
  requestId: string | null;
  response: IdentifiersResponse | null;
}

const emptySnapshot = (): IdentifierSearchSnapshot => ({
  identifier: "",
  identifierTypes: [],
  registrationCountryCode: "",
  modeCode: "",
  dangerousGoods: "NA",
  gateIndicators: [],
  requestId: null,
  response: null,
});

interface Props {
  /** Stable per-tab id so local state rehydrates from parent when switching tabs (not on every parent render). */
  sessionId: string;
  initial?: IdentifierSearchSnapshot;
  readOnly?: boolean;
  onSnapshotChange?: (s: IdentifierSearchSnapshot) => void;
  /** Fired once when the user expands a result row or chooses “Otvori” — parent may lock tab discard */
  onResultSelected?: () => void;
}

function snapshotFromState(args: {
  identifier: string;
  identifierTypes: string[];
  registrationCountryCode: string;
  modeCode: string;
  dangerousGoods: string;
  gateIndicators: string[];
  requestId: string | null;
  response: IdentifiersResponse | null;
}): IdentifierSearchSnapshot {
  return {
    identifier: args.identifier,
    identifierTypes: args.identifierTypes,
    registrationCountryCode: args.registrationCountryCode,
    modeCode: args.modeCode,
    dangerousGoods: args.dangerousGoods,
    gateIndicators: args.gateIndicators,
    requestId: args.requestId,
    response: args.response,
  };
}

export default function IdentifierSearchPanel({
  sessionId,
  initial,
  readOnly = false,
  onSnapshotChange,
  onResultSelected,
}: Props) {
  const [identifier, setIdentifier] = useState(initial?.identifier ?? "");
  const [identifierTypes, setIdentifierTypes] = useState<string[]>(
    initial?.identifierTypes ?? []
  );
  const [registrationCountryCode, setRegistrationCountryCode] = useState(
    initial?.registrationCountryCode ?? ""
  );
  const [modeCode, setModeCode] = useState(initial?.modeCode ?? "");
  const [dangerousGoods, setDangerousGoods] = useState(
    initial?.dangerousGoods ?? "NA"
  );
  const [gateIndicators, setGateIndicators] = useState<string[]>(
    initial?.gateIndicators ?? []
  );
  const [requestId, setRequestId] = useState<string | null>(
    initial?.requestId ?? null
  );
  const [response, setResponse] = useState<IdentifiersResponse | null>(
    initial?.response ?? null
  );
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const resultPickNotified = useRef(false);
  const resultSectionRef = useRef<HTMLDivElement>(null);

  const consignments = useMemo(() => flattenConsignments(response), [response]);

  const fireResultSelected = () => {
    if (readOnly || !onResultSelected || resultPickNotified.current) return;
    resultPickNotified.current = true;
    onResultSelected();
  };

  const initialRef = useRef(initial);
  initialRef.current = initial;

  useEffect(() => {
    const s = initialRef.current ?? emptySnapshot();
    setIdentifier(s.identifier);
    setIdentifierTypes([...s.identifierTypes]);
    setRegistrationCountryCode(s.registrationCountryCode);
    setModeCode(s.modeCode);
    setDangerousGoods(s.dangerousGoods);
    setGateIndicators([...s.gateIndicators]);
    setRequestId(s.requestId);
    setResponse(s.response);
    setExpanded(new Set());
    resultPickNotified.current = false;
  }, [sessionId]);

  const pushToParent = useCallback(
    (override: Partial<IdentifierSearchSnapshot>) => {
      if (!onSnapshotChange || readOnly) return;
      onSnapshotChange(
        snapshotFromState({
          identifier: override.identifier ?? identifier,
          identifierTypes: override.identifierTypes ?? identifierTypes,
          registrationCountryCode:
            override.registrationCountryCode ?? registrationCountryCode,
          modeCode: override.modeCode ?? modeCode,
          dangerousGoods: override.dangerousGoods ?? dangerousGoods,
          gateIndicators: override.gateIndicators ?? gateIndicators,
          requestId:
            override.requestId !== undefined ? override.requestId : requestId,
          response:
            override.response !== undefined ? override.response : response,
        })
      );
    },
    [
      onSnapshotChange,
      readOnly,
      identifier,
      identifierTypes,
      registrationCountryCode,
      modeCode,
      dangerousGoods,
      gateIndicators,
      requestId,
      response,
    ]
  );

  useEffect(() => {
    if (!onSnapshotChange || readOnly) return;
    const t = window.setTimeout(() => {
      onSnapshotChange({
        identifier,
        identifierTypes,
        registrationCountryCode,
        modeCode,
        dangerousGoods,
        gateIndicators,
        requestId,
        response,
      });
    }, 350);
    return () => window.clearTimeout(t);
  }, [
    identifier,
    identifierTypes,
    registrationCountryCode,
    modeCode,
    dangerousGoods,
    gateIndicators,
    requestId,
    response,
    onSnapshotChange,
    readOnly,
  ]);

  const refresh = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const res = await getIdentifiersResult(requestId);
      setResponse(res);
      pushToParent({ response: res });
      if (res.status !== "PENDING") toast.success("Zahtjev ažuriran");
    } catch {
      toast.error("Greška pri dohvatu rezultata");
    } finally {
      setLoading(false);
    }
  }, [requestId, pushToParent]);

  const submit = async () => {
    if (readOnly) return;
    setLoading(true);
    try {
      const { requestId: rid } = await postIdentifiersSearch({
        modeCode: modeCode || null,
        identifier: identifier.trim(),
        identifierType: identifierTypes,
        registrationCountryCode: registrationCountryCode || null,
        dangerousGoodsIndicator: getBoolDg(dangerousGoods),
        eftiGateIndicator: gateIndicators,
      });
      setRequestId(rid);
      let res = await getIdentifiersResult(rid);
      while (res.status === "PENDING") {
        res = await getIdentifiersResult(rid);
      }
      setResponse(res);
      pushToParent({
        requestId: rid,
        response: res,
        identifier: identifier.trim(),
      });
      toast.success("Zahtjev spremljen");
      requestAnimationFrame(() => {
        resultSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch {
      toast.error("Greška pri slanju zahtjeva");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (readOnly) return;
    setIdentifier("");
    setIdentifierTypes([]);
    setRegistrationCountryCode("");
    setModeCode("");
    setDangerousGoods("NA");
    setGateIndicators([]);
    setRequestId(null);
    setResponse(null);
    setExpanded(new Set());
    if (onSnapshotChange && !readOnly) {
      onSnapshotChange(emptySnapshot());
    }
  };

  const toggleType = (t: string) => {
    if (readOnly) return;
    setIdentifierTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleGate = (g: string) => {
    if (readOnly) return;
    setGateIndicators((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const selAllGates = () => {
    if (readOnly) return;
    setGateIndicators([...GATE_COUNTRIES]);
  };
  const selNoGates = () => {
    if (readOnly) return;
    setGateIndicators([]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        id="section-osnovno"
        className="rounded-xl border border-[#dde2ea] bg-white overflow-hidden shadow-sm scroll-mt-24"
      >
        <div className="bg-[#002d74] text-white px-5 py-3 text-[15px] font-semibold">
          Zahtjev · pretraga po identifikatoru
        </div>
        <div id="section-kriteriji" className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Identifikator</label>
              <input
                className={inputCls}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div>
              <label className={labelCls}>Vrsta identifikatora</label>
              <div className="flex flex-wrap gap-3 py-2">
                {IDENTIFIER_TYPES.map((t) => (
                  <label
                    key={t}
                    className="flex items-center gap-2 text-sm text-[#374151]"
                  >
                    <input
                      type="checkbox"
                      checked={identifierTypes.includes(t)}
                      onChange={() => toggleType(t)}
                      disabled={readOnly}
                      className="accent-[#002d74]"
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Kod zemlje registracije</label>
              <select
                className={inputCls}
                value={registrationCountryCode}
                onChange={(e) => setRegistrationCountryCode(e.target.value)}
                disabled={readOnly}
              >
                <option value="">—</option>
                {GATE_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tip prijevoza</label>
              <select
                className={inputCls}
                value={modeCode}
                onChange={(e) => setModeCode(e.target.value)}
                disabled={readOnly}
              >
                <option value="">—</option>
                <option value="1">Waterway</option>
                <option value="2">Railway</option>
                <option value="3">Road</option>
                <option value="4">Air</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Je li opasna roba?</label>
              <div className="flex gap-4 py-2">
                {(
                  [
                    ["YES", "Da"],
                    ["NO", "Ne"],
                    ["NA", "N/A"],
                  ] as const
                ).map(([v, l]) => (
                  <label
                    key={v}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="dg"
                      checked={dangerousGoods === v}
                      onChange={() => setDangerousGoods(v)}
                      disabled={readOnly}
                      className="accent-[#002d74]"
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>eFTI Gate (višestruki odabir)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  type="button"
                  onClick={selAllGates}
                  disabled={readOnly}
                  className="text-xs text-[#002d74] underline"
                >
                  Odaberi sve
                </button>
                <button
                  type="button"
                  onClick={selNoGates}
                  disabled={readOnly}
                  className="text-xs text-[#002d74] underline"
                >
                  Poništi
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto border border-[#e2e8f2] rounded-lg p-2 flex flex-wrap gap-2">
                {GATE_COUNTRIES.map((g) => (
                  <label
                    key={g}
                    className="inline-flex items-center gap-1.5 text-xs text-[#374151]"
                  >
                    <input
                      type="checkbox"
                      checked={gateIndicators.includes(g)}
                      onChange={() => toggleGate(g)}
                      disabled={readOnly}
                      className="accent-[#002d74]"
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>
          </div>
          {!readOnly && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={reset}
                className="text-sm text-[#002d74] font-medium hover:underline"
              >
                Resetiraj
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-[#002d74] text-white text-sm font-medium hover:bg-[#1a4a9e] disabled:opacity-60 flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Pošalji zahtjev
              </button>
            </div>
          )}
        </div>
      </div>

      {requestId && (
        <>
          <div
            ref={resultSectionRef}
            id="section-rezultati"
            className="text-center text-[17px] font-semibold text-[#1d2a3a] scroll-mt-24"
          >
            Rezultat
          </div>

          <div
            id="section-dataseti"
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start scroll-mt-24"
          >
            <div className="lg:col-span-4">
              <EuropeMapChart result={response} />
            </div>
            <div className="lg:col-span-8 rounded-xl border border-[#dde2ea] bg-white p-4">
              <div className="flex flex-wrap items-center gap-3 mb-4 pb-3 border-b border-[#eef0f4]">
                <span className="text-xs font-semibold text-[#5f6f86] uppercase">
                  RequestId
                </span>
                <span className="font-mono text-sm text-[#1d2a3a]">
                  {requestId}
                </span>
                <span className="text-xs font-semibold text-[#5f6f86] uppercase">
                  Status
                </span>
                <span
                  className={`text-sm ${response ? statusBadgeClass(response.status) : ""}`}
                >
                  {response?.status ?? "—"}
                </span>
                <button
                  type="button"
                  onClick={refresh}
                  disabled={loading || !requestId}
                  className="ml-auto px-3 py-1.5 rounded-md bg-[#002d74] text-white text-xs font-medium hover:bg-[#1a4a9e] disabled:opacity-50"
                >
                  Osvježi
                </button>
              </div>

              {consignments.length === 0 ? (
                <p className="text-sm text-[#6b7a8d] text-center py-6">
                  Nema pronađenih zapisa
                </p>
              ) : (
                <div className="space-y-3">
                  {consignments.map((c, i) => (
                    <IdentifierResultCard
                      key={`${c.datasetId}-${i}`}
                      identifier={c}
                      expanded={expanded.has(i)}
                      onToggle={() =>
                        setExpanded((prev) => {
                          const n = new Set(prev);
                          if (n.has(i)) n.delete(i);
                          else {
                            n.add(i);
                            fireResultSelected();
                          }
                          return n;
                        })
                      }
                      onOpenDataset={fireResultSelected}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function IdentifierResultCard({
  identifier,
  expanded,
  onToggle,
  onOpenDataset,
}: {
  identifier: Consignment;
  expanded: boolean;
  onToggle: () => void;
  onOpenDataset?: () => void;
}) {
  const dg = getDangerousGoodsIndicator(identifier);
  const mode = getMainTransportMode(identifier);
  const country = getMainTransportCountry(identifier);

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        dg === "YES"
          ? "border-[#ffb74d] bg-[#fffaf3]"
          : "border-[#dde2ea] bg-[#fafbff]"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[#f0f4ff]/50"
      >
        <span className="text-[#002d74]">{expanded ? "▼" : "▶"}</span>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="text-sm font-semibold text-[#1d2a3a] flex flex-wrap gap-x-2 gap-y-1">
            <span>Gate {identifier.gateId}</span>
            <span className="text-[#9aa5b4]">|</span>
            <span>
              Dataset ID: {identifier.datasetId.slice(0, 12)}…
            </span>
            <span className="text-[#9aa5b4]">|</span>
            <span>
              ACCEPTED{" "}
              {format(parseISO(identifier.carrierAcceptanceDatetime), "dd.MM.yyyy")}
            </span>
            <span className="text-[#9aa5b4]">|</span>
            <span>
              DELIVERED{" "}
              {format(
                parseISO(identifier.deliveryEventActualOccurrenceDatetime),
                "dd.MM.yyyy"
              )}
            </span>
          </div>
          <div className="text-xs text-[#5f6f86] flex flex-wrap gap-2">
            {mode != null && (
              <span>
                {getTransportModeName(mode)}
                {country ? ` · ${country}` : ""}
                {dg === "YES" ? " · ADR" : ""}
              </span>
            )}
            <span>| 🚛 {getUsedEquipmentCount(identifier)}</span>
            {getCarriedEquipmentCount(identifier) > 0 && (
              <span>| 📦 {getCarriedEquipmentCount(identifier)}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-1.5 rounded-md bg-[#002d74] text-white text-xs shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDataset?.();
            toast.message(`Otvori dataset ${identifier.datasetId}`);
          }}
        >
          Otvori
        </button>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-[#eef0f4] bg-white/80 text-sm space-y-4">
          {identifier.mainCarriageTransportMovement?.map((t) => (
            <div key={t.id} className="text-[#374151]">
              <span className="font-semibold text-[#5f6f86]">
                Prijevozni segment:{" "}
              </span>
              {getTransportModeName(t.modeCode)} | ADR:{" "}
              {t.dangerousGoodsIndicator === "true"
                ? "Da"
                : t.dangerousGoodsIndicator === "false"
                  ? "Ne"
                  : "N/A"}{" "}
              | Država: {t.registrationCountryCode ?? "—"} | Reg.br.:{" "}
              {t.schemeAgencyId ?? "—"}
            </div>
          ))}
          {identifier.usedTransportEquipment?.map((eq, idx) => (
            <div key={eq.id} className="border border-[#e2e8f2] rounded-lg p-3">
              <div className="font-semibold text-[#1d2a3a] mb-2">
                Oprema #{idx + 1}: {eq.schemeAgencyId ?? eq.id}
              </div>
              <div className="text-xs text-[#5f6f86] space-y-1">
                <div>
                  Red. br.: {eq.sequenceNumber} · Kat.:{" "}
                  {eq.categoryCode ?? "—"} · Država:{" "}
                  {eq.registrationCountryCode ?? "—"}
                </div>
                {(eq.carriedTransportEquipment?.length ?? 0) > 0 ? (
                  <div className="mt-2">
                    Prevezena oprema:{" "}
                    {eq.carriedTransportEquipment
                      ?.map((c) => c.schemeAgencyId ?? String(c.id))
                      .join(", ")}
                  </div>
                ) : (
                  <div className="text-[#9aa5b4] italic">
                    Nema prevezene opreme
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export { emptySnapshot };
