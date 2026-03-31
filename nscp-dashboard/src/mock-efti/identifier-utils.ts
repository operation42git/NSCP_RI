import type { Consignment, IdentifiersResponse } from "./types";

export const IDENTIFIER_TYPES = ["means", "equipment", "carried"] as const;

export const TRANSPORT_MODE_NAMES: Record<number, string> = {
  1: "Waterway",
  2: "Railway",
  3: "Road",
  4: "Air",
};

export function getTransportModeName(modeCode: number): string {
  return TRANSPORT_MODE_NAMES[modeCode] ?? `Mode ${modeCode}`;
}

export function getDangerousGoodsIndicator(identifier: Consignment): "YES" | "NO" | "N/A" {
  const mm = identifier.mainCarriageTransportMovement;
  if (mm?.length) {
    const ind = mm[0].dangerousGoodsIndicator;
    if (ind === "true") return "YES";
    if (ind === "false") return "NO";
  }
  return "N/A";
}

export function getMainTransportMode(identifier: Consignment): number | null {
  const mm = identifier.mainCarriageTransportMovement;
  return mm?.length ? mm[0].modeCode : null;
}

export function getMainTransportCountry(identifier: Consignment): string | null {
  const mm = identifier.mainCarriageTransportMovement;
  return mm?.length ? mm[0].registrationCountryCode ?? null : null;
}

export function getUsedEquipmentCount(identifier: Consignment): number {
  return identifier.usedTransportEquipment?.length ?? 0;
}

export function getCarriedEquipmentCount(identifier: Consignment): number {
  let count = 0;
  identifier.usedTransportEquipment?.forEach((eq) => {
    count += eq.carriedTransportEquipment?.length ?? 0;
  });
  return count;
}

export function flattenConsignments(result: IdentifiersResponse | null): Consignment[] {
  if (!result?.identifiers) return [];
  const out: Consignment[] = [];
  result.identifiers.forEach((i) => {
    if (Array.isArray(i.consignments) && i.consignments.length > 0) {
      out.push(...i.consignments);
    }
  });
  return out;
}

export function statusBadgeClass(status: string): string {
  if (status === "COMPLETE") return "text-[#2e7d32] font-semibold";
  if (status === "ERROR") return "text-[#b71c1c] font-semibold";
  if (status === "TIMEOUT") return "text-[#e65100] font-semibold";
  if (status === "PENDING") return "text-[#1565c0] font-semibold";
  return "text-[#374151] font-semibold";
}
