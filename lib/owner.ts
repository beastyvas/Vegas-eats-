import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";

/** Owner (or admin) of this listing, or 404. RLS also enforces this on every write. */
export async function requireOwner(listingId: string) {
  const ctx = await requireUser(`/owner/${listingId}`);
  if (!/^[0-9a-f-]{36}$/.test(listingId)) notFound();
  const isAdmin = ctx.profile?.role === "admin";
  if (!isAdmin) {
    const { data } = await ctx.supabase.from("listing_owners").select("listing_id").eq("listing_id", listingId).eq("user_id", ctx.user.id).maybeSingle();
    if (!data) notFound();
  }
  const { data: listing } = await ctx.supabase
    .from("listings")
    .select("*, areas(slug, name), listing_categories(category_id), listing_socials(platform, handle, url), listing_hours(dow, opens, closes), listing_photos(id)")
    .eq("id", listingId)
    .maybeSingle();
  if (!listing) notFound();
  return { ...ctx, listing, isAdmin };
}
