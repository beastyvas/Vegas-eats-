import Link from "next/link";
import { brand } from "@/config/brand";
import { getAreas, getCategories, listListings, type ListingCard as Card } from "@/lib/data/listings";
import { diversify } from "@/lib/diversify";
import { ListingRow } from "@/components/listing/listing-card";
import { HEAT_BADGE_MIN } from "@/components/listing/badges";
import { GrowthPath } from "@/components/listing/growth-path";
import { Section } from "@/components/ui/section";
import { SearchBox } from "@/components/ui/search-box";
import { JsonLd } from "@/components/ui/json-ld";
import { websiteJsonLd } from "@/lib/seo/jsonld";

export const revalidate = 600;

const primaryCat = (l: Card) => l.categories[0]?.slug ?? "other";
const QUICK = [
  { slug: "birria-tacos", label: "🌮 Birria" },
  { slug: "texas-bbq", label: "🔥 Texas BBQ" },
  { slug: "soul-food", label: "🍗 Soul food" },
  { slug: "pizza", label: "🍕 Pizza" },
  { slug: "bakery-desserts", label: "🧁 Home bakers" },
  { slug: "vegan", label: "🥬 Vegan" },
];

export default async function HomePage() {
  const [all, categories, areas] = await Promise.all([listListings({ limit: 500, order: "heat" }), getCategories(), getAreas()]);

  const shown = new Set<string>();
  const take = (items: Card[], n: number) => {
    const out = diversify(items.filter((l) => !shown.has(l.id)), primaryCat, n);
    out.forEach((l) => shown.add(l.id));
    return out;
  };

  const hasRealHeat = all.some((l) => l.heat_score >= HEAT_BADGE_MIN);
  const heating = take(all, 6);
  const rising = take(all.filter((l) => l.type !== "restaurant"), 6);
  const startedSmall = all.filter((l) => l.growth_path.length > 1).slice(0, 6);
  const trucks = all.filter((l) => l.type === "food_truck" || l.type === "pop_up").slice(0, 6);
  const newest = take([...all].sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? "")), 6);

  const catCounts = new Map<string, number>();
  const areaCounts = new Map<string, number>();
  for (const l of all) {
    for (const c of l.categories) catCounts.set(c.slug, (catCounts.get(c.slug) ?? 0) + 1);
    if (l.area) areaCounts.set(l.area.slug, (areaCounts.get(l.area.slug) ?? 0) + 1);
  }
  const liveCats = categories.filter((c) => catCounts.get(c.slug)).sort((a, b) => (catCounts.get(b.slug) ?? 0) - (catCounts.get(a.slug) ?? 0));
  const liveAreas = areas.filter((a) => areaCounts.get(a.slug));
  const homeKitchens = all.filter((l) => l.type === "home_seller").length;

  return (
    <>
      <JsonLd data={websiteJsonLd()} />

      {/* Hero */}
      <section className="relative -mx-4 overflow-hidden border-b-4 border-ink bg-mustard px-4 pb-10 pt-10 sm:rounded-b-[2.5rem] sm:pt-14">
        <div className="mx-auto max-w-3xl">
          <p className="inline-flex -rotate-1 items-center gap-2 rounded-full bg-ink px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
            Las Vegas · locals only
          </p>
          <h1 className="h-display mt-4 text-[2.6rem] leading-[1.02] sm:text-6xl">
            The food your neighbors actually eat.
          </h1>
          <p className="mt-4 max-w-xl text-lg font-semibold sm:text-xl">{brand.tagline}</p>
          <div className="mt-6">
            <SearchBox />
          </div>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Popular categories">
            {QUICK.filter((q) => catCounts.get(q.slug)).map((q) => (
              <li key={q.slug}>
                <Link href={`/eats/${q.slug}`} className="inline-flex rounded-full border-2 border-ink bg-surface px-3 py-1.5 text-sm font-extrabold hover:bg-ink hover:text-white">
                  {q.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-bold">
            <span className="text-2xl font-black">{all.length}</span> locally owned spots ·{" "}
            <span className="text-2xl font-black">{homeKitchens}</span> home kitchens ·{" "}
            <span className="text-2xl font-black">0</span> chains
          </p>
        </div>
      </section>

      <Section
        id="heating"
        kicker="🔥 Heating up"
        title="What locals are hitting this week"
        intro={
          hasRealHeat
            ? "Ranked by this week's vouches and clicks compared to each spot's usual, so a hot new pop-up can beat a 20-year institution."
            : "Early days: these are fresh on the list. Vouches and clicks from locals decide what heats up next."
        }
        href="/search"
      >
        <ListingRow listings={heating} priorityCount={0} />
      </Section>

      <Section
        id="rising"
        kicker="📈 On the rise"
        title="Home kitchens, pop-ups & trucks to catch now"
        intro="Small operators building a following. Get in before the line does."
        href="/search?type=home_seller"
        hrefLabel="All home kitchens"
      >
        <ListingRow listings={rising} />
      </Section>

      {startedSmall.length > 0 && (
        <section aria-labelledby="started-small" className="mt-12 rounded-3xl bg-green p-6 text-white sm:p-8">
          <p className="text-sm font-extrabold uppercase tracking-wider text-[#F4C95D]">Started small</p>
          <h2 id="started-small" className="h-display text-2xl sm:text-3xl">From a home kitchen or a truck to a storefront</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {startedSmall.map((l) => (
              <li key={l.id} className="rounded-2xl bg-white/10 p-4">
                <Link href={`/spot/${l.slug}`} className="h-display text-xl underline-offset-4 hover:underline">{l.name}</Link>
                {l.story_hook && <p className="mt-1 text-sm text-white/90">{l.story_hook}</p>}
                <div className="mt-3 [&_span.bg-line]:bg-black/30 [&_span.bg-line]:text-white">
                  <GrowthPath steps={l.growth_path} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm">
            Got a come-up story? <Link href="/add-a-spot" className="font-extrabold underline">Tell us about your spot</Link>.
          </p>
        </section>
      )}

      {trucks.length > 0 && (
        <Section id="trucks" kicker="🚚 On the move" title="Trucks & pop-ups" intro="Live “here today” check-ins from owners are coming soon." href="/trucks-today">
          <ListingRow listings={trucks} />
        </Section>
      )}

      {newest.length > 0 && (
        <Section id="new" kicker="🆕 New on the list" title="Just added" href="/search">
          <ListingRow listings={newest} />
        </Section>
      )}

      <Section id="browse" kicker="Browse" title="By what you're craving" href="/eats" hrefLabel="All categories">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {liveCats.map((c) => (
            <li key={c.slug}>
              <Link href={`/eats/${c.slug}`} className="card flex items-center gap-3 p-4 hover:border-ink">
                <span aria-hidden="true" className="text-3xl">{c.emoji}</span>
                <span>
                  <span className="block font-extrabold leading-tight">{c.name}</span>
                  <span className="text-sm text-muted">{catCounts.get(c.slug)} spots</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {liveAreas.length > 0 && (
        <Section id="areas" kicker="Neighborhoods" title="By part of town">
          <ul className="flex flex-wrap gap-2">
            {liveAreas.map((a) => (
              <li key={a.slug}>
                <Link href={`/area/${a.slug}`} className="chip hover:border-ink">
                  {a.name} <span className="text-muted">{areaCounts.get(a.slug)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <section aria-labelledby="promise" className="mt-14 rounded-3xl border-2 border-ink bg-surface p-6 sm:p-8">
        <h2 id="promise" className="h-display text-2xl">The rule: no chains.</h2>
        <p className="mt-2 max-w-2xl">
          Every spot here is locally owned. Franchises and out-of-state chains don&apos;t get in. Being listed is free, forever, and
          nobody can pay their way onto this site. <Link href="/about" className="font-extrabold underline">How it works</Link>
        </p>
        <p className="mt-3 text-sm text-muted">
          Own a spot that&apos;s listed? <Link href="/about#owners" className="font-bold underline">Claiming your page is free</Link>.
        </p>
      </section>
    </>
  );
}
