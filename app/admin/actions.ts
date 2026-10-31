"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { geocode, sleep } from "@/lib/geo/geocode";

export type GeocodeState = { done?: number; failed?: string[]; error?: string };

/** Geocode published restaurants that have a street address but no coordinates. */
export async function geocodeMissing(): Promise<GeocodeState> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("listings")
    .select("id, name, street_address, city")
    .eq("type", "restaurant")
    .not("street_address", "is", null)
    .is("lat", null)
    .limit(40);
  if (error) return { error: error.message };
  let done = 0;
  const failed: string[] = [];
  for (const [i, l] of (data ?? []).entries()) {
    if (i > 0) await sleep(1100); // Nominatim: 1 req/sec
    const pt = await geocode(l.street_address!, l.city ?? "Las Vegas");
    if (!pt) { failed.push(l.name); continue; }
    const { error: upErr } = await supabase.from("listings").update({ lat: pt.lat, lng: pt.lng }).eq("id", l.id);
    if (upErr) failed.push(l.name); else done++;
  }
  if (done) revalidatePath("/", "layout");
  return { done, failed };
}
