import type { TradeParty } from "@/types/efti";

function PartyCard({
  label,
  party,
}: {
  label: string;
  party?: TradeParty;
}) {
  if (!party) {
    return (
      <div className="border border-[#e2e8f2] rounded-lg px-4 py-3">
        <span className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold">{label}</span>
        <p className="text-sm text-[#9aa5b4] italic mt-1">Nije dostupno</p>
      </div>
    );
  }

  const taxId = party.taxRegistration?.id;
  const taxScheme = party.taxRegistration?.schemeAgencyId;
  const idLabel = taxScheme === "HR-OIB" ? "OIB" : taxScheme ?? "ID";

  return (
    <div className="border border-[#e2e8f2] rounded-lg px-4 py-3">
      <span className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold">{label}</span>
      <p className="text-[14px] font-bold text-[#1d2a3a] mt-1">{party.name ?? "—"}</p>
      {taxId && (
        <p className="text-[12px] text-[#6b7a8d] mt-0.5">
          {idLabel}: {taxId}
        </p>
      )}
    </div>
  );
}

export default function PartiesGrid({
  consignor,
  consignee,
  carrier,
}: {
  consignor?: TradeParty;
  consignee?: TradeParty;
  carrier?: TradeParty;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <PartyCard label="Pošiljatelj" party={consignor} />
      <PartyCard label="Primatelj" party={consignee} />
      <PartyCard label="Prijevoznik" party={carrier} />
    </div>
  );
}
