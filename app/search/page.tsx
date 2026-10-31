import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { getAreas, getCategories, searchListings, type ListingType } from "@/lib/data/listings";
import { LISTING_TYPES, LISTING_TYPE_LABELS } from "@/config/app";
import { ListingGrid } from "@/components/listing/listing-card";
import { ListingMap } from "@/components/map/listing-map";
import { logSearch } from "@/lib/search-log";

type SP = { q?: string; type?: string; cat?: string; area?: string; open?: string; licensed?: string; price?: string; view?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `“${q}”: local spots in Las Vegas` : "Search local spots in Las Vegas",
    robots: { index: false, follow: true },
    alternates: { canonical: "/search" },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const [categories, areas] = await Promise.all([getCategories(), getAreas()]);
  const type = (LISTING_TYPES as readonly string[]).includes(sp.type ?? "") ? (sp.type as ListingType) : undefined;
  const category = categories.some((c) => c.slug === sp.cat) ? sp.cat : undefined;
  const area = areas.some((a) => a.slug === sp.area) ? sp.area : undefined;
  const maxPrice = sp.price && /^[1-4]$/.test(sp.price) ? Number(sp.price) : undefined;
  const filters = { type, category, area, open: sp.open === "1", licensed: sp.licensed === "1", maxPrice };
  const q = sp.q?.trim().slice(0, 120) || undefined;

  const results = await searchListings({ q, ...filters });
  after(() => logSearch(q, filters, results.length));

  const view = sp.view === "map" ? "map" : "list";
  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
    return `/search?${p.toString()}`;
  };

  return (
    <div className="pt-6">
      <h1 className="h-display text-3xl sm:text-4xl">{q ? <>Results for “{q}”</> : "Find a local spot"}</h1>

      <form action="/search" className="card mt-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Search filters">
        <div className="sm:col-span-2 lg:col-span-4">
          <label htmlFor="q" className="label">What are you craving?</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="birria, brisket, ube, sourdough…" className="input" />
        </div>
        <div>
          <label htmlFor="cat" className="label">Category</label>
          <select id="cat" name="cat" defaultValue={category ?? ""} className="input">
            <option value="">Any</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="type" className="label">Type</label>
          <select id="type" name="type" defaultValue={type ?? ""} className="input">
            <option value="">Any</option>
            {LISTING_TYPES.map((t) => <option key={t} value={t}>{LISTING_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="area" className="label">Area</label>
          <select id="area" name="area" defaultValue={area ?? ""} className="input">
            <option value="">Anywhere in the valley</option>
            {areas.map((a) => <option key={a.slug} value={a.slug}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="price" className="label">Max price</label>
          <select id="price" name="price" defaultValue={maxPrice ? String(maxPrice) : ""} className="input">
            <option value="">Any</option>
            <option value="1">$</option><option value="2">$$</option><option value="3">$$$</option>
          </select>
        </div>
        <fieldset className="flex flex-wrap items-center gap-4 sm:col-span-2 lg:col-span-3">
          <legend className="sr-only">More filters</legend>
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="open" value="1" defaultChecked={filters.open} className="h-5 w-5" /> Open now</label>
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="licensed" value="1" defaultChecked={filters.licensed} className="h-5 w-5" /> Verified licensed</label>
        </fieldset>
        {view === "map" && <input type="hidden" name="view" value="map" />}
        <button type="submit" className="btn-primary">Search</button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="font-bold">{results.length} spot{results.length === 1 ? "" : "s"}</p>
        <div className="flex gap-1 rounded-full border-2 border-ink p-1" role="group" aria-label="View">
          <Link href={qs({ view: undefined })} aria-current={view === "list" ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-extrabold ${view === "list" ? "bg-ink text-white" : ""}`}>List</Link>
          <Link href={qs({ view: "map" })} aria-current={view === "map" ? "page" : undefined} className={`rounded-full px-4 py-1.5 text-sm font-extrabold ${view === "map" ? "bg-ink text-white" : ""}`}>Map</Link>
        </div>
      </div>

      <div className="mt-4">
        <h2 className="sr-only">Results</h2>
        {results.length === 0 ? (
          <div className="card p-6">
            <p className="font-bold">No locally owned spots match that yet.</p>
            <p className="mt-1 text-muted">
              Try fewer filters{filters.open ? " (many spots haven't posted hours yet, so “Open now” is strict)" : ""}, or{" "}
              <Link href="/add-a-spot" className="font-bold text-ink underline">tell us about a spot we&apos;re missing</Link>.
            </p>
          </div>
        ) : view === "map" ? (
          <ListingMap listings={results.map(({ slug, name, type, lat, lng, area }) => ({ slug, name, type, lat, lng, area }))} label="Search results map" />
        ) : (
          <ListingGrid listings={results} />
        )}
      </div>
    </div>
  );
}
