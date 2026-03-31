import { useState } from "react";
import type { ReferencedDocument } from "@/types/efti";

const TRANSPORT_DOC_TYPES = new Set(["CMR", "ECMR", "CIM", "BL", "AWB", "AIRWAYBILL", "BILL_OF_LADING"]);

type DocCategory = "transport" | "attachment" | "reference";

function categorize(doc: ReferencedDocument): DocCategory {
  const tc = doc.typeCode?.toUpperCase() ?? "";
  if (TRANSPORT_DOC_TYPES.has(tc)) return "transport";
  if (tc === "ATTACHMENT" || (doc.attachedBinaryFile?.length ?? 0) > 0 || !!doc.attachedBinaryObject) return "attachment";
  return "reference";
}

const CATEGORY_META: Record<DocCategory, { label: string; badge: string; badgeBg: string; badgeText: string; icon: string }> = {
  transport: { label: "Prijevozni dokument", badge: "", badgeBg: "#e7f0ff", badgeText: "#1565c0", icon: "📄" },
  attachment: { label: "Binarni dokument", badge: "Prilog", badgeBg: "#fef3c7", badgeText: "#92400e", icon: "📎" },
  reference: { label: "Trgovačka ref.", badge: "Referenca", badgeBg: "#e8f5e9", badgeText: "#2e7d32", icon: "🔗" },
};

function formatDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[3]}.${m[2]}.${m[1]}.`;
  return raw;
}

function formatFileSize(bytes?: string): string | undefined {
  if (!bytes) return undefined;
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return bytes;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function ActionButton({ onClick, children, variant = "default" }: { onClick?: () => void; children: React.ReactNode; variant?: "default" | "active"; }) {
  const base = "inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors cursor-pointer";
  const style = variant === "active"
    ? `${base} text-white bg-[#1565c0] border border-[#1565c0] hover:bg-[#0d47a1]`
    : `${base} text-[#1565c0] border border-[#90caf9] hover:bg-[#e3f2fd]`;
  return <button onClick={onClick} className={style}>{children}</button>;
}

function BinaryPreview({ fileName }: { fileName?: string }) {
  const ext = fileName?.split(".").pop()?.toLowerCase();
  const isPdf = ext === "pdf";

  return (
    <div className="mt-3 border border-[#e2e8f2] rounded-lg overflow-hidden bg-[#fafbff]">
      <div className="flex items-center justify-between px-3 py-2 bg-[#f0f4fa] border-b border-[#e2e8f2]">
        <span className="text-[11px] font-semibold text-[#374151]">{fileName ?? "Dokument"}</span>
        <span className="text-[10px] text-[#6b7a8d]">{isPdf ? "PDF pregled" : "Pregled"}</span>
      </div>
      <div className="p-4">
        {isPdf ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-full bg-white border border-[#e5e7eb] rounded p-4 text-[12px] text-[#374151] space-y-3" style={{ fontFamily: "serif" }}>
              <div className="text-center border-b border-[#d1d5db] pb-2 mb-2">
                <p className="font-bold text-[14px]">ADR CERTIFIKAT</p>
                <p className="text-[11px] text-[#6b7a8d]">Potvrda o osposobljenosti vozila za prijevoz opasnih tvari</p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                <p><span className="font-semibold">Registracija:</span> ZG-1234-AB</p>
                <p><span className="font-semibold">Vrijedi do:</span> 15.09.2027.</p>
                <p><span className="font-semibold">Klasa ADR:</span> 3 — Zapaljive tekućine</p>
                <p><span className="font-semibold">Izdavatelj:</span> HAK</p>
              </div>
              <div className="mt-2 pt-2 border-t border-[#e5e7eb] text-[10px] text-[#9ca3af] text-center">
                Dokument generiran iz eFTI binarnog objekta (ASBIE1443 / eFTI185)
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#6b7a8d]">Stranica 1 od 1</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-[12px] text-[#9aa5b4]">
            <p>Pregled nije dostupan za ovaj format.</p>
            <p className="mt-1">Preuzmite datoteku za prikaz.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentCard({ doc, onPreviewToggle, isPreviewing }: { doc: ReferencedDocument; onPreviewToggle?: () => void; isPreviewing?: boolean }) {
  const [showDetails, setShowDetails] = useState(false);
  const category = categorize(doc);
  const meta = CATEGORY_META[category];
  const typeCode = doc.typeCode ?? "";
  const file = doc.attachedBinaryFile?.[0];

  return (
    <div className={`border rounded-lg p-3 bg-white ${isPreviewing ? "border-[#1565c0] ring-1 ring-[#1565c0]/20" : "border-[#e2e8f2]"}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0 mt-0.5">{meta.icon}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {typeCode && TRANSPORT_DOC_TYPES.has(typeCode.toUpperCase()) && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold text-[#1565c0] bg-[#e7f0ff]">{typeCode}</span>
            )}
            {meta.badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: meta.badgeBg, color: meta.badgeText }}>
                {meta.badge}
              </span>
            )}
            <span className="text-[11px] font-semibold text-[#6b7a8d]">{meta.label}</span>
          </div>

          {category === "transport" && (
            <>
              <p className="text-[13px] font-semibold text-[#1d2a3a] mt-1 truncate">
                {typeCode} teretni list br. {doc.id ?? "—"}
              </p>
              {(doc.issueLocation?.name || doc.formattedIssueDateTime) && (
                <p className="text-[11px] text-[#6b7a8d] mt-0.5">
                  Izdan: {doc.issueLocation?.name ?? ""} {formatDate(doc.formattedIssueDateTime)}
                </p>
              )}
              {doc.uRI && (
                <p className="text-[11px] text-[#9aa5b4] truncate mt-0.5">eFTI168: {doc.uRI}</p>
              )}
            </>
          )}

          {category === "attachment" && (
            <>
              <p className="text-[13px] font-semibold text-[#1d2a3a] mt-1 truncate">
                {file?.fileName ?? doc.id ?? "Prilog"}
              </p>
              {file && (
                <p className="text-[11px] text-[#6b7a8d] mt-0.5">
                  {file.mIMECode && <span>eFTI187 {file.mIMECode} </span>}
                  {formatFileSize(file.sizeMeasure)}
                </p>
              )}
            </>
          )}

          {category === "reference" && (
            <>
              <p className="text-[13px] font-semibold text-[#1d2a3a] mt-1 truncate">
                Narudžbenica {doc.id ?? ""}
              </p>
              {doc.referenceTypeCode && (
                <p className="text-[11px] text-[#6b7a8d] mt-0.5">Tip: {doc.referenceTypeCode}</p>
              )}
              {doc.issuer?.name && (
                <p className="text-[11px] text-[#6b7a8d]">Izdavatelj: {doc.issuer.name}</p>
              )}
              {showDetails && (
                <div className="mt-2 p-2.5 bg-[#f7f9fd] rounded-md text-[11px] text-[#374151] space-y-1 border border-[#e8ecf4]">
                  <p><span className="font-semibold">ID:</span> {doc.id ?? "—"}</p>
                  <p><span className="font-semibold">Tip dokumenta:</span> {doc.referenceTypeCode ?? doc.typeCode ?? "—"}</p>
                  {doc.issuer?.name && <p><span className="font-semibold">Izdavatelj:</span> {doc.issuer.name}</p>}
                  <p><span className="font-semibold">eFTI mapiranje:</span> ASBIE1057</p>
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-2 mt-2">
            {category === "transport" && doc.uRI && (
              <a
                href={doc.uRI}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#1565c0] border border-[#90caf9] rounded-md hover:bg-[#e3f2fd] transition-colors"
              >
                ↗ Otvori link
              </a>
            )}
            {category === "attachment" && (
              <ActionButton onClick={onPreviewToggle} variant={isPreviewing ? "active" : "default"}>
                {isPreviewing ? "✕ Zatvori" : "👁 Prikaži"}
              </ActionButton>
            )}
            {category === "reference" && (
              <ActionButton onClick={() => setShowDetails((v) => !v)} variant={showDetails ? "active" : "default"}>
                {showDetails ? "✕ Zatvori" : "≡ Detalji"}
              </ActionButton>
            )}
          </div>
        </div>
      </div>

      {category === "attachment" && isPreviewing && (
        <BinaryPreview fileName={file?.fileName} />
      )}
    </div>
  );
}

export default function DocumentsPanel({ documents }: { documents?: ReferencedDocument[] }) {
  const docs = documents ?? [];
  const count = docs.length;
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-bold text-[#1d2a3a]">Dokumenti</span>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#e7f0ff] text-[#1565c0]">
          {count}
        </span>
      </div>

      {count === 0 ? (
        <p className="text-sm text-[#9aa5b4] italic">Nema pridruženih dokumenata.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {docs.map((doc, i) => {
            const docKey = doc.id ?? String(i);
            return (
              <DocumentCard
                key={docKey}
                doc={doc}
                isPreviewing={previewDocId === docKey}
                onPreviewToggle={() => setPreviewDocId((prev) => prev === docKey ? null : docKey)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
