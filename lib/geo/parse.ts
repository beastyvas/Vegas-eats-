/** Pure helpers for geocoding (unit-tested). */

/** "3720 E Sunset Rd Ste 103 (Paradise)" -> "3720 E Sunset Rd" */
export function cleanAddress(address: string): string {
  return address
    .replace(/\(.*?\)/g, " ")
    .replace(/\s*(,\s*)?\b(ste|suite|unit|bldg|building|spc|space)\b\.?\s*[\w-]+/gi, " ")
    .replace(/\s*#\s*[\w-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s,]+$/, "")
    .trim();
}

/** Las Vegas valley incl. Henderson, NLV, Summerlin, Boulder City. */
export function inVegasValley(p: { lat: number; lng: number }): boolean {
  return p.lat > 35.85 && p.lat < 36.45 && p.lng > -115.5 && p.lng < -114.75;
}

type CensusResponse = { result?: { addressMatches?: { coordinates?: { x: number; y: number } }[] } };

export function parseCensus(json: unknown): { lat: number; lng: number } | null {
  const m = (json as CensusResponse)?.result?.addressMatches?.[0]?.coordinates;
  return m && Number.isFinite(m.x) && Number.isFinite(m.y) ? { lat: m.y, lng: m.x } : null;
}
