"use server";
import { revalidatePath } from "next/cache";
import { refreshPublicPages } from "@/lib/revalidate";
import { z } from "zod";
import { requireOwner } from "@/lib/owner";
import { readOwnerForm } from "@/lib/listings/owner-form";
import type { Json } from "@/lib/database.types";

export type FormState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

function refresh(_slug: string) {
  refreshPublicPages();
}

export async function saveListing(listingId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, listing } = await requireOwner(listingId);
  const { parsed, howToBuy, categoryIds, showPhone, showEmail, hours, error: hoursError } = readOwnerForm(fd);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Fix the highlighted fields.", fieldErrors };
  }
  if (hoursError) return { error: hoursError, fieldErrors: { hours: hoursError } };
  if (!categoryIds.length) return { error: "Pick at least one category.", fieldErrors: { category_ids: "Required" } };
  const f = parsed.data;
  if (f.how_to_buy_notes) howToBuy.notes = f.how_to_buy_notes;

  const { error } = await supabase
    .from("listings")
    .update({
      story_hook: f.story_hook, origin_story: f.origin_story, what_to_order: f.what_to_order,
      order_url: f.order_url, website: f.website, phone: f.phone, email: f.email,
      show_phone: showPhone, show_email: showEmail, price_level: f.price_level, founded_year: f.founded_year,
      area_id: f.area_id, how_to_buy: howToBuy as Json,
    })
    .eq("id", listingId);
  if (error) return { error: error.message };

  // Replace categories, managed socials, and hours.
  await supabase.from("listing_categories").delete().eq("listing_id", listingId);
  await supabase.from("listing_categories").insert(categoryIds.map((category_id) => ({ listing_id: listingId, category_id })));
  await supabase.from("listing_socials").delete().eq("listing_id", listingId).in("platform", ["instagram", "tiktok", "facebook"]);
  const socials = [
    f.instagram && { listing_id: listingId, platform: "instagram", handle: f.instagram, url: `https://www.instagram.com/${f.instagram}/` },
    f.tiktok && { listing_id: listingId, platform: "tiktok", handle: f.tiktok, url: `https://www.tiktok.com/@${f.tiktok}` },
    f.facebook && { listing_id: listingId, platform: "facebook", handle: null, url: f.facebook },
  ].filter(Boolean) as { listing_id: string; platform: string; handle: string | null; url: string }[];
  if (socials.length) await supabase.from("listing_socials").insert(socials);
  await supabase.from("listing_hours").delete().eq("listing_id", listingId);
  if (hours.length) await supabase.from("listing_hours").insert(hours.map((h) => ({ listing_id: listingId, ...h })));

  refresh(listing.slug);
  return { ok: true };
}

const changeSchema = z.object({
  name: z.string().trim().max(120).optional(),
  type: z.enum(["home_seller", "pop_up", "food_truck", "restaurant"]).optional(),
  street_address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(80).optional(),
  zip: z.string().trim().max(5).optional(),
  reason: z.string().trim().max(1000).optional(),
});

export async function requestChange(listingId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user, listing } = await requireOwner(listingId);
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string" && v.trim() !== ""));
  const parsed = changeSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { reason, ...rest } = parsed.data;
  const changes = Object.fromEntries(Object.entries(rest).filter(([k, v]) => v !== (listing as Record<string, unknown>)[k]));
  if (!Object.keys(changes).length) return { error: "Nothing changed." };
  const { error } = await supabase.from("edit_requests").insert({ listing_id: listingId, user_id: user.id, changes: changes as Json, reason: reason ?? null });
  return error ? { error: error.message } : { ok: true };
}

export async function submitLicense(listingId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const { supabase, user } = await requireOwner(listingId);
  const number = String(fd.get("license_number") ?? "").trim();
  const kind = String(fd.get("license_kind") ?? "cottage_food");
  if (number.length < 3 || number.length > 80) return { error: "Enter your license or permit number." };
  if (!["cottage_food", "business", "health_permit", "other"].includes(kind)) return { error: "Pick a license type." };
  const { error } = await supabase.from("license_verifications").insert({ listing_id: listingId, submitted_by: user.id, license_number: number, license_kind: kind });
  return error ? { error: error.message } : { ok: true };
}

// ---------- Photos ----------
export async function addPhoto(listingId: string, input: { path: string; alt: string; width: number; height: number; ownerFace: boolean }): Promise<FormState> {
  const { supabase, user, listing } = await requireOwner(listingId);
  if (!input.path.startsWith(`${listingId}/`)) return { error: "Bad upload path." };
  const alt = input.alt.trim();
  if (alt.length < 3) return { error: "Describe the photo (alt text) so everyone can enjoy it." };
  const { count } = await supabase.from("listing_photos").select("*", { count: "exact", head: true }).eq("listing_id", listingId);
  if ((count ?? 0) >= 12) return { error: "12 photos max. Delete one first." };
  const { error } = await supabase.from("listing_photos").insert({
    listing_id: listingId, storage_path: input.path, alt_text: alt.slice(0, 300), width: input.width, height: input.height,
    is_owner_face: input.ownerFace, sort: (count ?? 0) * 10 + 10, uploaded_by: user.id,
  });
  if (error) return { error: error.message };
  refresh(listing.slug);
  return { ok: true };
}

export async function updatePhoto(listingId: string, photoId: string, fd: FormData) {
  const { supabase, listing } = await requireOwner(listingId);
  const alt = String(fd.get("alt") ?? "").trim();
  const patch: { alt_text?: string; is_owner_face?: boolean; sort?: number } = { is_owner_face: fd.get("owner_face") === "on" };
  if (alt.length >= 3) patch.alt_text = alt.slice(0, 300);
  if (fd.get("intent") === "cover") patch.sort = 0;
  await supabase.from("listing_photos").update(patch).eq("id", photoId).eq("listing_id", listingId);
  if (fd.get("intent") === "cover") {
    const { data } = await supabase.from("listing_photos").select("id").eq("listing_id", listingId).neq("id", photoId).order("sort");
    for (const [i, p] of (data ?? []).entries()) await supabase.from("listing_photos").update({ sort: (i + 1) * 10 }).eq("id", p.id);
  }
  refresh(listing.slug);
  revalidatePath(`/owner/${listingId}/photos`);
}

export async function deletePhoto(listingId: string, photoId: string) {
  const { supabase, listing } = await requireOwner(listingId);
  const { data } = await supabase.from("listing_photos").delete().eq("id", photoId).eq("listing_id", listingId).select("storage_path").maybeSingle();
  if (data?.storage_path) await supabase.storage.from("listing-photos").remove([data.storage_path]);
  refresh(listing.slug);
  revalidatePath(`/owner/${listingId}/photos`);
}
