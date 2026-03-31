import { useState } from "react";
import type { EftiConsignment, LogisticsLocation } from "@/types/efti";

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
};

function EftiTag({ label }: { label: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#f0f4ff] text-[#7b8fa8] border border-[#e2e8f2]">
      {label}
    </span>
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

function formatLocationAddress(loc: LogisticsLocation): string | undefined {
  const a = loc.postalAddress;
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

function LocationCard({
  loc,
  label,
  badge,
  badgeColor,
  borderColor,
  eftiTags,
}: {
  loc?: LogisticsLocation;
  label: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  eftiTags: string[];
}) {
  if (!loc) {
    return (
      <div className={`flex-1 rounded-lg border-2 ${borderColor} p-4 bg-white`}>
        <p className="text-sm text-[#c4cdd8] italic">Lokacija nije dostupna</p>
      </div>
    );
  }

  const addr = loc.postalAddress;
  const geo = loc.geographicalCoordinates;
  const formattedAddr = formatLocationAddress(loc);

  return (
    <div className={`flex-1 rounded-lg border-2 ${borderColor} p-4 bg-white min-w-0`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${badgeColor}`}>
          {badge}
        </span>
        <span className="text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider">{label}</span>
      </div>

      <p className="text-[15px] font-bold text-[#1d2a3a] mb-1">{loc.name ?? "—"}</p>

      {formattedAddr && (
        <p className="text-[13px] text-[#374151] mb-0.5">{formattedAddr}</p>
      )}
      {addr?.countrySubDivisionName && (
        <p className="text-[12px] text-[#6b7a8d]">{addr.countrySubDivisionName}</p>
      )}

      {geo && (geo.latitude || geo.longitude) && (
        <div className="flex items-center gap-1.5 mt-2">
          <svg className="w-3.5 h-3.5 text-[#9aa5b4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-[12px] text-[#6b7a8d] font-mono">
            {geo.latitude && `${geo.latitude}° N`}
            {geo.latitude && geo.longitude && ", "}
            {geo.longitude && `${geo.longitude}° E`}
          </span>
        </div>
      )}

      {eftiTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {eftiTags.map((t) => (
            <EftiTag key={t} label={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineDot({
  color,
  dashed,
}: {
  color: string;
  dashed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 relative">
      <div className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${color} ${dashed ? "border-dashed" : ""}`} />
    </div>
  );
}

function TimelineRow({
  label,
  eftiId,
  value,
  color,
  dashed,
  highlight,
  subtext,
}: {
  label: string;
  eftiId: string;
  value?: string;
  color: string;
  dashed?: boolean;
  highlight?: boolean;
  subtext?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center pt-1">
        <TimelineDot color={color} dashed={dashed} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold">
          {label} <span className="normal-case tracking-normal text-[9px] text-[#b4bfcc] font-normal">{eftiId}</span>
        </span>
        {value ? (
          <span className={`text-[13px] font-semibold ${highlight ? "text-[#2e7d32]" : "text-[#1d2a3a]"}`}>
            {value}
          </span>
        ) : (
          <span className="text-[13px] text-[#c4cdd8] italic">Nije navedeno</span>
        )}
        {subtext && (
          <span className="text-[11px] text-[#4caf50] italic">{subtext}</span>
        )}
      </div>
    </div>
  );
}

const clockIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const calendarIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const eyeIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const mapPinIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const infoIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function LokacijeIRutaCard({
  data,
  id,
}: {
  data: EftiConsignment;
  id?: string;
}) {
  const [eventsOpen, setEventsOpen] = useState(false);
  const [borderOpen, setBorderOpen] = useState(false);

  const pickup = data.carrierAcceptanceLocation;
  const delivery = data.consigneeReceiptLocation;
  const transshipment = data.transshipmentLocation;
  const timeline = data.deliveryTimeline;
  const period = data.plannedPeriod;
  const observations = data.observations;
  const crossings = data.borderCrossings;
  const customs = data.consignorProvidedBorderClearanceInstructions;

  const pickupCity = pickup?.postalAddress?.cityName ?? "";
  const deliveryCity = delivery?.postalAddress?.cityName ?? "";
  const routeSummary =
    pickupCity && deliveryCity ? `${pickupCity} → ${deliveryCity}` : undefined;

  const eventGroups = 3;

  return (
    <div
      id={id}
      className="bg-white border border-[#dde2ea] rounded-xl overflow-hidden shadow-[0_2px_12px_rgba(0,45,116,0.07)] scroll-mt-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[#eef0f4]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#fef0e6] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#c75c1e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-[16px] font-bold text-[#1d2a3a] whitespace-nowrap">Lokacije i ruta</h3>
        </div>
        {routeSummary && (
          <span className="text-[13px] text-[#6b7a8d] whitespace-nowrap font-medium">
            {routeSummary}
          </span>
        )}
      </div>

      {/* Location cards — side by side */}
      <div className="px-5 pt-4 pb-4">
        <div className="flex gap-4 items-stretch">
          <LocationCard
            loc={pickup}
            label="Preuzimanje"
            badge="A"
            badgeColor="bg-[#d97706]"
            borderColor="border-[#fbbf24]/40"
            eftiTags={["eFTI44", "eFTI1431", "eFTI1414", "eFTI142", "eFTI1415"]}
          />

          {/* Route line */}
          <div className="flex flex-col items-center justify-center gap-1 px-1 flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
            <div className="w-0.5 flex-1 bg-[#d5ddeb] min-h-[40px]" style={{ backgroundImage: "repeating-linear-gradient(to bottom, #d5ddeb 0px, #d5ddeb 4px, transparent 4px, transparent 8px)" }} />
            {transshipment && <div className="w-2 h-2 rounded-full border-2 border-dashed border-[#9aa5b4]" />}
            {transshipment && <div className="w-0.5 flex-1 bg-[#d5ddeb] min-h-[20px]" style={{ backgroundImage: "repeating-linear-gradient(to bottom, #d5ddeb 0px, #d5ddeb 4px, transparent 4px, transparent 8px)" }} />}
            <div className="w-2.5 h-2.5 rounded-full bg-[#1f4bb8]" />
          </div>

          <LocationCard
            loc={delivery}
            label="Isporuka"
            badge="B"
            badgeColor="bg-[#1f4bb8]"
            borderColor="border-[#93b5ff]/40"
            eftiTags={["eFTI148", "eFTI1431", "eFTI1454", "eFTI149", "eFTI1455"]}
          />
        </div>

        {/* Transshipment location */}
        {transshipment && (
          <div className="mt-4 rounded-lg border-2 border-dashed border-[#d5ddeb] px-4 py-3 bg-[#fbfcff]">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#9aa5b4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-[12px] font-semibold text-[#6b7a8d]">Pretovarno mjesto</span>
              <span className="text-[13px] font-bold text-[#1d2a3a] ml-1">{transshipment.name ?? "—"}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <EftiTag label="eFTI1300" />
              <EftiTag label="eFTI1305" />
              <EftiTag label="eFTI1191" />
            </div>
          </div>
        )}
      </div>

      {/* DOGAĐAJI ISPORUKE I DETALJI — expandable */}
      <button
        type="button"
        onClick={() => setEventsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-2.5 border-t border-[#eef0f4] bg-[#f9fbff] hover:bg-[#f0f4ff] transition-colors group"
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold text-[#6b7a8d] group-hover:text-[#002d74] transition-colors">
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${eventsOpen ? "rotate-90" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
          Događaji isporuke i detalji
        </span>
        <span className="text-[11px] text-[#c4cdd8] group-hover:text-[#002d74] transition-colors">
          {eventsOpen ? "Sakrij" : `${eventGroups} grupe`}
        </span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${eventsOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 py-4 border-t border-[#eef0f4] bg-[#fafbff] flex flex-col gap-5">
          {/* Vremenski tijek isporuke */}
          <DetailGroup icon={clockIcon} title="Vremenski tijek isporuke (ASBIE1058)">
            <div className="flex flex-col gap-3 border-l-2 border-[#e2e8f2] pl-4 ml-1">
              <TimelineRow
                label="Zahtijevani datum"
                eftiId="eFTI1200"
                value={timeline?.requestedDateTime}
                color="border-[#9aa5b4] bg-white"
                dashed
              />
              <TimelineRow
                label="Planirani datum"
                eftiId="eFTI1196"
                value={timeline?.plannedDateTime}
                color="border-[#1f4bb8] bg-white"
                dashed
              />
              <TimelineRow
                label="Stvarni datum"
                eftiId="eFTI1198"
                value={timeline?.actualDateTime}
                color="border-[#4caf50] bg-[#4caf50]"
                highlight
                subtext={timeline?.actualDateTime && timeline?.plannedDateTime ? "15 min ranije od planiranog" : undefined}
              />
            </div>
            {timeline?.deliveryLocation && (
              <div className="mt-3 rounded-lg border border-[#e2e8f2] bg-white px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold mb-1">
                  Lokacija isporuke (ASBIE1059)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <FieldPair label="ID lokacije" eftiId="eFTI1292" value={timeline.deliveryLocation.id} />
                  <FieldPair label="Naziv" eftiId="eFTI1294" value={timeline.deliveryLocation.name} />
                </div>
              </div>
            )}
          </DetailGroup>

          {/* Planirano razdoblje */}
          <DetailGroup icon={calendarIcon} title="Planirano razdoblje (ASBIE1291)">
            <div className="grid grid-cols-4 gap-4">
              <FieldPair label="Početak/datum" eftiId="eFTI1207" value={period?.startDateTime} />
              <FieldPair label="Kraj" eftiId="eFTI1208" value={period?.endDateTime} />
              <FieldPair label="Trajanje" eftiId="eFTI1209" value={period?.duration} />
              <FieldPair label="Maks. trajanje" eftiId="eFTI1285" value={period?.maxDuration} />
            </div>
          </DetailGroup>

          {/* Opažanja */}
          <DetailGroup icon={eyeIcon} title="Opažanja (ASBIE1288)">
            {observations && observations.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {observations.map((obs, i) => (
                  <div key={i}>
                    <FieldPair label="Tekst" eftiId="eFTI1285" value={obs.text} />
                    <FieldPair label="Kod predmeta" eftiId="eFTI1286" value={obs.subjectCode} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#c4cdd8] italic">Nema opažanja</p>
            )}
          </DetailGroup>
        </div>
      </div>

      {/* Granični prijelaz — expandable */}
      {(crossings && crossings.length > 0) && (
        <>
          <button
            type="button"
            onClick={() => setBorderOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-2.5 border-t border-[#eef0f4] bg-[#f9fbff] hover:bg-[#f0f4ff] transition-colors group"
          >
            <span className="flex items-center gap-2 text-[12px] font-semibold text-[#6b7a8d] group-hover:text-[#002d74] transition-colors">
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-200 ${borderOpen ? "rotate-90" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
              Granični prijelaz (ASBIE1301)
            </span>
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${borderOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="px-5 py-4 border-t border-[#eef0f4] bg-[#fafbff] flex flex-col gap-4">
              <DetailGroup icon={mapPinIcon} title="Prijelazak granice">
                {crossings.map((bc, i) => (
                  <div key={i} className="grid grid-cols-2 gap-4">
                    <FieldPair label="Lokacija" eftiId="eFTI1301" value={bc.locationName} />
                    <FieldPair label="Datum" eftiId="eFTI1304" value={bc.dateTime} />
                  </div>
                ))}
              </DetailGroup>

              {customs && customs.description && customs.description.length > 0 && (
                <DetailGroup icon={infoIcon} title="Upute za carinjenje (ASBIE1304)">
                  <div className="rounded-lg border border-[#d4a843] bg-[#fefbf0] px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8a7a3e] mb-1.5">
                      Upute pouzdavatelja za granično carinjenje <span className="normal-case tracking-normal text-[9px] font-normal">eFTI1306</span>
                    </p>
                    {customs.description.map((d, i) => (
                      <p key={i} className="text-[13px] text-[#5a4e1f] leading-relaxed">{d}</p>
                    ))}
                  </div>
                </DetailGroup>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
