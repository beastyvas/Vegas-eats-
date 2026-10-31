import "server-only";
import { createPublicClient } from "@/lib/supabase/public";
import type { Enums } from "@/lib/database.types";

/**
 * Read-side data access for public pages. Uses the cookie-less anon client so
 * pages can be statically generated (ISR); RLS limits results to published rows.
 */

export type ListingType = Enums<"listing_type">;
export type Category = { id: number; slug: string; name: string; emoji: string | null; blurb: string | null };
export type Area = { id: number; slug: string; name: string; blurb: string | null; centroid_lat: number; centroid_lng: number };
export type GrowthStep = { stage: ListingType; year?: number; note?: string };

export type ListingCard = {
  id: string;
  slug: string;
  name: string;
  type: ListingType;
  story_hook: string | null;
  what_to_order: string | null;
  price_level: number | null;
  vouch_local_count: number;
  vouch_total_count: number;
  heat_score: number;
  is_featured: boolean;
  license_verified_at: string | null;
  published_at: string | null;
  growth_path: GrowthStep[];
  lat: number | null;
  lng: number | null;
  area: { slug: string; name: string; centroid_lat: number; centroid_lng: number } | null;
  categories: { slug: string; name: string; emoji: string | null }[];
  photo: { storage_path: string; alt_text: string } | null;
};

const CARD_SELECT = `
  id, slug, name, type, story_hook, what_to_order, price_level, vouch_local_count, vouch_total_count,
  heat_score, is_featured, license_verified_at, published_at, growth_path, lat, lng,
  areas ( slug, name, centroid_lat, centroid_lng ),
  listing_categories ( categories ( slug, name, emoji, sort ) ),
  listing_photos ( storage_path, alt_text, sort )
`;

type RawCard = {
  id: string; slug: string; name: string; type: ListingType; story_hook: string | null; what_to_order: string | null;
  price_level: number | null; vouch_local_count: number; vouch_total_count: number; heat_score: number;
  is_featured: boolean; license_verified_at: string | null; published_at: string | null; growth_path: unknown;
  lat: number | null; lng: number | null;
  areas: ListingCard["area"];
  listing_categories: { categories: { slug: string; name: string; emoji: string | null; sort: number } | null }[];
  listing_photos: { storage_path: string; alt_text: string; sort: number }[];
};

function toCard(r: RawCard): ListingCard {
  const cats = (r.listing_categories ?? [])
    .map((lc) => lc.categories)
    .filter((c): c is NonNullable<typeof c> => !!c)
    .sort((a, b) => a.sort - b.sort)
    .map(({ slug, name, emoji }) => ({ slug, name, emoji }));
  const photo = [...(r.listing_photos ?? [])].sort((a, b) => a.sort - b.sort)[0];
  return {
    id: r.id, slug: r.slug, name: r.name, type: r.type, story_hook: r.story_hook, what_to_order: r.what_to_order,
    price_level: r.price_level, vouch_local_count: r.vouch_local_count, vouch_total_count: r.vouch_total_count,
    heat_score: Number(r.heat_score), is_featured: r.is_featured, license_verified_at: r.license_verified_at,
    published_at: r.published_at, growth_path: Array.isArray(r.growth_path) ? (r.growth_path as GrowthStep[]) : [],
    lat: r.lat, lng: r.lng, area: r.areas, categories: cats,
    photo: photo ? { storage_path: photo.storage_path, alt_text: photo.alt_text } : null,
  };
}

function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

export async function getCategories(): Promise<Category[]> {
  const sb = createPublicClient();
  return must(await sb.from("categories").select("id, slug, name, emoji, blurb").eq("is_active", true).order("sort"), "categories");
}

export async function getAreas(): Promise<Area[]> {
  const sb = createPublicClient();
  return must(await sb.from("areas").select("id, slug, name, blurb, centroid_lat, centroid_lng").order("sort"), "areas");
}

type ListOpts = {
  category?: string;
  area?: string;
  types?: ListingType[];
  order?: "heat" | "newest" | "vouches" | "name";
  limit?: number;
  excludeIds?: string[];
};

/** Featured first (paid visibility, still no-chains), then the requested order. */
export async function listListings(opts: ListOpts = {}): Promise<ListingCard[]> {
  const sb = createPublicClient();
  let select = CARD_SELECT;
  if (opts.category) select += `, cat_filter:listing_categories!inner ( categories!inner ( slug ) )`;
  if (opts.area) select += `, area_filter:areas!inner ( slug )`;
  let q = sb.from("listings").select(select).eq("status", "published");
  if (opts.category) q = q.eq("cat_filter.categories.slug", opts.category);
  if (opts.area) q = q.eq("area_filter.slug", opts.area);
  if (opts.types?.length) q = q.in("type", opts.types);
  if (opts.excludeIds?.length) q = q.not("id", "in", `(${opts.excludeIds.join(",")})`);
  q = q.order("is_featured", { ascending: false });
  switch (opts.order ?? "heat") {
    case "heat": q = q.order("heat_score", { ascending: false }).order("vouch_total_count", { ascending: false }); break;
    case "newest": q = q.order("published_at", { ascending: false }); break;
    case "vouches": q = q.order("vouch_local_count", { ascending: false }).order("heat_score", { ascending: false }); break;
    case "name": q = q.order("name"); break;
  }
  q = q.order("name").limit(opts.limit ?? 60);
  const rows = must(await q, "listings") as unknown as RawCard[];
  return rows.map(toCard);
}

export async function getListingsByIds(ids: string[]): Promise<ListingCard[]> {
  if (!ids.length) return [];
  const sb = createPublicClient();
  const rows = must(await sb.from("listings").select(CARD_SELECT).in("id", ids), "listings") as unknown as RawCard[];
  const byId = new Map(rows.map((r) => [r.id, toCard(r)]));
  return ids.map((id) => byId.get(id)).filter((c): c is ListingCard => !!c);
}

/** Category slug -> number of published listings (optionally within an area). */
export async function getCategoryCounts(area?: string): Promise<Record<string, number>> {
  const sb = createPublicClient();
  let q = sb.from("listing_categories").select("categories!inner(slug), listings!inner(status, areas(slug))").eq("listings.status", "published");
  if (area) q = q.eq("listings.areas.slug", area).not("listings.areas", "is", null);
  const rows = must(await q, "category counts") as unknown as { categories: { slug: string }; listings: { areas: { slug: string } | null } }[];
  const out: Record<string, number> = {};
  for (const r of rows) {
    if (area && r.listings.areas?.slug !== area) continue;
    out[r.categories.slug] = (out[r.categories.slug] ?? 0) + 1;
  }
  return out;
}

/** Area slug -> count of published listings (optionally within a category). */
export async function getAreaCounts(category?: string): Promise<Record<string, number>> {
  const rows = await listListings({ category, limit: 1000, order: "name" });
  const out: Record<string, number> = {};
  for (const r of rows) if (r.area) out[r.area.slug] = (out[r.area.slug] ?? 0) + 1;
  return out;
}

export type ListingDetail = ListingCard & {
  origin_story: string | null;
  how_to_buy: Record<string, boolean | string>;
  order_url: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  show_phone: boolean;
  show_email: boolean;
  street_address: string | null;
  city: string | null;
  zip: string | null;
  founded_year: number | null;
  updated_at: string;
  socials: { platform: string; handle: string | null; url: string }[];
  hours: { dow: number; opens: string; closes: string }[];
  schedules: { dow: number; starts: string; ends: string; location_name: string; notes: string | null }[];
  photos: { storage_path: string; alt_text: string; is_owner_face: boolean }[];
};

export async function getListing(slug: string): Promise<ListingDetail | null> {
  const sb = createPublicClient();
  const res = await sb
    .from("listings")
    .select(`${CARD_SELECT}, origin_story, how_to_buy, order_url, website, phone, email, show_phone, show_email,
      street_address, city, zip, founded_year, updated_at,
      listing_socials ( platform, handle, url ),
      listing_hours ( dow, opens, closes ),
      schedules ( dow, starts, ends, location_name, notes ),
      all_photos:listing_photos ( storage_path, alt_text, is_owner_face, sort )`)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  const r = must(res, "listing") as unknown as (RawCard & Record<string, unknown>) | null;
  if (!r) return null;
  const card = toCard(r);
  const photos = ((r.all_photos as { storage_path: string; alt_text: string; is_owner_face: boolean; sort: number }[]) ?? [])
    .sort((a, b) => a.sort - b.sort);
  return {
    ...card,
    origin_story: r.origin_story as string | null,
    how_to_buy: (r.how_to_buy as Record<string, boolean | string>) ?? {},
    order_url: r.order_url as string | null,
    website: r.website as string | null,
    phone: r.show_phone ? (r.phone as string | null) : null,
    email: r.show_email ? (r.email as string | null) : null,
    show_phone: r.show_phone as boolean,
    show_email: r.show_email as boolean,
    street_address: r.street_address as string | null,
    city: r.city as string | null,
    zip: r.zip as string | null,
    founded_year: r.founded_year as number | null,
    updated_at: r.updated_at as string,
    socials: (r.listing_socials as ListingDetail["socials"]) ?? [],
    hours: ((r.listing_hours as ListingDetail["hours"]) ?? []).sort((a, b) => a.dow - b.dow || a.opens.localeCompare(b.opens)),
    schedules: ((r.schedules as ListingDetail["schedules"]) ?? []).sort((a, b) => a.dow - b.dow || a.starts.localeCompare(b.starts)),
    photos,
  };
}

export type SearchParams = {
  q?: string;
  type?: ListingType;
  category?: string;
  area?: string;
  open?: boolean;
  licensed?: boolean;
  maxPrice?: number;
};

export async function searchListings(p: SearchParams): Promise<ListingCard[]> {
  const sb = createPublicClient();
  const res = await sb.rpc("search_listings", {
    q: p.q ?? undefined,
    p_type: p.type ?? undefined,
    p_category: p.category ?? undefined,
    p_area: p.area ?? undefined,
    p_open: p.open ?? false,
    p_licensed: p.licensed ?? false,
    p_max_price: p.maxPrice ?? undefined,
    p_limit: 100,
  });
  const ids = must(res, "search").map((r) => r.id);
  return getListingsByIds(ids);
}

export async function getSitemapEntries() {
  const sb = createPublicClient();
  const rows = must(
    await sb
      .from("listings")
      .select("slug, updated_at, areas(slug), listing_categories(categories(slug))")
      .eq("status", "published"),
    "sitemap",
  ) as unknown as { slug: string; updated_at: string; areas: { slug: string } | null; listing_categories: { categories: { slug: string } | null }[] }[];
  return rows;
}

export async function getPublishedCount(): Promise<number> {
  const sb = createPublicClient();
  const { count, error } = await sb.from("listings").select("id", { count: "exact", head: true }).eq("status", "published");
  if (error) throw new Error(error.message);
  return count ?? 0;
}
