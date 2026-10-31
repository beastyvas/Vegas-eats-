import Link from "next/link";
import type { ListingCard } from "@/lib/data/listings";
import { ListingGrid } from "./listing-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/ui/json-ld";
import { ListingMap } from "@/components/map/listing-map";
import { breadcrumbJsonLd, itemListJsonLd } from "@/lib/seo/jsonld";

export type Chip = { href: string; label: string; count?: number; active?: boolean };

export function BrowsePage({ title, emoji, intro, crumbs, path, listings, chipsLabel, chips, emptyNote }: {
  title: string; emoji?: string | null; intro: React.ReactNode; crumbs: { name: string; path: string }[]; path: string;
  listings: ListingCard[]; chipsLabel?: string; chips?: Chip[]; emptyNote?: React.ReactNode;
}) {
  const vouched = [...listings].filter((l) => l.vouch_local_count > 0).sort((a, b) => b.vouch_local_count - a.vouch_local_count).slice(0, 3);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {listings.length > 0 && <JsonLd data={itemListJsonLd(title, path, listings)} />}
      <Breadcrumbs crumbs={crumbs} />
      <header className="mt-4">
        <h1 className="h-display text-4xl leading-tight sm:text-5xl">
          {emoji && <span aria-hidden="true" className="mr-2">{emoji}</span>}
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{intro}</p>
      </header>

      {chips && chips.length > 0 && (
        <nav aria-label={chipsLabel} className="mt-6">
          <p className="mb-2 text-sm font-extrabold">{chipsLabel}</p>
          <ul className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c.href}>
                <Link href={c.href} aria-current={c.active ? "page" : undefined}
                  className={`chip hover:border-ink ${c.active ? "border-ink bg-ink text-white" : ""}`}>
                  {c.label}{c.count != null && <span className={c.active ? "text-white/80" : "text-muted"}>{c.count}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {vouched.length > 0 && (
        <section aria-labelledby="most-vouched" className="mt-10">
          <h2 id="most-vouched" className="h-display text-2xl">🤝 Most vouched by locals</h2>
          <div className="mt-4"><ListingGrid listings={vouched} ranked /></div>
        </section>
      )}

      <section aria-labelledby="all-spots" className="mt-10">
        <h2 id="all-spots" className="h-display text-2xl">
          {listings.length} spot{listings.length === 1 ? "" : "s"}
        </h2>
        {listings.length > 0 ? (
          <div className="mt-4"><ListingGrid listings={listings} priorityCount={0} /></div>
        ) : (
          <p className="card mt-4 p-6">{emptyNote ?? <>Nothing here yet. Know a locally owned spot? <Link href="/add-a-spot" className="font-bold underline">Tell us</Link>.</>}</p>
        )}
      </section>

      {listings.length > 0 && (
        <section aria-labelledby="map-h" className="mt-10">
          <h2 id="map-h" className="h-display text-2xl">On the map</h2>
          <p className="mb-3 text-sm text-muted">Restaurants show exact pins. Home kitchens and pop-ups show by area only.</p>
          <ListingMap listings={listings.map(({ slug, name, type, lat, lng, area }) => ({ slug, name, type, lat, lng, area }))} height="420px" label={`Map: ${title}`} />
        </section>
      )}
    </>
  );
}
