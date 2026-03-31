/**
 * Decode UIL parameters from QR / pasted payload (same fields as manual UIL in portal-mock).
 * Supports JSON, URL query, efti:// URI, or bare dataset UUID v4.
 */
export interface ParsedUilFromQr {
  datasetId: string;
  gateId: string;
  platformId: string;
}

export function parseUilQrPayload(raw: string): ParsedUilFromQr | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    const j = JSON.parse(text) as Record<string, string | undefined>;
    if (j.datasetId || j.id) {
      return {
        datasetId: String(j.datasetId ?? j.id),
        gateId: String(j.gateId ?? j.gate ?? ""),
        platformId: String(j.platformId ?? j.platform ?? ""),
      };
    }
  } catch {
    /* not JSON */
  }

  try {
    const u = new URL(text);
    const d =
      u.searchParams.get("datasetId") ||
      u.searchParams.get("id") ||
      u.pathname.split("/").filter(Boolean).pop();
    if (d && /^[0-9a-f-]{36}$/i.test(d)) {
      return {
        datasetId: d,
        gateId:
          u.searchParams.get("gateId") ||
          u.searchParams.get("gate") ||
          "",
        platformId:
          u.searchParams.get("platformId") ||
          u.searchParams.get("platform") ||
          "",
      };
    }
  } catch {
    /* not URL */
  }

  const efti = text.match(
    /^efti:\/\/.+?\/([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?:\/([^/]+))?(?:\/([^/]+))?$/i
  );
  if (efti) {
    return {
      datasetId: efti[1],
      gateId: efti[2] ?? "",
      platformId: efti[3] ?? "",
    };
  }

  const uuid = text.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  );
  if (uuid) {
    return { datasetId: uuid[0], gateId: "", platformId: "" };
  }

  return null;
}
