import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAreas, getCategories, listListings } from "@/lib/data/listings";
import { BrowsePage } from "@/components/listing/browse-page";
import { categoryDescription, categoryTitle } from "@/lib/seo/copy";

export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

type P = { params: Promise<{ category: string }> };

async function load(slug: string) {
  const cats = await getCategories();
  const category = cats.find((c) => c.slug === slug);
  if (!category) return null;
  const [listings, areas] = await Promise.all([listListings({ category: slug, limit: 300 }), getAreas()]);
  return { category, listings, areas };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { category } = await params;
  const d = await load(category);
  if (!d) return {};
  const title = categoryTitle(d.category.slug, d.category.name);
  return {
    title,
    description: categoryDescription(d.category.name, d.listings.length),
    alternates: { canonical: `/eats/${category}` },
    robots: d.listings.length ? undefined : { index: false },
    openGraph: { title, description: categoryDescription(d.category.name, d.listings.length) },
  };
}

export default async function CategoryPage({ params }: P) {
  const { category } = await params;
  const d = await load(category);
  if (!d) notFound();
  const counts = new Map<string, number>();
  for (const l of d.listings) if (l.area) counts.set(l.area.slug, (counts.get(l.area.slug) ?? 0) + 1);
  return (
    <BrowsePage
      title={categoryTitle(d.category.slug, d.category.name)}
      emoji={d.category.emoji}
      intro={d.category.blurb ?? `Every ${d.category.name.toLowerCase()} spot here is locally owned: from home kitchens to brick-and-mortar. Ranked by locals.`}
      crumbs={[{ name: "Home", path: "/" }, { name: "Eats", path: "/eats" }, { name: d.category.name, path: `/eats/${category}` }]}
      path={`/eats/${category}`}
      listings={d.listings}
      chipsLabel="Narrow by part of town"
      chips={d.areas.filter((a) => counts.get(a.slug)).map((a) => ({ href: `/eats/${category}/${a.slug}`, label: a.name, count: counts.get(a.slug) }))}
    />
  );
}
