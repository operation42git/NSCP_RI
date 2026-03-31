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

export default function PosiljateljCard({
  party,
  id,
}: {
  party?: TradeParty;
  id?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!party) {
    return (
      <div
        id={id}
        className="bg-white border border-[#dde2ea] rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,45,116,0.07)] scroll-mt-24 p-5"
      >
        <p className="text-sm text-[#9aa5b4] italic">Podaci o pošiljatelju nisu dostupni.</p>
      </div>
    );
  }

  const addr = party.postalAddress;
  const contact = party.specifiedContactPerson;
  const tax = party.taxRegistration;
  const fin = party.financialAccount;
  const auth = party.confirmedDocumentAuthentication;
  const idLabel =
    party.schemeAgencyId === "HR-OIB" ? "OIB" : party.schemeAgencyId ?? "ID";

  const formattedAddr = formatAddress(party);
  const isAuthenticated = auth?.some((a) => a.statementCode === "CONFIRMED");

  const detailGroups = 5;

  return (
    <div
      id={id}
      className="bg-white border border-[#dde2ea] rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,45,116,0.07)] scroll-mt-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#eef0f4]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#eef3ff] flex items-center justify-center flex-shrink-0">
            <svg
              className="w-4 h-4 text-[#002d74]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 className="text-[16px] font-bold text-[#1d2a3a] whitespace-nowrap">
            Pošiljatelj
          </h3>
        </div>
      </div>

      {/* Key data */}
      <div className="px-5 pt-4 pb-4">
        <div className="mb-3">
          <p className="text-[17px] font-bold text-[#1d2a3a]">{party.name ?? "—"}</p>
          <div className="flex items-center gap-2 mt-1.5">
            {party.id ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f0f4ff] border border-[#d6e2ff] text-[12px] font-medium text-[#1f4bb8]">
                {idLabel}: {party.id}
                {party.schemeAgencyId && (
                  <span className="text-[10px] text-[#7b8fa8]">
                    ({party.schemeAgencyId})
                  </span>
                )}
              </span>
            ) : (
              <span className="text-[12px] text-[#c4cdd8] italic">ID nije naveden</span>
            )}
          </div>
        </div>

        <div className="border border-[#e2e8f2] rounded-lg px-4 py-3 mb-3 bg-[#fafbff]">
          {formattedAddr ? (
            <>
              <p className="text-[14px] font-semibold text-[#1d2a3a]">
                {formattedAddr}
              </p>
              {addr?.countrySubDivisionName && (
                <p className="text-[13px] text-[#6b7a8d] mt-0.5">
                  {addr.countrySubDivisionName}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {addr?.streetName && <EftiTag label="eFTI56 ulica" />}
                {addr?.buildingNumber && <EftiTag label="eFTI62 k.br." />}
                {addr?.buildingName && <EftiTag label="eFTI60 zgrada" />}
                {addr?.cityName && <EftiTag label="eFTI57 grad" />}
                {addr?.postcode && <EftiTag label="eFTI54 poštanski br." />}
                {addr?.countryCode && <EftiTag label="eFTI58 država" />}
                {addr?.countrySubDivisionName && <EftiTag label="eFTI59 regija" />}
              </div>
            </>
          ) : (
            <p className="text-[13px] text-[#c4cdd8] italic">Adresa nije navedena</p>
          )}
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[#9aa5b4] flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <div>
              <span className="text-[10px] text-[#9aa5b4] block">
                Telefon (eFTI52)
              </span>
              {contact?.telephoneNumber ? (
                <span className="text-[13px] font-semibold text-[#1d2a3a]">
                  {contact.telephoneNumber}
                </span>
              ) : (
                <span className="text-[13px] text-[#c4cdd8] italic">Nije navedeno</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[#9aa5b4] flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <div>
              <span className="text-[10px] text-[#9aa5b4] block">
                Email (eFTI53)
              </span>
              {contact?.emailAddress ? (
                <a
                  href={`mailto:${contact.emailAddress}`}
                  className="text-[13px] font-semibold text-[#1f4bb8] hover:underline"
                >
                  {contact.emailAddress}
                </a>
              ) : (
                <span className="text-[13px] text-[#c4cdd8] italic">Nije navedeno</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expand toggle for additional data */}
      <button
        type="button"
        onClick={() => setDetailsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-2.5 border-t border-[#eef0f4] bg-[#f9fbff] hover:bg-[#f0f4ff] transition-colors group"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-[#6b7a8d] group-hover:text-[#002d74] transition-colors">
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${detailsOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
          Dodatni podaci
        </span>
        <span className="text-[11px] text-[#c4cdd8] group-hover:text-[#002d74] transition-colors">
          {detailsOpen ? "Sakrij" : `${detailGroups} grupe`}
        </span>
      </button>

      {/* Expandable details */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          detailsOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-5 py-4 border-t border-[#eef0f4] bg-[#fafbff] flex flex-col gap-5">
          {/* Poštanski pretinac */}
          <DetailGroup
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            title="Poštanski pretinac"
          >
            <div className="grid grid-cols-2 gap-4">
              <FieldPair label="P.P." eftiId="eFTI55" value={addr?.postOfficeBox} />
              <FieldPair label="Odjel" eftiId="eFTI61" value={party.departmentName} />
            </div>
          </DetailGroup>

          {/* Porezna registracija */}
          <DetailGroup
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Porezna registracija"
          >
            <div className="grid grid-cols-2 gap-4">
              <FieldPair label="Porezni ID" eftiId="eFTI859" value={tax?.id} />
              <FieldPair label="Shema" eftiId="eFTI860" value={tax?.schemeAgencyId} />
            </div>
          </DetailGroup>

          {/* Fizička osoba (pojedinac) */}
          <DetailGroup
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
            title="Fizička osoba (pojedinac)"
          >
            <div className="grid grid-cols-2 gap-4">
              <FieldPair label="Ime" eftiId="eFTI1152" value={contact?.givenName} />
              <FieldPair label="Prezime" eftiId="eFTI1154" value={contact?.familyName} />
            </div>
          </DetailGroup>

          {/* Financijski račun */}
          <DetailGroup
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
            title="Financijski račun"
          >
            <div className="grid grid-cols-2 gap-4">
              <FieldPair label="IBAN / ID" eftiId="eFTI1404" value={fin?.id} />
              <FieldPair label="Shema" eftiId="eFTI1405" value={fin?.schemeAgencyId} />
            </div>
          </DetailGroup>

          {/* Potvrda autentičnosti */}
          <DetailGroup
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            title="Potvrda autentičnosti"
          >
            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4caf50]" />
                  <span className="text-[13px] font-medium text-[#2e7d32]">
                    Potvrđeno (eFTI65)
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#e0e0e0]" />
                  <span className="text-[13px] text-[#9aa5b4] italic">
                    Nije potvrđeno
                  </span>
                </>
              )}
            </div>
          </DetailGroup>
        </div>
      </div>
    </div>
  );
}
