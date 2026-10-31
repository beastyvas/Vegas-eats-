import { LISTING_TYPE_LABELS } from "@/config/app";
import type { ListingType } from "@/lib/data/listings";

export const HEAT_BADGE_MIN = 8;

const TYPE_ICON: Record<ListingType, string> = { home_seller: "🏠", pop_up: "⛺", food_truck: "🚚", restaurant: "🍽️" };

export function TypeBadge({ type, className = "" }: { type: ListingType; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-extrabold text-ink shadow-sm ${className}`}>
      <span aria-hidden="true">{TYPE_ICON[type]}</span>
      {LISTING_TYPE_LABELS[type]}
    </span>
  );
}

export function HeatBadge({ heat }: { heat: number }) {
  if (heat < HEAT_BADGE_MIN) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-mustard px-2.5 py-1 text-xs font-extrabold text-ink shadow-sm">
      <span aria-hidden="true">🔥</span> Heating up
    </span>
  );
}

export function LicensedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green px-2.5 py-1 text-xs font-extrabold text-white" title="License number verified by our team">
      <span aria-hidden="true">✓</span> Verified licensed
    </span>
  );
}

export function FeaturedBadge() {
  return (
    <span className="inline-flex items-center rounded-full border-2 border-ink bg-surface px-2.5 py-0.5 text-xs font-extrabold text-ink">
      Featured
    </span>
  );
}

export function VouchLine({ locals }: { locals: number }) {
  return locals > 0 ? (
    <span className="font-bold text-ink">
      <span aria-hidden="true">🤝</span> Vouched by {locals} local{locals === 1 ? "" : "s"}
    </span>
  ) : (
    <span className="text-muted">No vouches yet</span>
  );
}

export function priceLabel(level: number | null) {
  return level ? "$".repeat(level) : null;
}
