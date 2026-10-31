import { z } from "zod";
import { LISTING_TYPES } from "@/config/app";

const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const optUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : null))
  .refine((v) => v === null || /^https?:\/\/[^\s]+\.[^\s]+/.test(v), "Enter a valid URL");

const optInt = (min: number, max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= max), `Must be between ${min} and ${max}`);

export const HOW_TO_BUY_KEYS = ["pickup", "dm", "walk_in", "delivery", "preorder"] as const;
export const HOW_TO_BUY_LABELS: Record<(typeof HOW_TO_BUY_KEYS)[number], string> = {
  pickup: "Pickup",
  dm: "DM to order",
  walk_in: "Walk-in",
  delivery: "Delivery",
  preorder: "Pre-order",
};

export const listingFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || /^[a-z0-9-]+$/.test(v), "Slug: lowercase letters, numbers, dashes"),
    type: z.enum(LISTING_TYPES),
    area_id: optInt(1, 32767),
    price_level: optInt(1, 4),
    founded_year: optInt(1900, 2100),
    story_hook: optText(140),
    origin_story: optText(4000),
    what_to_order: optText(1000),
    order_url: optUrl,
    website: optUrl,
    phone: optText(40),
    email: z
      .string()
      .trim()
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || z.string().email().safeParse(v).success, "Invalid email"),
    street_address: optText(200),
    city: optText(80),
    zip: z
      .string()
      .trim()
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || /^\d{5}$/.test(v), "Zip must be 5 digits"),
    instagram: optText(60),
    tiktok: optText(60),
    facebook: optUrl,
    how_to_buy_notes: optText(300),
  })
  .transform((v) =>
    // Never keep an exact address for home sellers.
    v.type === "home_seller" ? { ...v, street_address: null, zip: null } : v,
  );

export type ListingForm = z.output<typeof listingFormSchema>;

export function readListingForm(fd: FormData) {
  const obj: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") obj[k] = v;
  const parsed = listingFormSchema.safeParse(obj);
  const howToBuy: Record<string, boolean | string> = {};
  for (const k of HOW_TO_BUY_KEYS) if (fd.get(`htb_${k}`) === "on") howToBuy[k] = true;
  const categoryIds = fd
    .getAll("category_ids")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  return { parsed, howToBuy, categoryIds };
}

export function socialRows(listingId: string, f: Pick<ListingForm, "instagram" | "tiktok" | "facebook">) {
  const rows: { listing_id: string; platform: string; handle: string | null; url: string }[] = [];
  const ig = f.instagram?.replace(/^@/, "").trim();
  if (ig) rows.push({ listing_id: listingId, platform: "instagram", handle: ig, url: `https://www.instagram.com/${ig}/` });
  const tt = f.tiktok?.replace(/^@/, "").trim();
  if (tt) rows.push({ listing_id: listingId, platform: "tiktok", handle: tt, url: `https://www.tiktok.com/@${tt}` });
  if (f.facebook) rows.push({ listing_id: listingId, platform: "facebook", handle: null, url: f.facebook });
  return rows;
}
