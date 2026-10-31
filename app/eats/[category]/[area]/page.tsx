import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAreas, getCategories, listListings } from "@/lib/data/listings";
import { BrowsePage } from "@/components/listing/browse-page";
import { categoryDescription, categoryTitle } from "@/lib/seo/copy";

export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

type P = { params: Promise<{ category: string; area: string }> };

async function load(catSlug: string, areaSlug: string) {
  const [cats, areas] = await Promise.all([getCategories(), getAreas()]);
  const category = cats.find((c) => c.slug === catSlug);
  const area = areas.find((a) => a.slug === areaSlug);
  if (!category || !area) return null;
  const [listings, allInCat] = await Promise.all([
    listListings({ category: catSlug, area: areaSlug, limit: 300 }),
    listListings({ category: catSlug, limit: 300, order: "name" }),
  ]);
  return { category, area, areas, listings, allInCat };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { category, area } = await params;
  const d = await load(category, area);
  if (!d) return {};
  const title = categoryTitle(d.category.slug, d.category.name, d.area.name);
  return {
    title,
    description: categoryDescription(d.category.name, d.listings.length, d.area.name),
    alternates: { canonical: `/eats/${category}/${area}` },
    // Thin pages (0 spots) stay out of the index until they have content.
    robots: d.listings.length ? undefined : { index: false },
  };
}

export default async function CategoryAreaPage({ params }: P) {
  const { category, area } = await params;
  const d = await load(category, area);
  if (!d) notFound();
  const counts = new Map<string, number>();
  for (const l of d.allInCat) if (l.area) counts.set(l.area.slug, (counts.get(l.area.slug) ?? 0) + 1);
  return (
    <BrowsePage
      title={categoryTitle(d.category.slug, d.category.name, d.area.name)}
      emoji={d.category.emoji}
      intro={<>Locally owned {d.category.name.toLowerCase()} in {d.area.name}. {d.area.blurb}</>}
      crumbs={[
        { name: "Home", path: "/" },
        { name: d.category.name, path: `/eats/${category}` },
        { name: d.area.name, path: `/eats/${category}/${area}` },
      ]}
      path={`/eats/${category}/${area}`}
      listings={d.listings}
      chipsLabel="Other parts of town"
      chips={d.areas.filter((a) => counts.get(a.slug)).map((a) => ({ href: `/eats/${category}/${a.slug}`, label: a.name, count: counts.get(a.slug), active: a.slug === area }))}
      emptyNote={<>No {d.category.name.toLowerCase()} listed in {d.area.name} yet. <Link href={`/eats/${category}`} className="font-bold underline">See all of Las Vegas</Link> or <Link href="/add-a-spot" className="font-bold underline">suggest one</Link>.</>}
    />
  );
}
