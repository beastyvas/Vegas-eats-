import { z } from "zod";
import { HOW_TO_BUY_KEYS } from "./form";

const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const optUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : null))
  .refine((v) => v === null || /^https?:\/\/[^\s]+\.[^\s]+/.test(v), "Enter a valid link");
const optInt = (min: number, max: number) =>
  z.string().optional().transform((v) => (v ? Number(v) : null)).refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= max), `Must be ${min}–${max}`);
const handle = z.string().trim().max(60).optional().transform((v) => (v ? v.replace(/^@/, "").replace(/^https?:\/\/(www\.)?(instagram|tiktok)\.com\/@?/i, "").replace(/\/.*$/, "") || null : null))
  .refine((v) => v === null || /^[A-Za-z0-9._-]{1,60}$/.test(v), "Just the handle, like @yourspot");

/** Fields an owner can change directly. Name, type, and address go through an edit request. */
export const ownerFormSchema = z.object({
  story_hook: optText(140),
  origin_story: optText(4000),
  what_to_order: optText(1000),
  order_url: optUrl,
  website: optUrl,
  phone: optText(40),
  email: z.string().trim().optional().transform((v) => v || null).refine((v) => v === null || z.string().email().safeParse(v).success, "Invalid email"),
  price_level: optInt(1, 4),
  founded_year: optInt(1900, 2100),
  area_id: optInt(1, 32767),
  instagram: handle,
  tiktok: handle,
  facebook: optUrl,
  how_to_buy_notes: optText(300),
});

export type HoursInput = { dow: number; opens: string; closes: string };

/** Reads 7 day rows: open_<d>, close_<d>, closed_<d>. Same open & close = invalid. */
export function readHours(fd: FormData): { hours: HoursInput[]; error?: string } {
  const hours: HoursInput[] = [];
  for (let d = 0; d < 7; d++) {
    if (fd.get(`closed_${d}`) === "on") continue;
    const opens = String(fd.get(`open_${d}`) ?? "");
    const closes = String(fd.get(`close_${d}`) ?? "");
    if (!opens && !closes) continue;
    if (!/^\d{2}:\d{2}$/.test(opens) || !/^\d{2}:\d{2}$/.test(closes)) return { hours, error: "Each open day needs an open and close time." };
    if (opens === closes) return { hours, error: "Open and close can't be the same time." };
    hours.push({ dow: d, opens, closes });
  }
  return { hours };
}

export function readOwnerForm(fd: FormData) {
  const obj: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") obj[k] = v;
  const parsed = ownerFormSchema.safeParse(obj);
  const howToBuy: Record<string, boolean | string> = {};
  for (const k of HOW_TO_BUY_KEYS) if (fd.get(`htb_${k}`) === "on") howToBuy[k] = true;
  const categoryIds = fd.getAll("category_ids").map(Number).filter((n) => Number.isInteger(n) && n > 0);
  return { parsed, howToBuy, categoryIds, showPhone: fd.get("show_phone") === "on", showEmail: fd.get("show_email") === "on", ...readHours(fd) };
}
