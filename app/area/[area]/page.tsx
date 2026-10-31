import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAreas, getCategories, listListings } from "@/lib/data/listings";
import { BrowsePage } from "@/components/listing/browse-page";

export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

type P = { params: Promise<{ area: string }> };

async function load(slug: string) {
  const areas = await getAreas();
  const area = areas.find((a) => a.slug === slug);
  if (!area) return null;
  const [listings, categories] = await Promise.all([listListings({ area: slug, limit: 300 }), getCategories()]);
  return { area, listings, categories };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { area } = await params;
  const d = await load(area);
  if (!d) return {};
  const title = `Locally owned food in ${d.area.name}, Las Vegas`;
  return {
    title,
    description: `${d.listings.length} locally owned food spots in ${d.area.name}: home kitchens, pop-ups, trucks, and restaurants. No chains.`,
    alternates: { canonical: `/area/${area}` },
    robots: d.listings.length ? undefined : { index: false },
  };
}

export default async function AreaPage({ params }: P) {
  const { area } = await params;
  const d = await load(area);
  if (!d) notFound();
  const counts = new Map<string, number>();
  for (const l of d.listings) for (const c of l.categories) counts.set(c.slug, (counts.get(c.slug) ?? 0) + 1);
  return (
    <BrowsePage
      title={`Local eats in ${d.area.name}`}
      intro={d.area.blurb ?? `Locally owned food in ${d.area.name}.`}
      crumbs={[{ name: "Home", path: "/" }, { name: d.area.name, path: `/area/${area}` }]}
      path={`/area/${area}`}
      listings={d.listings}
      chipsLabel={`What's good in ${d.area.name}`}
      chips={d.categories.filter((c) => counts.get(c.slug)).map((c) => ({ href: `/eats/${c.slug}/${area}`, label: `${c.emoji ?? ""} ${c.name}`.trim(), count: counts.get(c.slug) }))}
    />
  );
}
