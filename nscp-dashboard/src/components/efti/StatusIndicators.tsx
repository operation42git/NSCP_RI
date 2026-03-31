import type { EftiConsignment } from "@/types/efti";

interface StatusFlag {
  label: string;
  active: boolean;
  color: string;
}

function deriveFlags(data: EftiConsignment): StatusFlag[] {
  const hasDG =
    !!data.dangerousGoods?.uNDGID ||
    !!data.dangerousGoods?.hazardClassificationID ||
    data.mainCarriageTransportMovement?.dangerousGoodsIndicator === "true" ||
    data.includedConsignmentItem?.some((i) => !!i.transportDangerousGoods) === true;

  const hasCustoms =
    !!data.consignorProvidedBorderClearanceInstructions ||
    (data.regulatoryProcedure?.length ?? 0) > 0;

  const hasTransshipment = !!data.transshipmentPermittedIndicator;

  return [
    { label: "Opasna roba (ADR)", active: hasDG, color: "#d32f2f" },
    { label: "Carinjenje na ruti", active: hasCustoms, color: "#f9a825" },
    { label: "Pretovar dozvoljenje", active: hasTransshipment, color: "#1565c0" },
  ];
}

export default function StatusIndicators({ data }: { data: EftiConsignment }) {
  const flags = deriveFlags(data);
  const active = flags.filter((f) => f.active);

  if (active.length === 0) return null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {active.map((f) => (
        <span key={f.label} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#374151]">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
          {f.label}
        </span>
      ))}
    </div>
  );
}
