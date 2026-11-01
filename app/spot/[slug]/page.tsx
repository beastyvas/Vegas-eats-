import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing, listListings, type ListingDetail } from "@/lib/data/listings";
import { LISTING_TYPE_LABELS } from "@/config/app";
import { ListingPhoto } from "@/components/listing/listing-photo";
import { HeatBadge, LicensedBadge, TypeBadge, priceLabel } from "@/components/listing/badges";
import { GrowthPath } from "@/components/listing/growth-path";
import { ListingGrid } from "@/components/listing/listing-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/ui/json-ld";
import { breadcrumbJsonLd, listingJsonLd } from "@/lib/seo/jsonld";
import { HOW_TO_BUY_KEYS, HOW_TO_BUY_LABELS } from "@/lib/listings/form";
import { DAY_NAMES, formatTime } from "@/lib/time/open-now";
import { OpenNow } from "@/components/listing/open-now";
import { PhoneLink, ViewBeacon } from "@/components/listing/track";
import { directionsUrl, goHref, type LinkKind } from "@/lib/links";

export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const l = await getListing(slug);
  if (!l) return { title: "Not found", robots: { index: false } };
  const cat = l.categories[0]?.name;
  const where = l.area?.name ?? "Las Vegas";
  const title = `${l.name}${cat ? `: ${cat}` : ""} in ${where}`;
  const description = [l.story_hook, l.what_to_order && `What to get: ${l.what_to_order}`, `Locally owned ${LISTING_TYPE_LABELS[l.type].toLowerCase()} in ${where}, Las Vegas.`]
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);
  return { title, description, alternates: { canonical: `/spot/${slug}` }, openGraph: { title, description, type: "website" } };
}

const SOCIAL_LABEL: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", x: "X", youtube: "YouTube", yelp: "Yelp", google: "Google", website: "Website", other: "Link" };

export default async function SpotPage({ params }: P) {
  const { slug } = await params;
  const l = await getListing(slug);
  if (!l) notFound();

  const primary = l.categories[0];
  const more = primary
    ? (await listListings({ category: primary.slug, limit: 4, excludeIds: [l.id] })).slice(0, 3)
    : [];
  const htb = l.how_to_buy;
  const htbFlags = HOW_TO_BUY_KEYS.filter((k) => htb[k]);
  const ig = l.socials.find((s) => s.platform === "instagram");
  const isBrick = l.type === "restaurant" && !!l.street_address;
  const crumbs = [
    { name: "Home", path: "/" },
    ...(primary ? [{ name: primary.name, path: `/eats/${primary.slug}` }] : []),
    { name: l.name, path: `/spot/${l.slug}` },
  ];

  // Outbound links go through /go/<id>/<kind> so owners can see how many people tapped them.
  const actions: { kind: LinkKind; label: string; primary?: boolean }[] = [];
  if (l.order_url) actions.push({ kind: "order", label: "Order online", primary: true });
  if (ig) actions.push({ kind: "instagram", label: htb.dm ? `DM @${ig.handle} to order` : `@${ig.handle} on Instagram`, primary: !l.order_url });
  if (isBrick) actions.push({ kind: "directions", label: "Directions" });
  if (l.website) actions.push({ kind: "website", label: "Website" });
  for (const s of l.socials) {
    if (s.platform === "tiktok" || s.platform === "facebook") actions.push({ kind: s.platform, label: SOCIAL_LABEL[s.platform] });
  }

  return (
    <>
      <ViewBeacon listingId={l.id} />
      <JsonLd data={listingJsonLd(l)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Breadcrumbs crumbs={crumbs} />

      <article className="mt-4">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:items-start">
          <div className="relative overflow-hidden rounded-3xl border-2 border-ink">
            <ListingPhoto listing={l} sizes="(min-width: 1024px) 55vw, 100vw" priority className="aspect-[4/3] w-full" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <TypeBadge type={l.type} />
              <HeatBadge heat={l.heat_score} />
            </div>
          </div>

          <div>
            <h1 className="h-display text-4xl leading-[1.05] sm:text-5xl">{l.name}</h1>
            <p className="mt-2 font-bold text-muted">
              {[l.area?.name ?? "Las Vegas", ...l.categories.map((c) => c.name), priceLabel(l.price_level)].filter(Boolean).join(" · ")}
            </p>
            {l.story_hook && <p className="mt-4 text-xl font-semibold leading-snug">“{l.story_hook}”</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {l.license_verified_at && <LicensedBadge />}
              <GrowthPath steps={l.growth_path} size="lg" />
            </div>
            <p className="mt-4 rounded-2xl bg-surface p-3 text-sm font-bold">
              {l.vouch_local_count > 0 ? <>🤝 Vouched by {l.vouch_local_count} local{l.vouch_local_count === 1 ? "" : "s"}</> : <>🤝 No vouches yet. Locals will be able to vouch soon.</>}
            </p>
            {(actions.length > 0 || l.phone) && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {actions.map((a) => (
                  <li key={a.kind}>
                    <a href={goHref(l.id, a.kind)} target="_blank" rel="noopener nofollow" className={a.primary ? "btn-primary" : "btn-secondary"}>
                      {a.label}
                    </a>
                  </li>
                ))}
                {l.phone && (
                  <li><PhoneLink listingId={l.id} phone={l.phone} className="btn-secondary">Call {l.phone}</PhoneLink></li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="space-y-6">
            {l.what_to_order && (
              <section aria-labelledby="get" className="rounded-3xl bg-mustard p-6">
                <h2 id="get" className="h-display text-2xl">What to get</h2>
                <p className="mt-2 text-lg font-semibold">{l.what_to_order}</p>
              </section>
            )}
            <section aria-labelledby="story" className="card p-6">
              <h2 id="story" className="h-display text-2xl">The story</h2>
              {l.origin_story ? (
                <div className="mt-2 space-y-3 text-lg">{l.origin_story.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>
              ) : (
                <p className="mt-2 text-muted">
                  The full story isn&apos;t written yet.{" "}
                  {!l.claimed_at && <Link href={`/spot/${l.slug}/claim`} className="font-bold text-ink underline">Own {l.name}? Claim the page and tell it.</Link>}
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <section aria-labelledby="buy" className="card p-5">
              <h2 id="buy" className="h-display text-xl">How to buy</h2>
              {htbFlags.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {htbFlags.map((k) => <li key={k} className="chip">{HOW_TO_BUY_LABELS[k]}</li>)}
                </ul>
              )}
              {typeof htb.notes === "string" && <p className="mt-2">{htb.notes}</p>}
              {!htbFlags.length && !htb.notes && <p className="mt-2 text-muted">Check their socials for how to order.</p>}
            </section>

            <section aria-labelledby="where" className="card p-5">
              <h2 id="where" className="h-display text-xl">Where</h2>
              {isBrick ? (
                <>
                  <p className="mt-2 font-semibold">{l.street_address}{l.city ? `, ${l.city}` : ""}</p>
                  <a href={goHref(l.id, "directions")} target="_blank" rel="noopener nofollow" className="mt-2 inline-block font-bold underline">Get directions →</a>
                </>
              ) : (
                <>
                  <p className="mt-2 font-semibold">{l.area ? <Link href={`/area/${l.area.slug}`} className="underline">{l.area.name}</Link> : "Las Vegas Valley"}</p>
                  {l.type === "home_seller" && (
                    <p className="mt-1 text-sm text-muted">Home kitchen: we never publish home addresses. Pickup details come from the seller when you order.</p>
                  )}
                </>
              )}
            </section>

            <section aria-labelledby="when" className="card p-5">
              <h2 id="when" className="h-display text-xl">When</h2>
              {l.hours.length > 0 ? (
                <>
                  <OpenNow hours={l.hours} />
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                    {l.hours.map((h, i) => (
                      <div key={i} className="contents">
                        <dt className="font-bold">{DAY_NAMES[h.dow]}</dt>
                        <dd>{formatTime(h.opens)}–{formatTime(h.closes)}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : l.schedules.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {l.schedules.map((s, i) => (
                    <li key={i}><strong>{DAY_NAMES[s.dow]}s</strong> {formatTime(s.starts)}–{formatTime(s.ends)} at {s.location_name}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-muted">Hours aren&apos;t posted yet. Check {ig ? <a className="underline" href={goHref(l.id, "instagram")} target="_blank" rel="noopener nofollow">@{ig.handle}</a> : "their socials"} before you go.</p>
              )}
            </section>

            {l.claimed_at ? (
              <p className="rounded-3xl bg-green p-5 text-sm font-bold text-white">
                <span aria-hidden="true">✓</span> Owner-verified page: the owner keeps this info up to date.
              </p>
            ) : (
              <section aria-labelledby="own" className="rounded-3xl border-2 border-dashed border-ink p-5">
                <h2 id="own" className="h-display text-xl">Is this your spot?</h2>
                <p className="mt-1 text-sm">Claim it free to add photos, your story, hours, and “here today” updates, and see how many locals check you out.</p>
                <Link href={`/spot/${l.slug}/claim`} className="btn-secondary mt-3">Claim this page</Link>
              </section>
            )}
          </aside>
        </div>
      </article>

      {more.length > 0 && primary && (
        <section aria-labelledby="more" className="mt-14">
          <div className="mb-4 flex items-end justify-between">
            <h2 id="more" className="h-display text-2xl">More local {primary.name.toLowerCase()}</h2>
            <Link href={`/eats/${primary.slug}`} className="text-sm font-extrabold underline">See all →</Link>
          </div>
          <ListingGrid listings={more} />
        </section>
      )}

      <p className="mt-10 text-xs text-muted">
        Info last updated {new Date(l.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" })}.
        Something wrong? <Link href="/add-a-spot" className="underline">Let us know</Link>.
      </p>
    </>
  );
}
