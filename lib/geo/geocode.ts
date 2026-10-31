import "server-only";
import { brand } from "@/config/brand";

/**
 * OpenStreetMap Nominatim geocoder, restricted to the Las Vegas valley.
 * Usage policy: max 1 request/second, identify the app. Only used for
 * brick-and-mortar addresses at approval time (never home sellers).
 */
const VIEWBOX = "-115.45,36.40,-114.85,35.90"; // left,top,right,bottom

export async function geocode(address: string, city = "Las Vegas"): Promise<{ lat: number; lng: number } | null> {
  const q = `${address.replace(/\s*\(.*?\)\s*/g, " ").trim()}, ${city}, NV`;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&bounded=1&viewbox=${VIEWBOX}&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": `${brand.name} directory (${brand.email})`, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { lat: string; lon: string }[];
    if (!rows[0]) return null;
    return { lat: Number(rows[0].lat), lng: Number(rows[0].lon) };
  } catch {
    return null;
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
