import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { parseUilQrPayload } from "@/mock-efti/parse-qr-uil";
import type { RequestStatus, UilResultRow } from "@/mock-efti/types";
import { getUilResult, postFollowUpNote, postUilSearch } from "@/mock-efti/mock-efti-api";
import { statusBadgeClass } from "@/mock-efti/identifier-utils";
import { parseEftiXml } from "@/lib/eftiParser";
import type { EftiConsignment } from "@/types/efti";

/** portal-mock UilSearchComponent gates / platforms */
const GATES = ["borduria", "syldavia", "listenbourg"];
const PLATFORMS = [
  { id: "ttf", label: "ttf - FR" },
  { id: "croatia eFTI platform", label: "croatia eFTI platform" },
  { id: "slovenia eFTI platform", label: "slovenia eFTI platform" },
];

const inputCls =
  "w-full border border-[#cfd8e6] rounded-lg px-3 py-2.5 text-sm bg-white text-[#1d2a3a] focus:outline-none focus:ring-2 focus:ring-[#002d74]/20 focus:border-[#002d74]";

export interface UilSearchSnapshot {
  datasetId: string;
  gateId: string;
  platformId: string;
  rows: UilResultRow[];
  qrRaw?: string;
}

export interface UilDatasetSelection {
  consignment: EftiConsignment;
  xml: string;
  row: UilResultRow;
}

interface Props {
  /** Stable per-tab id; rehydrates from parent when switching tabs. */
  sessionId: string;
  variant: "manual" | "qr";
  initial?: UilSearchSnapshot;
  readOnly?: boolean;
  onSnapshotChange?: (s: UilSearchSnapshot) => void;
  /** Fired once when the user opens XML, downloads, or saves a follow-up note */
  onResultSelected?: () => void;
  /** Opening a COMPLETE row creates a dataset tab in the parent */
  onDatasetSelected?: (selection: UilDatasetSelection) => void;
}

function buildSnapshot(
  variant: "manual" | "qr",
  datasetId: string,
  gateId: string,
  platformId: string,
  rows: UilResultRow[],
  qrRaw: string
): UilSearchSnapshot {
  return {
    datasetId,
    gateId,
    platformId,
    rows,
    ...(variant === "qr" ? { qrRaw } : {}),
  };
}

export function emptyUilSnapshot(variant: "manual" | "qr"): UilSearchSnapshot {
  return {
    datasetId: "",
    gateId: "",
    platformId: "",
    rows: [],
    ...(variant === "qr" ? { qrRaw: "" } : {}),
  };
}

export default function UilSearchPanel({
  sessionId,
  variant,
  initial,
  readOnly,
  onSnapshotChange,
  onResultSelected,
  onDatasetSelected,
}: Props) {
  const [datasetId, setDatasetId] = useState(initial?.datasetId ?? "");
  const [gateId, setGateId] = useState(initial?.gateId ?? "");
  const [platformId, setPlatformId] = useState(initial?.platformId ?? "");
  const [qrRaw, setQrRaw] = useState(initial?.qrRaw ?? "");
  const [rows, setRows] = useState<UilResultRow[]>(initial?.rows ?? []);
  const [loading, setLoading] = useState(false);
  const [noteOpen, setNoteOpen] = useState<UilResultRow | null>(null);
  const [noteText, setNoteText] = useState("");
  const [xmlView, setXmlView] = useState<{ row: UilResultRow; xml: string; parsed: ParsedXmlSummary | null } | null>(null);
  const resultPickNotified = useRef(false);

  const fireResultSelected = () => {
    if (readOnly || !onResultSelected || resultPickNotified.current) return;
    resultPickNotified.current = true;
    onResultSelected();
  };

  const initialRef = useRef(initial);
  initialRef.current = initial;

  useEffect(() => {
    const s = initialRef.current ?? emptyUilSnapshot(variant);
    setDatasetId(s.datasetId);
    setGateId(s.gateId);
    setPlatformId(s.platformId);
    setRows([...s.rows]);
    setQrRaw(variant === "qr" ? s.qrRaw ?? "" : "");
    resultPickNotified.current = false;
  }, [sessionId, variant]);

  const pushToParent = useCallback(
    (override: Partial<UilSearchSnapshot> & { rows?: UilResultRow[] }) => {
      if (!onSnapshotChange || readOnly) return;
      const snap = buildSnapshot(
        variant,
        override.datasetId ?? datasetId,
        override.gateId ?? gateId,
        override.platformId ?? platformId,
        override.rows ?? rows,
        override.qrRaw !== undefined ? override.qrRaw : qrRaw
      );
      flushSync(() => {
        onSnapshotChange(snap);
      });
    },
    [
      variant,
      onSnapshotChange,
      readOnly,
      datasetId,
      gateId,
      platformId,
      rows,
      qrRaw,
    ]
  );

  useEffect(() => {
    if (!onSnapshotChange || readOnly) return;
    const t = window.setTimeout(() => {
      onSnapshotChange(
        buildSnapshot(
          variant,
          datasetId,
          gateId,
          platformId,
          rows,
          qrRaw
        )
      );
    }, 350);
    return () => window.clearTimeout(t);
  }, [
    datasetId,
    gateId,
    platformId,
    rows,
    qrRaw,
    variant,
    onSnapshotChange,
    readOnly,
  ]);

  const applyQr = () => {
    if (readOnly) return;
    const parsed = parseUilQrPayload(qrRaw);
    if (!parsed) {
      toast.error("Nije moguće protumačiti QR sadržaj");
      return;
    }
    setDatasetId(parsed.datasetId);
    setGateId(parsed.gateId);
    setPlatformId(parsed.platformId);
    toast.success("QR sadržaj primijenjen na forma polja");
  };

  const reset = () => {
    if (readOnly) return;
    setDatasetId("");
    setGateId("");
    setPlatformId("");
    setQrRaw("");
    setRows([]);
    if (onSnapshotChange && !readOnly) {
      flushSync(() => {
        onSnapshotChange(emptyUilSnapshot(variant));
      });
    }
  };

  const submit = async () => {
    if (readOnly) return;
    setLoading(true);
    try {
      const res = await postUilSearch();
      const newRow: UilResultRow = {
        requestId: res.requestId,
        status: res.status as RequestStatus,
        datasetId: datasetId.trim(),
        gateId: gateId.trim(),
        platformId: platformId.trim(),
      };
      setRows((r) => [...r, newRow]);
      let poll = await getUilResult(res.requestId);
      while (poll.status === "PENDING") {
        poll = await getUilResult(res.requestId);
      }
      setRows((r) => {
        const next = r.map((x) =>
          x.requestId === res.requestId
            ? {
                ...x,
                status: poll.status as RequestStatus,
                data: poll.data ?? undefined,
                errorCode: poll.errorCode,
                errorDescription: poll.errorDescription,
              }
            : x
        );
        pushToParent({
          datasetId: datasetId.trim(),
          gateId: gateId.trim(),
          platformId: platformId.trim(),
          rows: next,
        });
        return next;
      });
      toast.success("Zahtjev spremljen");
    } catch {
      toast.error("Greška pri slanju UIL zahtjeva");
    } finally {
      setLoading(false);
    }
  };

  const pollOne = async (rid: string) => {
    setLoading(true);
    try {
      const poll = await getUilResult(rid);
      setRows((r) => {
        const next = r.map((x) =>
          x.requestId === rid
            ? {
                ...x,
                status: poll.status as RequestStatus,
                data: poll.data ?? undefined,
                errorCode: poll.errorCode,
                errorDescription: poll.errorDescription,
              }
            : x
        );
        pushToParent({ rows: next });
        return next;
      });
      if (poll.status !== "PENDING") toast.success("Zahtjev ažuriran");
    } catch {
      toast.error("Greška pri dohvatu");
    } finally {
      setLoading(false);
    }
  };

  const clearRows = () => {
    if (readOnly) return;
    setRows([]);
    pushToParent({ rows: [] });
  };

  const openXml = (row: UilResultRow) => {
    if (!row.data) return;
    try {
      const xml = decodeURIComponent(escape(atob(row.data)));
      setXmlView({ row, xml, parsed: parseXmlSummary(xml) });
      fireResultSelected();
    } catch {
      toast.error("Neuspjelo dekodiranje XML-a");
    }
  };

  const downloadXml = (row: UilResultRow) => {
    if (!row.data) return;
    try {
      const xml = decodeURIComponent(escape(atob(row.data)));
      const blob = new Blob([xml], { type: "application/xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${row.datasetId}.xml`;
      a.click();
      fireResultSelected();
    } catch {
      toast.error("Preuzimanje nije uspjelo");
    }
  };

  const saveNote = async () => {
    if (!noteOpen) return;
    await postFollowUpNote();
    fireResultSelected();
    toast.success("Napomena spremljena (mock)");
    setNoteOpen(null);
    setNoteText("");
  };

  return (
    <div className="flex flex-col gap-6">
      <div
        id="section-osnovno"
        className="rounded-xl border border-[#dde2ea] bg-white overflow-hidden shadow-sm scroll-mt-24"
      >
        <div className="bg-[#002d74] text-white px-5 py-3 text-[15px] font-semibold">
          {variant === "qr"
            ? "Zahtjev · UIL (QR kod)"
            : "Zahtjev · UIL ručni unos"}
        </div>
        <div id="section-kriteriji" className="p-5 space-y-4 scroll-mt-24">
          {variant === "qr" && !readOnly && (
            <div>
              <label className="text-[12px] font-semibold text-[#5f6f86] mb-1.5 block">
                Skenirani / zalijepljeni QR sadržaj
              </label>
              <textarea
                className={`${inputCls} min-h-[88px] font-mono text-xs`}
                value={qrRaw}
                onChange={(e) => setQrRaw(e.target.value)}
                placeholder="Zalijepite tekst iz QR koda (JSON, URL, efti:// ili samo UUID)"
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={applyQr}
                  className="px-4 py-2 rounded-lg bg-[#eef3ff] text-[#002d74] text-sm font-medium border border-[#d6e2ff]"
                >
                  Primijeni na polja
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[12px] font-semibold text-[#5f6f86] mb-1.5 block">
                Dataset Id *
              </label>
              <input
                className={inputCls}
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                disabled={readOnly}
                list="uil-dataset-only"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#5f6f86] mb-1.5 block">
                Gate Id *
              </label>
              <input
                className={inputCls}
                value={gateId}
                onChange={(e) => setGateId(e.target.value)}
                disabled={readOnly}
                list="uil-gates"
              />
              <datalist id="uil-gates">
                {GATES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#5f6f86] mb-1.5 block">
                Platform Id *
              </label>
              <input
                className={inputCls}
                value={platformId}
                onChange={(e) => setPlatformId(e.target.value)}
                disabled={readOnly}
                list="uil-platforms"
              />
              <datalist id="uil-platforms">
                {PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </datalist>
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
                className="px-5 py-2.5 rounded-lg bg-[#002d74] text-white text-sm font-medium hover:bg-[#1a4a9e] disabled:opacity-60"
              >
                Pošalji zahtjev
              </button>
            </div>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div
            id="section-rezultati"
            className="text-center text-[17px] font-semibold text-[#1d2a3a] scroll-mt-24"
          >
            Rezultat
          </div>
          <div
            id="section-dataseti"
            className="rounded-xl border border-[#dde2ea] bg-white overflow-x-auto scroll-mt-24"
          >
            <div className="p-3 flex justify-end border-b border-[#eef0f4]">
              <button
                type="button"
                onClick={clearRows}
                disabled={readOnly}
                className="text-sm text-[#002d74] hover:underline"
              >
                Očisti
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f4f6f9] text-left text-[11px] uppercase text-[#6b7a8d]">
                  <th className="px-4 py-3">RequestId</th>
                  <th className="px-4 py-3">Gate Id</th>
                  <th className="px-4 py-3">Dataset Id</th>
                  <th className="px-4 py-3">Platform Id</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Akcija</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((res) => (
                  <tr
                    key={res.requestId}
                    className="border-t border-[#f0f2f5] hover:bg-[#fafbfc]"
                  >
                    <td className="px-4 py-3 font-mono text-xs">{res.requestId}</td>
                    <td className="px-4 py-3">{res.gateId}</td>
                    <td className="px-4 py-3 font-mono text-xs">{res.datasetId}</td>
                    <td className="px-4 py-3">{res.platformId}</td>
                    <td className={`px-4 py-3 ${statusBadgeClass(res.status)}`}>
                      {res.status}
                      {res.status === "ERROR" && res.errorDescription && (
                        <span className="ml-1 text-[#b71c1c]" title={res.errorDescription}>
                          ℹ
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setNoteOpen(res)}
                          className="px-2 py-1 rounded bg-[#002d74] text-white text-xs"
                        >
                          Napomena
                        </button>
                        {res.status === "COMPLETE" && res.data && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                if (!res.data) return;
                                try {
                                  const xml = decodeURIComponent(escape(atob(res.data)));
                                  const consignment = parseEftiXml(xml);
                                  if (onDatasetSelected) {
                                    onDatasetSelected({ consignment, xml, row: res });
                                  } else {
                                    openXml(res);
                                  }
                                  fireResultSelected();
                                } catch {
                                  toast.error("Neuspjelo parsiranje eFTI XML-a");
                                }
                              }}
                              className="px-2 py-1 rounded bg-[#002d74] text-white text-xs"
                            >
                              Otvori
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadXml(res)}
                              className="px-2 py-1 rounded bg-[#002d74] text-white text-xs"
                            >
                              Preuzmi
                            </button>
                          </>
                        )}
                        {res.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => pollOne(res.requestId)}
                            className="px-2 py-1 rounded bg-[#002d74] text-white text-xs"
                          >
                            Osvježi
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {noteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl">
            <h3 className="font-semibold text-[#1d2a3a] mb-3">
              Follow-up komunikacija
            </h3>
            <textarea
              className={inputCls + " min-h-[100px]"}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setNoteOpen(null);
                  setNoteText("");
                }}
                className="px-3 py-2 text-sm border rounded-lg"
              >
                Odustani
              </button>
              <button
                type="button"
                onClick={saveNote}
                className="px-3 py-2 text-sm rounded-lg bg-[#002d74] text-white"
              >
                Spremi
              </button>
            </div>
          </div>
        </div>
      )}

      {xmlView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-xl overflow-hidden">
            <div className="bg-[#002d74] text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-[15px] font-semibold">
                  eFTI podatci{xmlView.parsed?.typeCode ? ` \u00b7 ${xmlView.parsed.typeCode}` : ""}
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  Dataset: {xmlView.row.datasetId || "—"} · Gate: {xmlView.row.gateId || "—"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => downloadXml(xmlView.row)}
                  className="px-3 py-1.5 rounded-md bg-white/20 text-white text-xs hover:bg-white/30"
                >
                  Preuzmi XML
                </button>
                <button
                  type="button"
                  onClick={() => setXmlView(null)}
                  className="px-3 py-1.5 rounded-md bg-white/20 text-white text-xs hover:bg-white/30"
                >
                  Zatvori
                </button>
              </div>
            </div>

            {xmlView.parsed && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 border-b border-[#eef0f4] bg-[#fafbff] shrink-0">
                {xmlView.parsed.carrier && (
                  <SummaryCard label="Prijevoznik" value={xmlView.parsed.carrier} sublabel={xmlView.parsed.carrierAddress} />
                )}
                {xmlView.parsed.consignor && (
                  <SummaryCard label="Pošiljatelj" value={xmlView.parsed.consignor} sublabel={xmlView.parsed.consignorAddress} />
                )}
                {xmlView.parsed.consignee && (
                  <SummaryCard label="Primatelj" value={xmlView.parsed.consignee} sublabel={xmlView.parsed.consigneeAddress} />
                )}
                {xmlView.parsed.vehicleId && (
                  <SummaryCard label="Vozilo" value={xmlView.parsed.vehicleId} sublabel={xmlView.parsed.modeCode === "3" ? "Cestovni" : xmlView.parsed.modeCode === "2" ? "Željeznički" : xmlView.parsed.modeCode === "1" ? "Vodeni" : xmlView.parsed.modeCode === "4" ? "Zračni" : undefined} />
                )}
                {xmlView.parsed.grossWeight && (
                  <SummaryCard label="Bruto masa" value={xmlView.parsed.grossWeight} />
                )}
                {xmlView.parsed.grossVolume && (
                  <SummaryCard label="Bruto obujam" value={xmlView.parsed.grossVolume} />
                )}
                {xmlView.parsed.carrierAcceptance && (
                  <SummaryCard label="Datum prihvata" value={xmlView.parsed.carrierAcceptance.slice(0, 10)} />
                )}
                {xmlView.parsed.hasDangerousGoods && (
                  <SummaryCard label="Opasna roba" value="Da (ADR)" sublabel={xmlView.parsed.dangerousGoodsName} />
                )}
              </div>
            )}

            {xmlView.parsed?.items && xmlView.parsed.items.length > 0 && (
              <div className="px-5 py-3 border-b border-[#eef0f4] bg-white shrink-0">
                <h4 className="text-xs font-semibold text-[#5f6f86] uppercase mb-2">Stavke pošiljke ({xmlView.parsed.items.length})</h4>
                <div className="grid gap-2">
                  {xmlView.parsed.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-[#374151] bg-[#f8f9fb] rounded-lg px-3 py-2">
                      <span className="font-semibold text-[#002d74]">#{idx + 1}</span>
                      <span>{item.quantity} kom</span>
                      <span className="text-[#9aa5b4]">|</span>
                      <span>{item.weight}</span>
                      {item.description && (
                        <>
                          <span className="text-[#9aa5b4]">|</span>
                          <span className="text-[#6b7a8d]">{item.description}</span>
                        </>
                      )}
                      {item.isDangerous && (
                        <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-[#fff3e0] text-[#e65100] border border-[#ffcc80]">ADR</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-auto p-5 bg-[#f8f9fb]">
              <pre className="text-xs font-mono text-[#1d2a3a] whitespace-pre-wrap leading-relaxed">{xmlView.xml}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ConsignmentItem {
  quantity: string;
  weight: string;
  description?: string;
  isDangerous: boolean;
  dangerousGoodsName?: string;
}

interface ParsedXmlSummary {
  typeCode?: string;
  carrierAcceptance?: string;
  carrier?: string;
  carrierAddress?: string;
  consignor?: string;
  consignorAddress?: string;
  consignee?: string;
  consigneeAddress?: string;
  modeCode?: string;
  vehicleId?: string;
  grossWeight?: string;
  grossVolume?: string;
  hasDangerousGoods: boolean;
  dangerousGoodsName?: string;
  items: ConsignmentItem[];
}

function parseXmlSummary(xml: string): ParsedXmlSummary | null {
  try {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.querySelector("parsererror")) return null;

    const tag = (name: string) => {
      const el = doc.getElementsByTagName(name)[0];
      return el?.textContent?.trim() ?? "";
    };
    const childName = (parentTag: string) => {
      const p = doc.getElementsByTagName(parentTag)[0];
      return p?.getElementsByTagName("name")[0]?.textContent?.trim() ?? "";
    };
    const childAddress = (parentTag: string) => {
      const p = doc.getElementsByTagName(parentTag)[0];
      if (!p) return "";
      const addr = p.getElementsByTagName("postalAddress")[0];
      if (!addr) return "";
      const city = addr.getElementsByTagName("cityName")[0]?.textContent?.trim() ?? "";
      const country = addr.getElementsByTagName("countryCode")[0]?.textContent?.trim() ?? "";
      const street = addr.getElementsByTagName("streetName")[0]?.textContent?.trim() ?? "";
      return [street, city, country].filter(Boolean).join(", ");
    };

    const weightEl = doc.getElementsByTagName("grossWeight")[0];
    const volumeEl = doc.getElementsByTagName("grossVolume")[0];

    const itemEls = doc.getElementsByTagName("includedConsignmentItem");
    const items: ConsignmentItem[] = [];
    for (let i = 0; i < itemEls.length; i++) {
      const it = itemEls[i];
      const qty = it.getElementsByTagName("goodsUnitQuantity")[0]?.textContent?.trim() ?? "—";
      const wEl = it.getElementsByTagName("grossWeight")[0];
      const w = wEl ? `${wEl.textContent?.trim()} ${wEl.getAttribute("unitId") ?? ""}` : "—";
      const desc = it.getElementsByTagName("description")[0]?.textContent?.trim();
      const dgEl = it.getElementsByTagName("transportDangerousGoods")[0];
      items.push({
        quantity: qty,
        weight: w,
        description: desc,
        isDangerous: !!dgEl,
        dangerousGoodsName: dgEl?.getElementsByTagName("properShippingName")[0]?.textContent?.trim(),
      });
    }

    return {
      typeCode: tag("typeCode") || undefined,
      carrierAcceptance: tag("carrierAcceptanceDateTime") || undefined,
      carrier: childName("carrier") || undefined,
      carrierAddress: childAddress("carrier") || undefined,
      consignor: childName("consignor") || undefined,
      consignorAddress: childAddress("consignor") || undefined,
      consignee: childName("consignee") || undefined,
      consigneeAddress: childAddress("consignee") || undefined,
      modeCode: tag("modeCode") || undefined,
      vehicleId: doc.getElementsByTagName("usedTransportMeans")[0]?.getElementsByTagName("id")[0]?.textContent?.trim() ?? undefined,
      grossWeight: weightEl ? `${weightEl.textContent?.trim()} ${weightEl.getAttribute("unitId") ?? ""}` : undefined,
      grossVolume: volumeEl ? `${volumeEl.textContent?.trim()} ${volumeEl.getAttribute("unitId") ?? ""}` : undefined,
      hasDangerousGoods: items.some((it) => it.isDangerous),
      dangerousGoodsName: items.find((it) => it.isDangerous)?.dangerousGoodsName,
      items,
    };
  } catch {
    return null;
  }
}

function SummaryCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="rounded-lg border border-[#e2e8f2] bg-white px-3 py-2.5">
      <div className="text-[10px] font-semibold text-[#5f6f86] uppercase">{label}</div>
      <div className="text-sm font-semibold text-[#1d2a3a] mt-0.5">{value}</div>
      {sublabel && <div className="text-[11px] text-[#6b7a8d] mt-0.5">{sublabel}</div>}
    </div>
  );
}
