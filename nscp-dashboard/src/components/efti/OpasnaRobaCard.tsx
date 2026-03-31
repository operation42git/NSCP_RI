import { useState } from "react";
import type { DangerousGoods, EftiConsignment } from "@/types/efti";

function FieldPair({
  label,
  eftiId,
  value,
}: {
  label: string;
  eftiId?: string;
  value?: string | null;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold flex items-center gap-1.5">
        {label}
        {eftiId && (
          <span className="normal-case tracking-normal text-[9px] text-[#b4bfcc] font-normal">
            {eftiId}
          </span>
        )}
      </span>
      {value ? (
        <span className="text-[13px] text-[#1d2a3a] font-medium">{value}</span>
      ) : (
        <span className="text-[13px] text-[#c4cdd8] italic">—</span>
      )}
    </div>
  );
}

function DetailGroup({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[#b0616a]">{icon}</span>
        <span className="text-[12px] font-semibold text-[#7a3a42]">{title}</span>
      </div>
      <div className="ml-6">{children}</div>
    </div>
  );
}

function formatWeight(value?: string, unit?: string): string | undefined {
  if (!value) return undefined;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  const formatted = num.toLocaleString("hr-HR");
  const u = unit === "KGM" ? "kg" : unit === "MTQ" ? "m³" : unit ?? "";
  return `${formatted} ${u}`.trim();
}

type TabId = "stavka" | "oprema" | "razina";

/* ────────── Tab 1: Stavka pošiljke ────────── */

function StavkaContent({ dg }: { dg?: DangerousGoods }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!dg) {
    return <p className="text-sm text-[#9aa5b4] italic px-5 py-4">Nema podataka o opasnoj robi na razini stavke.</p>;
  }

  const detailGroups = 7;

  const flaskIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 2v5a2 2 0 01-2 2H3m0 0L1 7m2 2l2-2m6-2v5a2 2 0 002 2h3m0 0l2-2m-2 2l-2-2" /></svg>;
  const thermoIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  const radioIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
  const boxIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>;
  const tagIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
  const clipIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
  const gasIcon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>;

  return (
    <>
      <div className="px-5 pt-4 pb-4">
        {/* ADR IDENTIFIKACIJA */}
        <p className="text-[10px] uppercase tracking-wider text-[#b0616a] font-semibold mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c62828]" />
          ADR identifikacija (ASBIE1066)
        </p>

        {/* UN box + name */}
        <div className="flex items-start gap-4 mb-4">
          <div className="rounded-lg border-2 border-[#e65100] bg-[#fff3e0] px-4 py-2.5 flex-shrink-0">
            <span className="text-[11px] text-[#e65100] font-semibold block">UN</span>
            <span className="text-[22px] font-mono font-bold text-[#bf360c] tracking-wider">{dg.uNDGID ?? "—"}</span>
          </div>
          <div className="min-w-0 pt-1">
            <p className="text-[18px] font-bold text-[#1d2a3a]">{dg.properShippingName ?? "—"}</p>
            {dg.technicalName && (
              <p className="text-[12px] text-[#6b7a8d] mt-0.5">
                Tehnički naziv: {dg.technicalName} (eFTI235)
              </p>
            )}
          </div>
        </div>

        {/* 4-field critical ADR grid */}
        <div className="grid grid-cols-4 gap-4 rounded-lg border border-[#e2e8f2] bg-[#fafbff] px-4 py-3 mb-4">
          <div className="text-center">
            <span className="text-[10px] text-[#9aa5b4] block mb-0.5">Klasa (eFTI242)</span>
            <span className="text-[18px] font-bold text-[#c62828]">{dg.hazardClassificationID ?? "—"}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-[#9aa5b4] block mb-0.5">Kategorija (eFTI258)</span>
            <span className="text-[18px] font-bold text-[#1d2a3a]">{dg.hazardCategoryCode ?? "—"}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-[#9aa5b4] block mb-0.5">Pakiranje (eFTI236)</span>
            <span className="text-[18px] font-bold text-[#1d2a3a]">{dg.packagingDangerLevelCode ?? "—"}</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-[#9aa5b4] block mb-0.5">Tunel (eFTI255)</span>
            <span className="text-[18px] font-bold text-[#1d2a3a]">{dg.tunnelRestrictionCode ?? "—"}</span>
          </div>
        </div>

        {/* Mass & volume fields */}
        <div className="grid grid-cols-3 gap-4 mb-3">
          <FieldPair label="Bruto masa" eftiId="eFTI238" value={formatWeight(dg.grossWeight, dg.grossWeightUnit)} />
          <FieldPair label="Neto masa" eftiId="eFTI247" value={formatWeight(dg.netWeight, dg.netWeightUnit)} />
          <FieldPair label="Obujam" eftiId="eFTI243" value={formatWeight(dg.grossVolume, dg.grossVolumeUnit)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldPair label="Naljepnica" eftiId="eFTI1240" value={dg.labelCode} />
          <FieldPair label="Ogranič. količ." eftiId="eFTI261" value={dg.limitedQuantityCode} />
          <FieldPair label="Posebna odb." eftiId="eFTI256" value={dg.specialProvisionID} />
        </div>
      </div>

      {/* DETALJI OPASNE ROBE — expandable */}
      <button
        type="button"
        onClick={() => setDetailsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-2.5 border-t border-[#f5e0e0] bg-[#fef9f9] hover:bg-[#fdf0f0] transition-colors group"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-[#7a3a42] group-hover:text-[#c62828] transition-colors">
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${detailsOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
          Detalji opasne robe
        </span>
        <span className="text-[11px] text-[#d4a0a0] group-hover:text-[#c62828] transition-colors">
          {detailsOpen ? "Sakrij" : `${detailGroups} grupa`}
        </span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${detailsOpen ? "max-h-[2500px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 py-4 border-t border-[#f5e0e0] bg-[#fffbfb] flex flex-col gap-5">
          {/* Fizikalna svojstva */}
          <DetailGroup icon={flaskIcon} title="Fizikalna svojstva">
            <div className="grid grid-cols-3 gap-4 mb-3">
              <FieldPair label="Eksplozivna masa" eftiId="eFTI248" value={dg.explosiveMass} />
              <FieldPair label="Gustoća" eftiId="eFTI263" value={dg.density} />
              <FieldPair label="Talište" eftiId="eFTI265" value={dg.meltingPoint} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FieldPair label="Kod opasnosti" eftiId="eFTI1240" value={dg.hazardCode} />
              <FieldPair label="Agencija koda" eftiId="eFTI1241" value={dg.regulatoryAuthorityName} />
            </div>
          </DetailGroup>

          {/* Temperature */}
          <DetailGroup icon={thermoIcon} title="Temperature">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-[#e2e8f2] bg-white px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className="w-3 h-3 text-[#1f4bb8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[10px] text-[#9aa5b4]">Kontrolna (ASBIE1067)</span>
                </div>
                <p className="text-[10px] text-[#9aa5b4]">Tip: Maksimalna (eFTI281)</p>
                <p className="text-[20px] font-bold text-[#1d2a3a]">{dg.controlTemperature ?? "—"}</p>
              </div>
              <div className="rounded-lg border border-[#ffcdd2] bg-[#fff8f8] px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className="w-3 h-3 text-[#c62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-[10px] text-[#c62828]">Hitna (ASBIE1068)</span>
                </div>
                <p className="text-[10px] text-[#b0616a]">Tip: Kritična (eFTI285)</p>
                <p className="text-[20px] font-bold text-[#c62828]">{dg.emergencyTemperature ?? "—"}</p>
              </div>
            </div>
          </DetailGroup>

          {/* Radioaktivni materijal */}
          <DetailGroup icon={radioIcon} title="Radioaktivni materijal (ASBIE1069)">
            <p className="text-[13px] text-[#c4cdd8] italic">N/A — nema radioaktivnog materijala</p>
          </DetailGroup>

          {/* DG pakiranje */}
          <DetailGroup icon={boxIcon} title="DG pakiranje (ASBIE1073)">
            <div className="grid grid-cols-3 gap-4">
              <FieldPair label="Količina" eftiId="eFTI1266" value={dg.numberOfPackages} />
              <FieldPair label="Tip koda" eftiId="eFTI1267" value={dg.packagingTypeCode} />
              <FieldPair label="Tip tekst" eftiId="eFTI1268" value={dg.packingDescription} />
            </div>
          </DetailGroup>

          {/* Oznake */}
          <DetailGroup icon={tagIcon} title="Oznake">
            <div className="grid grid-cols-3 gap-4">
              <FieldPair
                label="Oznake"
                eftiId="eFTI1301"
                value={dg.uNDGID && dg.hazardClassificationID ? `UN${dg.uNDGID} / Klasa ${dg.hazardClassificationID}` : undefined}
              />
              <FieldPair label="Ref.dok. URI" eftiId="eFTI1302" value={undefined} />
              <FieldPair label="Uvjet pakiranja" eftiId="eFTI1307" value={undefined} />
            </div>
          </DetailGroup>

          {/* Uvjeti i napomene */}
          <DetailGroup icon={clipIcon} title="Uvjeti i napomene (ASBIE1077)">
            <div className="grid grid-cols-3 gap-4">
              <FieldPair label="Predmet" eftiId="eFTI1389" value={undefined} />
              <FieldPair label="Izjava kod" eftiId="eFTI1317" value={undefined} />
              <FieldPair label="Izjava tekst" value={undefined} />
            </div>
          </DetailGroup>

          {/* Plinski teret */}
          <DetailGroup icon={gasIcon} title="Plinski teret (ASBIE1080) i dokumenti">
            <div className="grid grid-cols-3 gap-4">
              <FieldPair label="Tip plina" eftiId="eFTI1335" value={undefined} />
              <FieldPair label="Dokument" eftiId="eFTI1326" value={undefined} />
              <FieldPair label="Teh. napomena" eftiId="eFTI1333" value={undefined} />
            </div>
          </DetailGroup>
        </div>
      </div>
    </>
  );
}

/* ────────── Tab 2: Na opremi ────────── */

function OpremaContent({ data }: { data: EftiConsignment }) {
  const dg = data.includedConsignmentItem?.[0]?.transportDangerousGoods;
  const equipment = data.usedTransportEquipment;

  return (
    <div className="px-5 pt-4 pb-4">
      <p className="text-[10px] uppercase tracking-wider text-[#b0616a] font-semibold mb-4 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c62828]" />
        Opasna roba na transportnoj opremi
      </p>

      {/* Korištena oprema */}
      <div className="rounded-lg border border-[#e2e8f2] bg-white mb-4 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#fafbff] border-b border-[#eef0f4]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6b7a8d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-[13px] font-semibold text-[#1d2a3a]">Korištena oprema (ASBIE1087)</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f5e9] text-[#2e7d32] font-medium">Used equip.</span>
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <FieldPair label="UN br." eftiId="eFTI387" value={dg?.uNDGID} />
            <FieldPair label="Klasifikacija" eftiId="eFTI395" value={dg?.hazardClassificationID} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <FieldPair label="Reg. tijelo" eftiId="eFTI388" value="ADR" />
            <FieldPair label="Količina" eftiId="eFTI399" value={formatWeight(dg?.netWeight, dg?.netWeightUnit)} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <FieldPair label="Cisterna info" eftiId="eFTI392" value={undefined} />
            <FieldPair label="Fumigacija" eftiId="eFTI397" value={undefined} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldPair label="Prethodni teret" eftiId="eFTI401" value={undefined} />
            <FieldPair label="Pakiranje" eftiId="eFTI402" value={dg?.numberOfPackages} />
          </div>
          {equipment && equipment.length > 0 && (
            <p className="text-[11px] text-[#9aa5b4] mt-3 border-t border-[#eef0f4] pt-2">
              Oprema: {equipment.map((e) => e.id).filter(Boolean).join(", ") || "—"}
            </p>
          )}
        </div>
      </div>

      {/* Prevožena oprema */}
      <div className="rounded-lg border border-[#e2e8f2] bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#fafbff] border-b border-[#eef0f4]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6b7a8d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-[13px] font-semibold text-[#1d2a3a]">Prevožena oprema (ASBIE1093)</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fff3e0] text-[#e65100] font-medium">Carried equip.</span>
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <FieldPair label="UN br." eftiId="eFTI455" value={undefined} />
            <FieldPair label="Klasifikacija" eftiId="eFTI483" value={undefined} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <FieldPair label="Reg. tijelo" eftiId="eFTI456" value={undefined} />
            <FieldPair label="Količina" eftiId="eFTI501" value={undefined} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldPair label="Cisterna info" eftiId="eFTI461" value={undefined} />
            <FieldPair label="Fumigacija" eftiId="eFTI498" value={undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────── Tab 3: Razina pošiljke ────────── */

function RazinaContent({ data }: { data: EftiConsignment }) {
  const dg = data.dangerousGoods ?? data.includedConsignmentItem?.[0]?.transportDangerousGoods;

  return (
    <div className="px-5 pt-4 pb-4">
      <p className="text-[10px] uppercase tracking-wider text-[#b0616a] font-semibold mb-4 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#c62828]" />
        Razina ukupne pošiljke (ASBIE1127)
      </p>

      {/* Sažetak pošiljke */}
      <div className="rounded-lg border border-[#e2e8f2] bg-white mb-4 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#fafbff] border-b border-[#eef0f4]">
          <svg className="w-4 h-4 text-[#6b7a8d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-[13px] font-semibold text-[#1d2a3a]">Opasna roba — sažetak pošiljke</span>
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <FieldPair label="Informacije" eftiId="eFTI712" value={dg?.information} />
            <FieldPair label="Eksplozivna masa" eftiId="eFTI746" value={dg?.explosiveMass ?? "N/A"} />
          </div>
          <p className="text-[11px] text-[#9aa5b4] border-t border-[#eef0f4] pt-2">
            Radioaktivni mat. (ASBIE1128/1129): Aktivnost eFTI790 | Uvjeti (ASBIE1130): eFTI818-827 | Dok. (ASBIE1131): eFTI833+837
          </p>
        </div>
      </div>

      {/* Regulatorno izuzeće */}
      <div className="rounded-lg border border-[#e2e8f2] bg-white overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#fafbff] border-b border-[#eef0f4]">
          <svg className="w-4 h-4 text-[#6b7a8d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span className="text-[13px] font-semibold text-[#1d2a3a]">Regulatorno izuzeće (ASBIE1750)</span>
        </div>
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <FieldPair label="ID izuzeća" eftiId="eFTI1746" value={undefined} />
            <FieldPair label="Tip" eftiId="eFTI1748" value={undefined} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FieldPair label="Količina" eftiId="eFTI1751" value={undefined} />
            <FieldPair label="Kategorija" eftiId="eFTI1752" value={undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────── Main card ────────── */

const TABS: { id: TabId; label: string; count?: number }[] = [
  { id: "stavka", label: "Stavka pošiljke", count: 1 },
  { id: "oprema", label: "Na opremi", count: 2 },
  { id: "razina", label: "Razina pošiljke" },
];

export default function OpasnaRobaCard({
  data,
  id,
}: {
  data: EftiConsignment;
  id?: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("stavka");

  const dg =
    data.includedConsignmentItem?.[0]?.transportDangerousGoods ??
    data.dangerousGoods;

  if (!dg && !data.dangerousGoods) {
    return (
      <div
        id={id}
        className="bg-white border border-[#dde2ea] rounded-xl overflow-hidden shadow-sm scroll-mt-24 p-5"
      >
        <p className="text-sm text-[#9aa5b4] italic">Nema podataka o opasnoj robi.</p>
      </div>
    );
  }

  return (
    <div
      id={id}
      className="bg-white border-2 border-[#ef9a9a] rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(198,40,40,0.1)] scroll-mt-24"
    >
      {/* Header — red theme */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#ffcdd2] bg-gradient-to-r from-[#fff5f5] to-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#ffebee] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#c62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-[16px] font-bold text-[#c62828] whitespace-nowrap">
            Opasna roba (ADR)
          </h3>
        </div>
        <span className="text-[12px] text-[#b0616a] whitespace-nowrap">
          3 razine podataka
        </span>
      </div>

      {/* Tab navigation — red accents */}
      <div className="flex border-b border-[#ffcdd2] px-5 gap-1 overflow-x-auto bg-white">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-[#c62828] text-[#c62828]"
                  : "border-transparent text-[#6b7a8d] hover:text-[#c62828] hover:border-[#ffcdd2]"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[10px] font-bold ${isActive ? "text-[#c62828]" : "text-[#b0616a]"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "stavka" && <StavkaContent dg={dg} />}
      {activeTab === "oprema" && <OpremaContent data={data} />}
      {activeTab === "razina" && <RazinaContent data={data} />}
    </div>
  );
}
