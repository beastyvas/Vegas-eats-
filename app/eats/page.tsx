import type { Metadata } from "next";
import Link from "next/link";
import { getCategories, listListings } from "@/lib/data/listings";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Local eats in Las Vegas by category",
  description: "Locally owned Texas BBQ, birria, soul food, pizza, home bakers, and more in Las Vegas. No chains.",
  alternates: { canonical: "/eats" },
};

export default async function EatsIndex() {
  const [categories, all] = await Promise.all([getCategories(), listListings({ limit: 1000, order: "name" })]);
  const counts = new Map<string, number>();
  for (const l of all) for (const c of l.categories) counts.set(c.slug, (counts.get(c.slug) ?? 0) + 1);
  const live = categories.filter((c) => counts.get(c.slug));
  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Home", path: "/" }, { name: "Eats", path: "/eats" }]} />
      <h1 className="h-display mt-4 text-4xl sm:text-5xl">Local eats, by craving</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{all.length} locally owned spots across the valley. Pick a lane.</p>
      <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {live.map((c) => (
          <li key={c.slug}>
            <Link href={`/eats/${c.slug}`} className="card flex items-center gap-4 p-5 hover:border-ink">
              <span aria-hidden="true" className="text-4xl">{c.emoji}</span>
              <span>
                <span className="h-display block text-xl">{c.name}</span>
                <span className="text-sm text-muted">{counts.get(c.slug)} locally owned spots</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
