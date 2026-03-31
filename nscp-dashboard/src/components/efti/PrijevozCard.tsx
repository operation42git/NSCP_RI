import { useState } from "react";
import type {
  EftiConsignment,
  LogisticsTransportMovement,
  TransportEvent,
  TransportMeans,
  MasterPerson,
} from "@/types/efti";

const MODE_LABELS: Record<string, string> = {
  "0": "Multimodalni",
  "1": "Pomorski",
  "2": "Željeznički",
  "3": "Cestovni",
  "4": "Zračni",
  "5": "Poštanski",
  "6": "Multimodalni",
  "7": "Fiksna instalacija",
  "8": "Unutarnji plovni put",
  "9": "Nepoznato",
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

function VehiclePlate({ means }: { means?: TransportMeans }) {
  if (!means?.id) return null;
  const country = means.registrationCountryCode ?? "";
  return (
    <div className="rounded-lg border-2 border-[#1d2a3a] bg-white px-5 py-3 inline-flex items-center gap-3">
      {country && (
        <div className="bg-[#002d74] text-white px-2 py-1.5 rounded-sm text-[11px] font-bold flex flex-col items-center leading-none">
          <span className="text-[8px] mb-0.5">●●●</span>
          <span>{country}</span>
        </div>
      )}
      <span className="text-[22px] font-mono font-bold text-[#1d2a3a] tracking-wider">
        {means.id}
      </span>
    </div>
  );
}

function DriverCard({ person }: { person?: MasterPerson }) {
  if (!person?.name) return null;
  const initials = person.name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 mt-3">
      <div className="w-9 h-9 rounded-full bg-[#e0eaff] flex items-center justify-center flex-shrink-0">
        <span className="text-[12px] font-bold text-[#1f4bb8]">{initials}</span>
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[#1d2a3a]">{person.name}</p>
        <p className="text-[11px] text-[#9aa5b4]">
          {person.roleCode ?? "Vozač"}{person.id ? ` · ${person.id}` : ""}
        </p>
      </div>
    </div>
  );
}

function TimelineDot({ color, filled }: { color: string; filled?: boolean }) {
  return (
    <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${color} ${filled ? "" : "bg-white"}`} />
  );
}

function EventCard({
  event,
  label,
  badge,
  badgeColor,
  borderColor,
}: {
  event?: TransportEvent;
  label: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
}) {
  return (
    <div className={`flex-1 rounded-lg border-2 ${borderColor} p-4 bg-white min-w-0`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white ${badgeColor}`}>
          {badge}
        </span>
        <span className="text-[11px] font-semibold text-[#6b7a8d] uppercase tracking-wider">{label}</span>
      </div>

      {event?.occurrenceLocation?.name && (
        <p className="text-[14px] font-bold text-[#1d2a3a] mb-2">{event.occurrenceLocation.name}</p>
      )}

      <div className="flex flex-col gap-1.5 border-l-2 border-[#e2e8f2] pl-3 mb-3">
        <div className="flex items-center gap-2">
          <TimelineDot color="border-[#9aa5b4]" />
          <span className="text-[10px] text-[#9aa5b4] w-20">Zahtijevano</span>
          <span className="text-[12px] text-[#374151] font-medium">
            {event?.requestedOccurrenceDateTime ?? <span className="text-[#c4cdd8] italic">—</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TimelineDot color="border-[#1f4bb8]" />
          <span className="text-[10px] text-[#9aa5b4] w-20">Planirani</span>
          <span className="text-[12px] text-[#374151] font-medium">
            {event?.plannedOccurrenceDateTime ?? <span className="text-[#c4cdd8] italic">—</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TimelineDot color="border-[#4caf50] bg-[#4caf50]" filled />
          <span className="text-[10px] text-[#9aa5b4] w-20">Stvarni</span>
          <span className="text-[12px] text-[#2e7d32] font-semibold">
            {event?.actualOccurrenceDateTime ?? <span className="text-[#c4cdd8] italic font-normal">—</span>}
          </span>
        </div>
      </div>

      {event?.certifyingParty && (
        <div className="border-t border-[#eef0f4] pt-2.5 mt-1">
          <p className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold mb-1.5">
            Certificator (ASBIE1183)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[9px] text-[#b4bfcc] block">Naziv</span>
              <span className="text-[12px] text-[#1d2a3a] font-medium">
                {event.certifyingParty.name ?? "—"}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-[#b4bfcc] block">ID</span>
              <span className="text-[12px] text-[#1d2a3a] font-medium">
                {event.certifyingParty.id ?? <span className="text-[#c4cdd8] italic">—</span>}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-[#b4bfcc] block">Uloga</span>
              <span className="text-[12px] text-[#1d2a3a] font-medium">
                {event.certifyingParty.roleCode ?? <span className="text-[#c4cdd8] italic">—</span>}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SecondaryMovementCard({
  movement,
  title,
  colorDot,
}: {
  movement?: LogisticsTransportMovement;
  title: string;
  colorDot: string;
}) {
  if (!movement) return null;
  const mode = movement.modeCode ? MODE_LABELS[movement.modeCode] ?? movement.modeCode : undefined;
  return (
    <div className="rounded-lg border border-[#e2e8f2] bg-white px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${colorDot}`} />
        <span className="text-[12px] font-semibold text-[#5f6f86]">{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FieldPair label="Način/oblik" value={mode} />
        {movement.loadingEvent?.occurrenceLocation?.name && (
          <FieldPair label="Lok. utovara" value={movement.loadingEvent.occurrenceLocation.name} />
        )}
        {movement.unloadingEvent?.occurrenceLocation?.name && (
          <FieldPair label="Lok. istovara" value={movement.unloadingEvent.occurrenceLocation.name} />
        )}
      </div>
    </div>
  );
}

const truckIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
  </svg>
);

const docIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const rulerIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

const gearIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const arrowsIcon = (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

export default function PrijevozCard({
  data,
  id,
}: {
  data: EftiConsignment;
  id?: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const main = data.mainCarriageTransportMovement;
  const pre = data.preCarriageTransportMovement;
  const on = data.onCarriageTransportMovement;
  const means = main?.usedTransportMeans;
  const driver = main?.masterResponsiblePerson;
  const loading = main?.loadingEvent;
  const unloading = main?.unloadingEvent;

  const modeLabel = main?.modeCode
    ? MODE_LABELS[main.modeCode] ?? main.modeCode
    : undefined;

  const hasSecondary = !!(pre || on);
  const detailGroups = 3 + (hasSecondary ? 1 : 0);

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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          <h3 className="text-[16px] font-bold text-[#1d2a3a] whitespace-nowrap">
            Prijevoz — sredstva i kretanje
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {modeLabel && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#e8f5e9] border border-[#c8e6c9] text-[11px] font-semibold text-[#2e7d32]">
              {modeLabel} (eFTI88)
            </span>
          )}
          <span className="text-[11px] text-[#9aa5b4]">Segment #1</span>
        </div>
      </div>

      {/* PRIJEVOZNO SREDSTVO */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold mb-2">
          Prijevozno sredstvo
        </p>

        {means?.id ? (
          <>
            <VehiclePlate means={means} />
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-[#6b7a8d]">
              {means.schemeAgencyId && (
                <span>
                  Shema <span className="text-[#9aa5b4]">eFTI89</span>: <span className="font-medium text-[#1d2a3a]">{means.schemeAgencyId}</span>
                </span>
              )}
              {means.registrationCountryCode && (
                <span>
                  Reg.država <span className="text-[#9aa5b4]">eFTI90</span>: <span className="font-medium text-[#1d2a3a]">{means.registrationCountryCode}</span>
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="text-[13px] text-[#c4cdd8] italic">Podaci o prijevoznom sredstvu nisu dostupni.</p>
        )}

        <DriverCard person={driver} />
      </div>

      {/* Loading / Unloading side-by-side */}
      <div className="px-5 pt-3 pb-4">
        <div className="flex gap-4 items-stretch">
          <EventCard
            event={loading}
            label="Utovar"
            badge="U"
            badgeColor="bg-[#d97706]"
            borderColor="border-[#fbbf24]/40"
          />
          <EventCard
            event={unloading}
            label="Istovar"
            badge="I"
            badgeColor="bg-[#1f4bb8]"
            borderColor="border-[#93b5ff]/40"
          />
        </div>
      </div>

      {/* DODATNI PODACI — expandable */}
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
          {detailsOpen ? "Sakrij" : `${detailGroups} grupe`}
        </span>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${detailsOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-5 py-4 border-t border-[#eef0f4] bg-[#fafbff] flex flex-col gap-5">
          {/* Detalji prijevoznog sredstva */}
          <DetailGroup icon={truckIcon} title="Detalji prijevoznog sredstva">
            <div className="grid grid-cols-3 gap-4">
              <FieldPair label="Tip" eftiId="eFTI97" value={means?.equipmentDescriptionText ?? means?.typeCode} />
              <FieldPair label="Naziv" eftiId="eFTI95" value={undefined} />
              <FieldPair label="Vlasnik" eftiId="eFTI93" value={means?.ownerName} />
            </div>
          </DetailGroup>

          {/* Dimenzije */}
          <DetailGroup icon={rulerIcon} title="Dimenzije (ASBIE1291)">
            <div className="grid grid-cols-3 gap-4">
              <FieldPair label="Jedinična" eftiId="eFTI1073" value={undefined} />
              <FieldPair label="Dodjeljivna" eftiId="eFTI1074" value={undefined} />
              <FieldPair label="Visina" value={undefined} />
            </div>
          </DetailGroup>

          {/* Operativna oprema */}
          <DetailGroup icon={gearIcon} title="Operativna oprema (ASBIE1444)">
            <div className="grid grid-cols-3 gap-4">
              <FieldPair label="ID" eftiId="eFTI1086" value={undefined} />
              <FieldPair label="Kategorija" eftiId="eFTI1089" value={undefined} />
              <FieldPair label="Količina" eftiId="eFTI1091" value={undefined} />
            </div>
          </DetailGroup>

          {/* Sporedna kretanja */}
          {hasSecondary && (
            <DetailGroup icon={arrowsIcon} title="Sporedna kretanja">
              <div className="flex flex-col gap-3">
                <SecondaryMovementCard
                  movement={pre}
                  title="Pred-prijevoz (ASBIE1114)"
                  colorDot="bg-[#d97706]"
                />
                <SecondaryMovementCard
                  movement={on}
                  title="Nastavak prijevoza (ASBIE1117)"
                  colorDot="bg-[#1f4bb8]"
                />
              </div>
            </DetailGroup>
          )}
        </div>
      </div>
    </div>
  );
}
