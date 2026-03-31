import type { EftiConsignment } from "@/types/efti";

const OP_CATEGORY_LABELS: Record<string, string> = {
  "1": "Eksplozivi",
  "2": "Plinovi",
  "3": "Zapaljive tekućine",
  "4": "Zapaljive krutine",
  "5": "Oksidirajuće tvari",
  "6": "Otrovne tvari",
  "7": "Radioaktivni materijal",
  "8": "Korozivne tvari",
  "9": "Razne opasne tvari",
};

function Cell({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-[#9aa5b4] font-semibold">{label}</span>
      <span className="text-[14px] font-semibold text-[#1d2a3a]">{value || "—"}</span>
    </div>
  );
}

function formatWeight(value?: string, unit?: string): string | undefined {
  if (!value) return undefined;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  const formatted = num.toLocaleString("hr-HR");
  const unitLabel = unit === "KGM" ? "kg" : unit === "TNE" ? "t" : unit ?? "";
  return `${formatted} ${unitLabel}`.trim();
}

function formatVolume(value?: string, unit?: string): string | undefined {
  if (!value) return undefined;
  const unitLabel = unit === "MTQ" ? "m³" : unit === "LTR" ? "l" : unit ?? "";
  return `${value} ${unitLabel}`.trim();
}

function formatDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const compact = raw.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (compact) {
    const [, y, m, d, h, min] = compact;
    return `${d}.${m}.${y}. ${h}:${min}`;
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (iso) {
    const [, y, m, d, h, min] = iso;
    return `${d}.${m}.${y}. ${h}:${min}`;
  }
  return raw;
}

export default function GoodsSummaryGrid({ data }: { data: EftiConsignment }) {
  const cargo = data.natureIdentificationCargo;
  const firstItem = data.includedConsignmentItem?.[0];
  const itemCargo = firstItem?.natureIdentificationTransportCargo;

  const goodsType = cargo?.identification ?? itemCargo?.identification;
  const goodsDesc = itemCargo?.identification ?? cargo?.identification;
  const opCode = cargo?.operationalCategoryCode ?? itemCargo?.operationalCategoryCode;
  const opLabel = opCode ? `${opCode} — ${OP_CATEGORY_LABELS[opCode] ?? ""}` : undefined;
  const statCode = cargo?.statisticalClassificationCode ?? itemCargo?.statisticalClassificationCode ?? firstItem?.statisticalClassificationCode;
  const statLabel = statCode ? `HS ${statCode}` : undefined;

  const weight = formatWeight(data.grossWeight, data.grossWeightUnit);
  const volume = formatVolume(data.grossVolume, data.grossVolumeUnit);
  const pickupDate = formatDate(data.carrierAcceptanceDateTime);
  const vehicleId = data.mainCarriageTransportMovement?.usedTransportMeans?.id;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-x-4 gap-y-3 bg-[#f7f9fd] border border-[#e2e8f2] rounded-lg px-4 py-3">
        <Cell label="Vrsta robe" value={goodsType} />
        <Cell label="Opis" value={goodsType !== goodsDesc ? goodsDesc : undefined} />
        <Cell label="Operativna kategorija" value={opLabel} />
        <Cell label="Statistička klasif." value={statLabel} />
      </div>

      <div className="grid grid-cols-4 gap-x-4 gap-y-3 bg-[#f7f9fd] border border-[#e2e8f2] rounded-lg px-4 py-3">
        <Cell label="Bruto masa" value={weight} />
        <Cell label="Bruto obujam" value={volume} />
        <Cell label="Datum preuzimanja" value={pickupDate} />
        <Cell label="Prijevozno sredstvo" value={vehicleId} />
      </div>
    </div>
  );
}
