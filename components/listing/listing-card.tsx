import Link from "next/link";
import type { ListingCard as Card } from "@/lib/data/listings";
import { ListingPhoto } from "./listing-photo";
import { FeaturedBadge, HeatBadge, LicensedBadge, TypeBadge, VouchLine, priceLabel } from "./badges";
import { GrowthPath } from "./growth-path";

export function ListingCard({ listing, priority = false, rank }: { listing: Card; priority?: boolean; rank?: number }) {
  const meta = [listing.area?.name, listing.categories.slice(0, 2).map((c) => c.name).join(" · "), priceLabel(listing.price_level)]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-surface transition-transform hover:-translate-y-0.5 ${listing.is_featured ? "border-2 border-mustard" : "border-line"}`}>
      <div className="relative">
        <ListingPhoto listing={listing} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" priority={priority} className="aspect-[4/3] w-full" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <TypeBadge type={listing.type} />
          <HeatBadge heat={listing.heat_score} />
        </div>
        {rank != null && (
          <span aria-label={`Rank ${rank}`} className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink font-display text-lg font-bold text-white">
            {rank}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="h-display text-xl leading-tight">
          <Link href={`/spot/${listing.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {listing.name}
          </Link>
        </h3>
        {meta && <p className="text-sm font-semibold text-muted">{meta}</p>}
        {listing.story_hook && <p className="line-clamp-2 text-[0.95rem] leading-snug">{listing.story_hook}</p>}
        <GrowthPath steps={listing.growth_path} />
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-sm">
          <VouchLine locals={listing.vouch_local_count} />
          <span className="flex gap-1.5">
            {listing.is_featured && <FeaturedBadge />}
            {listing.license_verified_at && <LicensedBadge />}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ListingGrid({ listings, ranked = false, priorityCount = 0 }: { listings: Card[]; ranked?: boolean; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((l, i) => (
        <li key={l.id}>
          <ListingCard listing={l} priority={i < priorityCount} rank={ranked ? i + 1 : undefined} />
        </li>
      ))}
    </ul>
  );
}

/** Horizontal scroller for homepage rows on mobile. */
export function ListingRow({ listings, priorityCount = 0 }: { listings: Card[]; priorityCount?: number }) {
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
      {listings.map((l, i) => (
        <li key={l.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
          <ListingCard listing={l} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
