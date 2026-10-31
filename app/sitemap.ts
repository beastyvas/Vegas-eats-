import type { MetadataRoute } from "next";
import { appConfig } from "@/config/app";
import { getSitemapEntries } from "@/lib/data/listings";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appConfig.siteUrl.replace(/\/$/, "");
  const rows = await getSitemapEntries();
  const now = new Date();
  const cats = new Set<string>();
  const areas = new Set<string>();
  const combos = new Set<string>();
  for (const r of rows) {
    for (const lc of r.listing_categories) {
      if (!lc.categories) continue;
      cats.add(lc.categories.slug);
      if (r.areas) combos.add(`${lc.categories.slug}/${r.areas.slug}`);
    }
    if (r.areas) areas.add(r.areas.slug);
  }
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/eats`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/trucks-today`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.3 },
    ...[...cats].map((c) => ({ url: `${base}/eats/${c}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    // Only category × area pages that actually have listings (no thin pages).
    ...[...combos].map((c) => ({ url: `${base}/eats/${c}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...[...areas].map((a) => ({ url: `${base}/area/${a}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...rows.map((r) => ({ url: `${base}/spot/${r.slug}`, lastModified: new Date(r.updated_at), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
