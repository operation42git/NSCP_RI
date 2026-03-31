import type { EftiConsignment, LogisticsLocation } from "@/types/efti";

const MODE_LABELS: Record<string, string> = {
  "0": "neodređeno",
  "1": "pomorski",
  "2": "željeznički",
  "3": "cestovni",
  "4": "zračni",
  "5": "poštanski",
  "6": "multimodalni",
  "7": "fiksna instalacija",
  "8": "unutarnji vodeni put",
  "9": "nepoznato",
};

function LocationBlock({
  location,
  badge,
  badgeColor,
}: {
  location?: LogisticsLocation;
  badge: string;
  badgeColor: string;
}) {
  if (!location) return <div className="text-sm text-[#9aa5b4] italic">Nije dostupno</div>;

  const addr = location.postalAddress;
  const geo = location.geographicalCoordinates;
  const city = addr?.cityName ?? "";
  const country = addr?.countryCode ?? "";
  const title = city && country ? `${city}, ${country}` : location.name ?? "—";

  const streetLine = [addr?.streetName, addr?.buildingNumber].filter(Boolean).join(" ");
  const postalLine = [addr?.postcode, city].filter(Boolean).join(" ");
  const fullAddress = [streetLine, postalLine].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[15px] font-bold text-[#1d2a3a]">{title}</span>
      {fullAddress && (
        <span className="text-[13px] text-[#6b7a8d] truncate">{fullAddress}</span>
      )}
      {geo?.latitude && geo?.longitude && (
        <span className="text-[12px] text-[#9aa5b4]">
          {geo.latitude}°N, {geo.longitude}°E
        </span>
      )}
      <span
        className="inline-flex self-start mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-white"
        style={{ backgroundColor: badgeColor }}
      >
        {badge}
      </span>
    </div>
  );
}

export default function RouteDisplay({ data }: { data: EftiConsignment }) {
  const modeCode = data.mainCarriageTransportMovement?.modeCode ?? "3";
  const modeLabel = MODE_LABELS[modeCode] ?? "nepoznato";

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <LocationBlock
          location={data.carrierAcceptanceLocation}
          badge="Preuzimanje"
          badgeColor="#2e7d32"
        />
      </div>

      <div className="flex flex-col items-center gap-0.5 flex-shrink-0 px-2">
        <svg className="w-6 h-6 text-[#9aa5b4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
        <span className="text-[11px] font-medium text-[#6b7a8d]">{modeLabel}</span>
      </div>

      <div className="flex-1 min-w-0">
        <LocationBlock
          location={data.consigneeReceiptLocation}
          badge="Isporuka"
          badgeColor="#1565c0"
        />
      </div>
    </div>
  );
}
