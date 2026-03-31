import { useState } from "react";
import type { TradeParty } from "@/types/efti";

const COUNTRY_NAMES: Record<string, string> = {
  HR: "Hrvatska",
  DE: "Njemačka",
  AT: "Austrija",
  SI: "Slovenija",
  HU: "Mađarska",
  IT: "Italija",
  CZ: "Češka",
  SK: "Slovačka",
  PL: "Poljska",
  BA: "Bosna i Hercegovina",
  RS: "Srbija",
  ME: "Crna Gora",
};

function EftiTag({ label }: { label: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#f0f4ff] text-[#7b8fa8] border border-[#e2e8f2]">
      {label}
    </span>
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
        <span className="text-[#9aa5b4]">{icon}</span>
        <span className="text-[12px] font-semibold text-[#5f6f86]">{title}</span>
      </div>
      <div className="ml-6">{children}</div>
    </div>
  );
}

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
        <span className="text-[13px] text-[#c4cdd8] italic">Nije navedeno</span>
      )}
    </div>
  );
}

function formatAddress(party: TradeParty): string | undefined {
  const a = party.postalAddress;
  if (!a) return undefined;

  const parts: string[] = [];
  if (a.streetName) {
    let street = a.streetName;
    if (a.buildingNumber) street += ` ${a.buildingNumber}`;
    parts.push(street);
  }
  if (a.postcode || a.cityName) {
    parts.push([a.postcode, a.cityName].filter(Boolean).join(" "));
  }
  const countryName = a.countryCode
    ? COUNTRY_NAMES[a.countryCode] ?? a.countryCode
    : undefined;
  if (countryName) parts.push(countryName);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function ContactAvatar({ givenName, familyName }: { givenName?: string; familyName?: string }) {
  const initials = [givenName?.[0], familyName?.[0]].filter(Boolean).join("").toUpperCase();
  if (!initials) return null;

  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-[#e8e0f0] flex items-center justify-center flex-shrink-0">
        <span className="text-[13px] font-bold text-[#5b3d8f]">{initials}</span>
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[#1d2a3a]">
          {[givenName, familyName].filter(Boolean).join(" ") || "—"}
        </p>
        <p className="text-[11px] text-[#9aa5b4]">Kontakt osoba (eFTI89)</p>
      </div>
    </div>
  );
}

type TabId = "carrier" | "forwarder" | "connecting";

interface Tab {
  id: TabId;
  label: string;
  badge?: string;
  badgeColor?: string;
  extraBadge?: string;
}

const TABS: Tab[] = [
  { id: "carrier", label: "Prijevoznik", badge: "P", badgeColor: "bg-[#3d8b37] text-white", extraBadge: "glavni" },
  { id: "forwarder", label: "Špediter" },
  { id: "connecting", label: "Povezani prijevoznik", badge: "P", badgeColor: "bg-[#3d8b37] text-white" },
];

function CarrierContent({ party }: { party?: TradeParty }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!party) {
    return <p className="text-sm text-[#9aa5b4] italic px-5 py-4">Podaci o prijevozniku nisu dostupni.</p>;
  }

  const addr = party.postalAddress;
  const contact = party.specifiedContactPerson;
  const tax = party.taxRegistration;
  const contract = party.agreedContract;
  const licence = party.applicableLicence;
  const auth = party.confirmedDocumentAuthentication;
  const idLabel = party.schemeAgencyId === "OIB" ? "OIB" : party.schemeAgencyId ?? "ID";
  const formattedAddr = formatAddress(party);
  const hasAuth = auth && auth.length > 0;
  const hasContactName = !!(contact?.givenName || contact?.familyName);
  const detailGroups = 5;

  return (
    <>
      <div className="px-5 pt-4 pb-4">
        <div className="mb-3">
          <p className="text-[17px] font-bold text-[#1d2a3a]">{party.name ?? "—"}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {party.id ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f0f4ff] border border-[#d6e2ff] text-[12px] font-medium text-[#1f4bb8]">
                {idLabel}: {party.id}
              </span>
            ) : (
              <span className="text-[12px] text-[#c4cdd8] italic">ID nije naveden</span>
            )}
            {party.roleCode && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#e8f5e9] border border-[#c8e6c9] text-[12px] font-medium text-[#2e7d32]">
                {party.roleCode} (eFTI83)
              </span>
            )}
          </div>
        </div>

        <div className="border border-[#e2e8f2] rounded-lg px-4 py-3 mb-3 bg-[#fafbff]">
          {formattedAddr ? (
            <>
              <p className="text-[14px] font-semibold text-[#1d2a3a]">{formattedAddr}</p>
              {addr?.countrySubDivisionName && (
                <p className="text-[13px] text-[#6b7a8d] mt-0.5">{addr.countrySubDivisionName}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {addr?.streetName && <EftiTag label="eFTI188" />}
                {addr?.buildingNumber && <EftiTag label="eFTI196" />}
                {addr?.cityName && <EftiTag label="eFTI194" />}
                {addr?.postcode && <EftiTag label="eFTI191" />}
                {addr?.countryCode && <EftiTag label="eFTI198" />}
                {addr?.countrySubDivisionName && <EftiTag label="eFTI182" />}
                <EftiTag label="eFTI183" />
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[#c4cdd8] italic">Adresa nije navedena</p>
          )}
        </div>

        {hasContactName && (
          <ContactAvatar givenName={contact?.givenName} familyName={contact?.familyName} />
        )}

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#9aa5b4] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div>
              <span className="text-[10px] text-[#9aa5b4] block">Telefon (eFTI91)</span>
              {contact?.telephoneNumber ? (
                <span className="text-[13px] font-semibold text-[#1d2a3a]">{contact.telephoneNumber}</span>
              ) : (
                <span className="text-[13px] text-[#c4cdd8] italic">Nije navedeno</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDetailsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-2.5 border-t border-[#eef0f4] bg-[#f9fbff] hover:bg-[#f0f4ff] transition-colors group"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-[#6b7a8d] group-hover:text-[#002d74] transition-colors">
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${detailsOpen ? "rotate-90" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
          Dodatni podaci
        </span>
        <span className="text-[11px] text-[#c4cdd8] group-hover:text-[#002d74] transition-colors">
          {detailsOpen ? "Sakrij" : `${detailGroups} grupa`}
        </span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${detailsOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 py-4 border-t border-[#eef0f4] bg-[#fafbff] flex flex-col gap-5">
          <DetailGroup
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            title="Porezna registracija"
          >
            <div className="grid grid-cols-2 gap-4">
              <FieldPair label="Porezni ID" eftiId="eFTI864" value={tax?.id} />
              <FieldPair label="Shema" eftiId="eFTI865" value={tax?.schemeAgencyId} />
            </div>
          </DetailGroup>

          <DetailGroup
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            title="Fizička osoba (pojedinac)"
          >
            <div className="grid grid-cols-2 gap-4">
              <FieldPair label="Ime" eftiId="eFTI1160" value={contact?.givenName} />
              <FieldPair label="Prezime" eftiId="eFTI1162" value={contact?.familyName} />
            </div>
          </DetailGroup>

          <DetailGroup
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            title="Ugovoreni ugovor"
          >
            <p className="text-[11px] text-[#9aa5b4] mb-2">ASBIE1281 — Agreed contract</p>
            <div className="grid grid-cols-3 gap-4">
              <FieldPair label="Datum izdavanja" eftiId="eFTI1164" value={contract?.issueDateTime} />
              <FieldPair label="Trajanje" eftiId="eFTI1406" value={contract?.duration} />
              <FieldPair label="Mjesto potpisa" eftiId="eFTI1166" value={contract?.signingLocation} />
            </div>
          </DetailGroup>

          <DetailGroup
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            title="Licencija"
          >
            <p className="text-[11px] text-[#9aa5b4] mb-2">ASBIE1283 — Applicable licence</p>
            <div className="grid grid-cols-3 gap-4">
              <FieldPair label="ID licencije" eftiId="eFTI1169" value={licence?.id} />
              <FieldPair label="Shema" eftiId="eFTI1170" value={licence?.schemeAgencyId} />
              <FieldPair label="Tip" eftiId="eFTI1171" value={licence?.typeCode} />
            </div>
          </DetailGroup>

          <DetailGroup
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
            title="Potvrda autentičnosti"
          >
            <div className="flex items-center gap-2">
              {hasAuth ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4caf50]" />
                  <span className="text-[13px] font-medium text-[#2e7d32]">Potvrđeno (eFTI115)</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                  <span className="text-[13px] text-[#9aa5b4] italic">Nije potvrđeno</span>
                </>
              )}
            </div>
          </DetailGroup>
        </div>
      </div>
    </>
  );
}

function ForwarderContent({ party }: { party?: TradeParty }) {
  if (!party) {
    return <p className="text-sm text-[#9aa5b4] italic px-5 py-4">Podaci o špediteru nisu dostupni.</p>;
  }

  const addr = party.postalAddress;
  const formattedAddr = formatAddress(party);

  return (
    <div className="px-5 pt-4 pb-4">
      <div className="mb-3">
        <p className="text-[17px] font-bold text-[#1d2a3a]">{party.name ?? "—"}</p>
      </div>

      <div className="border border-[#e2e8f2] rounded-lg px-4 py-3 mb-3 bg-[#fafbff]">
        {formattedAddr ? (
          <>
            <p className="text-[14px] font-semibold text-[#1d2a3a]">{formattedAddr}</p>
            {addr?.countrySubDivisionName && (
              <p className="text-[13px] text-[#6b7a8d] mt-0.5">{addr.countrySubDivisionName}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {addr?.streetName && <EftiTag label="eFTI1315" />}
              {addr?.buildingNumber && <EftiTag label="eFTI1324" />}
              {addr?.cityName && <EftiTag label="eFTI1320" />}
              {addr?.postcode && <EftiTag label="eFTI1316" />}
              {addr?.countryCode && <EftiTag label="eFTI1312" />}
              <EftiTag label="eFTI1317" />
              <EftiTag label="eFTI1319" />
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#c4cdd8] italic">Adresa nije navedena</p>
        )}
      </div>

      <div className="rounded-lg border border-[#e2e8f2] bg-[#fefdf6] px-4 py-3 mt-4">
        <p className="text-[12px] text-[#8a7a5a] leading-relaxed">
          Špediter (Freight forwarder) ima manju strukturu — samo naziv (eFTI1310), adresa i odjel (eFTI1322).
          Nema ID, kontakt, poreznu registraciju, licenciju ni ugovor.
        </p>
      </div>
    </div>
  );
}

function ConnectingCarrierContent({ party }: { party?: TradeParty }) {
  const [licenceOpen, setLicenceOpen] = useState(false);

  if (!party) {
    return <p className="text-sm text-[#9aa5b4] italic px-5 py-4">Podaci o povezanom prijevozniku nisu dostupni.</p>;
  }

  const addr = party.postalAddress;
  const licence = party.applicableLicence;
  const formattedAddr = formatAddress(party);
  const idLabel = party.schemeAgencyId ?? "ID";

  return (
    <>
      <div className="px-5 pt-4 pb-4">
        <div className="mb-3">
          <p className="text-[17px] font-bold text-[#1d2a3a]">{party.name ?? "—"}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {party.id ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#fdf0e6] border border-[#f5dcc4] text-[12px] font-medium text-[#a16b2e]">
                {idLabel} {party.id}
              </span>
            ) : (
              <span className="text-[12px] text-[#c4cdd8] italic">ID nije naveden</span>
            )}
          </div>
        </div>

        <div className="border border-[#e2e8f2] rounded-lg px-4 py-3 mb-3 bg-[#fafbff]">
          {formattedAddr ? (
            <>
              <p className="text-[14px] font-semibold text-[#1d2a3a]">{formattedAddr}</p>
              {addr?.countrySubDivisionName && (
                <p className="text-[13px] text-[#6b7a8d] mt-0.5">{addr.countrySubDivisionName}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {addr?.streetName && <EftiTag label="eFTI125" />}
                {addr?.buildingNumber && <EftiTag label="eFTI132" />}
                {addr?.cityName && <EftiTag label="eFTI129" />}
                {addr?.postcode && <EftiTag label="eFTI126" />}
                {addr?.countryCode && <EftiTag label="eFTI123" />}
                {addr?.countrySubDivisionName && <EftiTag label="eFTI127" />}
                <EftiTag label="eFTI128" />
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[#c4cdd8] italic">Adresa nije navedena</p>
          )}
        </div>
      </div>

      {licence && (
        <>
          <button
            type="button"
            onClick={() => setLicenceOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-2.5 border-t border-[#eef0f4] bg-[#f9fbff] hover:bg-[#f0f4ff] transition-colors group"
          >
            <span className="flex items-center gap-2 text-[12px] font-semibold text-[#6b7a8d] group-hover:text-[#002d74] transition-colors">
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${licenceOpen ? "rotate-90" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
              Licencija
            </span>
            <span className="text-[11px] text-[#c4cdd8] group-hover:text-[#002d74] transition-colors">
              {licenceOpen ? "Sakrij" : "1 grupa"}
            </span>
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${licenceOpen ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="px-5 py-4 border-t border-[#eef0f4] bg-[#fafbff] flex flex-col gap-4">
              <DetailGroup
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                title="ASBIE1284 — Applicable licence"
              >
                <div className="grid grid-cols-3 gap-4">
                  <FieldPair label="ID licencije" eftiId="eFTI1173" value={licence.id} />
                  <FieldPair label="Shema" eftiId="eFTI1174" value={licence.schemeAgencyId} />
                  <FieldPair label="Tip" eftiId="eFTI1175" value={licence.typeCode} />
                </div>
              </DetailGroup>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function PrijevozniciCard({
  carrier,
  freightForwarder,
  connectingCarrier,
  id,
}: {
  carrier?: TradeParty;
  freightForwarder?: TradeParty;
  connectingCarrier?: TradeParty;
  id?: string;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("carrier");

  const parties = [carrier, freightForwarder, connectingCarrier].filter(Boolean);
  const subjectCount = parties.length;

  return (
    <div
      id={id}
      className="bg-white border border-[#dde2ea] rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,45,116,0.07)] scroll-mt-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#eef0f4]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#eef3ff] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#002d74]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-[16px] font-bold text-[#1d2a3a] whitespace-nowrap">Prijevoznici</h3>
        </div>
        <span className="text-[12px] text-[#9aa5b4] whitespace-nowrap">
          {subjectCount} {subjectCount === 1 ? "subjekt" : subjectCount < 5 ? "subjekta" : "subjekata"}
        </span>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-[#eef0f4] px-5 gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-[#002d74] text-[#002d74]"
                  : "border-transparent text-[#6b7a8d] hover:text-[#1d2a3a] hover:border-[#d5ddeb]"
              }`}
            >
              {tab.badge && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
              {tab.label}
              {tab.extraBadge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#f5f0e0] text-[#8a7a3e] border border-[#e8deb8]">
                  {tab.extraBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "carrier" && <CarrierContent party={carrier} />}
      {activeTab === "forwarder" && <ForwarderContent party={freightForwarder} />}
      {activeTab === "connecting" && <ConnectingCarrierContent party={connectingCarrier} />}
    </div>
  );
}
