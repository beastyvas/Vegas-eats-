/**
 * App-level knobs. DB-enforced knobs (vouch rate limit, min account age) live
 * in the `app_settings` table so Postgres can enforce them.
 */
export const appConfig = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  timezone: "America/Los_Angeles",

  vouches: {
    /** Vouches from outside the Las Vegas Valley count at this weight in rankings. */
    nonValleyWeight: 0.25,
    /** Flag a listing when it gets this many vouches in 24h from accounts younger than `newAccountDays`. */
    burstThreshold: 8,
    newAccountDays: 7,
  },

  chainRule: {
    /** Franchise, OR this many+ locations outside Nevada => chain. */
    outOfStateLocationThreshold: 3,
  },

  liveness: {
    /** No public activity for this many days => flag as possibly dormant. */
    dormantDays: 60,
  },

  checkins: {
    maxHours: 12,
    defaultHours: 4,
  },

  payments: {
    enabled: process.env.PAYMENTS_ENABLED === "true",
    featuredPriceId: process.env.STRIPE_FEATURED_PRICE_ID ?? "",
    /** Display only; Stripe price is the source of truth. */
    featuredMonthlyDisplay: "$29/mo",
  },
} as const;

export const LISTING_TYPES = ["home_seller", "pop_up", "food_truck", "restaurant"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  home_seller: "Home kitchen",
  pop_up: "Pop-up",
  food_truck: "Food truck",
  restaurant: "Restaurant",
};
