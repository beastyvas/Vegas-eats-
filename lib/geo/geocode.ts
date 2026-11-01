import "server-only";
import { brand } from "@/config/brand";
import { cleanAddress, inVegasValley, parseCensus } from "./parse";

/**
 * Geocode a brick-and-mortar street address (never home sellers).
 * 1) US Census Bureau geocoder: free, no key, built for US street addresses,
 *    no strict rate limit, and doesn't block cloud IPs.
 * 2) Fallback: OpenStreetMap Nominatim (1 req/sec; may refuse cloud/serverless IPs).
 * Results outside the Las Vegas valley are rejected.
 */
export type GeoResult = { ok: true; lat: number; lng: number; source: "census" | "osm" } | { ok: false; reason: string };

export async function geocode(address: string, city = "Las Vegas"): Promise<GeoResult> {
  const street = cleanAddress(address);
  const reasons: string[] = [];

  try {
    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?benchmark=Public_AR_Current&format=json&address=${encodeURIComponent(`${street}, ${city}, NV`)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), cache: "no-store" });
    if (res.ok) {
      const pt = parseCensus(await res.json());
      if (pt && inVegasValley(pt)) return { ok: true, ...pt, source: "census" };
      reasons.push("Census: no match");
    } else reasons.push(`Census: HTTP ${res.status}`);
  } catch (e) {
    reasons.push(`Census: ${e instanceof Error ? e.message : "error"}`);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&bounded=1&viewbox=-115.45,36.40,-114.85,35.90&q=${encodeURIComponent(`${street}, ${city}, NV`)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": `local-food-directory/1.0 (${brand.email})`, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (res.ok) {
      const rows = (await res.json()) as { lat: string; lon: string }[];
      const pt = rows[0] ? { lat: Number(rows[0].lat), lng: Number(rows[0].lon) } : null;
      if (pt && inVegasValley(pt)) return { ok: true, ...pt, source: "osm" };
      reasons.push("OSM: no match");
    } else reasons.push(`OSM: HTTP ${res.status}`);
  } catch (e) {
    reasons.push(`OSM: ${e instanceof Error ? e.message : "error"}`);
  }

  return { ok: false, reason: reasons.join("; ") };
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
