/**
 * Turns arbitrary CSV rows (seed files, admin uploads) into candidate rows.
 * Header matching is tolerant: we lowercase/snake-case headers and match
 * against synonym lists, and keep the untouched row in `raw`.
 */
import type { ListingType } from "@/config/app";

export type CandidateDraft = {
  name: string;
  type: ListingType | null;
  categories: string[];        // matched category slugs (or raw text if unmatched)
  area: string | null;         // matched area slug, else raw text
  socials: Record<string, string>;
  how_to_buy: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  source_urls: string[];
  origin_draft: string | null;
  dishes: string | null;
  seed_note: string | null;
  dedupe_key: string;
  raw: Record<string, string>;
};

const SYNONYMS: Record<string, string[]> = {
  name: ["name", "business", "business_name", "spot", "spot_name", "seller", "seller_name", "vendor", "restaurant", "brand"],
  type: ["type", "listing_type", "seller_type", "format", "kind", "business_type", "model"],
  categories: ["category", "categories", "cuisine", "cuisines", "food", "food_type", "specialty", "style"],
  area: ["area", "neighborhood", "neighbourhood", "part_of_town", "side", "region", "location", "city", "zone"],
  instagram: ["instagram", "ig", "ig_handle", "instagram_handle", "insta"],
  tiktok: ["tiktok", "tik_tok", "tiktok_handle"],
  facebook: ["facebook", "fb"],
  website: ["website", "site", "url", "web", "link", "order_link", "order_url"],
  phone: ["phone", "phone_number", "tel"],
  email: ["email", "e_mail", "contact_email"],
  address: ["address", "street_address", "location_address"],
  how_to_buy: ["how_to_buy", "how_to_order", "ordering", "order", "buy", "pickup"],
  dishes: ["dishes", "what_to_order", "known_for", "signature", "signature_dishes", "must_try", "menu", "menu_highlights", "items"],
  origin: ["story", "origin", "origin_story", "about", "description", "bio"],
  sources: ["source", "sources", "source_url", "source_urls", "evidence", "found_via", "reference"],
  notes: ["notes", "note", "status", "flag", "check", "verify", "comments", "chain_check"],
};

export function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function pick(row: Record<string, string>, key: keyof typeof SYNONYMS): string | null {
  for (const syn of SYNONYMS[key]) {
    const v = row[syn];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

const TYPE_RULES: [RegExp, ListingType][] = [
  [/truck|trailer|cart/i, "food_truck"],
  [/pop[\s_-]?up|market|stand|event/i, "pop_up"],
  [/home|cottage|baker(?!y\s*(shop|cafe))|kitchen|ig\s*seller|dm\s*to\s*order|instagram\s*seller/i, "home_seller"],
  [/restaurant|brick|storefront|shop|cafe|café|diner|location/i, "restaurant"],
];

export function inferType(text: string | null): ListingType | null {
  if (!text) return null;
  const t = text.trim().toLowerCase();
  if (["home_seller", "pop_up", "food_truck", "restaurant"].includes(t)) return t as ListingType;
  for (const [re, type] of TYPE_RULES) if (re.test(text)) return type;
  return null;
}

/** keyword → category slug */
const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/bbq|barbe?cue|brisket|smoke/i, "texas-bbq"],
  [/soul|southern|fried chicken|oxtail|catfish/i, "soul-food"],
  [/birria|taco|quesabirria/i, "birria-tacos"],
  [/pizza|slice/i, "pizza"],
  [/mexican|tamale|pupusa(?!s)|elote|mariscos|torta/i, "mexican"],
  [/filipin|lumpia|adobo|ube|pinoy/i, "filipino"],
  [/bak(e|ery)|dessert|cake|cookie|pastr|donut|churro|sweet|pan dulce|cupcake/i, "bakery-desserts"],
  [/vegan|plant[\s-]?based|vegetarian/i, "vegan"],
  [/caribbean|jamaican|jerk|haitian|trinidad|puerto ric|cuban/i, "caribbean"],
  [/burger|smash/i, "burgers"],
  [/hawai|poke|loco moco|island|samoan|tongan/i, "hawaiian"],
  [/korean|kbbq/i, "korean"],
  [/thai/i, "thai"],
  [/vietnam|pho|banh mi/i, "vietnamese"],
  [/chinese|dim sum|dumpling|szechuan|sichuan/i, "chinese"],
  [/salvador|pupusas|guatemal|hondur|central american/i, "central-american"],
  [/wing/i, "wings"],
  [/seafood|crawfish|shrimp|crab|fish/i, "seafood"],
  [/breakfast|brunch/i, "breakfast"],
  [/coffee|boba|tea|drink|agua fresca|juice|smoothie/i, "coffee-drinks"],
  [/ethiopian|nigerian|african|ghana/i, "ethiopian-african"],
  [/mediterranean|greek|gyro|falafel|lebanese|middle eastern/i, "mediterranean"],
  [/sandwich|deli|hoagie|cheesesteak/i, "sandwiches"],
];

export function matchCategories(text: string | null): string[] {
  if (!text) return [];
  const out = new Set<string>();
  for (const [re, slug] of CATEGORY_KEYWORDS) if (re.test(text)) out.add(slug);
  return [...out];
}

const AREA_KEYWORDS: [RegExp, string][] = [
  [/north\s*(las\s*vegas|lv)|\bnlv\b/i, "north-las-vegas"],
  [/henderson|green valley|anthem|water street/i, "henderson"],
  [/summerlin/i, "summerlin"],
  [/centennial/i, "centennial-hills"],
  [/chinatown|spring mountain/i, "chinatown"],
  [/spring valley/i, "spring-valley"],
  [/downtown|arts district|fremont|dtlv/i, "downtown-arts-district"],
  [/east\s*(side|las vegas|lv)/i, "east-side"],
  [/south\s*west|southwest|mountain'?s edge|enterprise|rhodes ranch/i, "southwest"],
  [/north\s*west|northwest|lone mountain/i, "northwest"],
  [/unlv|paradise|maryland p/i, "paradise-unlv"],
];

export function matchArea(text: string | null): string | null {
  if (!text) return null;
  for (const [re, slug] of AREA_KEYWORDS) if (re.test(text)) return slug;
  return null;
}

const NAME_NOISE = /\b(the|llc|inc|co|company|las vegas|lv|vegas|nv)\b/g;

/** Stable key for dedupe: lowercase alnum name without noise words. */
export function dedupeKey(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(NAME_NOISE, " ")
    .replace(/[^a-z0-9]+/g, "");
}

/** "@Birria_Bros", "instagram.com/birria_bros/" -> "birria_bros" */
export function normalizeHandle(v: string | null | undefined): string | null {
  if (!v) return null;
  const s = v.trim();
  const m = s.match(/(?:instagram\.com|tiktok\.com\/@?|facebook\.com)\/([A-Za-z0-9._-]+)/i);
  const h = (m ? m[1] : s).replace(/^@/, "").replace(/\/+$/, "").toLowerCase();
  return /^[a-z0-9._-]{1,60}$/.test(h) ? h : null;
}

function splitUrls(v: string | null): string[] {
  if (!v) return [];
  return v
    .split(/[\s,;|]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

const NOTE_FLAG = /\b(check|verify|chain\??|unsure|confirm)\b/i;

export function rowToCandidate(input: Record<string, unknown>): CandidateDraft | null {
  const row: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) row[normalizeHeader(k)] = v == null ? "" : String(v).trim();

  const name = pick(row, "name");
  if (!name) return null;

  const typeText = pick(row, "type");
  const catText = pick(row, "categories");
  const areaText = pick(row, "area");
  const dishes = pick(row, "dishes");
  const origin = pick(row, "origin");

  const socials: Record<string, string> = {};
  const ig = normalizeHandle(pick(row, "instagram"));
  if (ig) socials.instagram = ig;
  const tt = normalizeHandle(pick(row, "tiktok"));
  if (tt) socials.tiktok = tt;
  const fb = pick(row, "facebook");
  if (fb) socials.facebook = fb;

  let website = pick(row, "website");
  if (website && /instagram\.com/i.test(website)) {
    const h = normalizeHandle(website);
    if (h && !socials.instagram) socials.instagram = h;
    website = null;
  }

  // seed_note: explicit notes column, plus any cell that says check/verify
  const notes = new Set<string>();
  const explicit = pick(row, "notes");
  if (explicit) notes.add(explicit);
  for (const v of Object.values(row)) if (v && NOTE_FLAG.test(v) && v.length < 200) notes.add(v);

  const categories = matchCategories([catText, dishes, name].filter(Boolean).join(" "));
  const howToBuy = pick(row, "how_to_buy");

  return {
    name,
    type:
      inferType(typeText) ??
      inferType(howToBuy) ??
      inferType([name, catText, origin].filter(Boolean).join(" ")),
    categories: categories.length ? categories : catText ? [catText] : [],
    area: matchArea(areaText) ?? matchArea(pick(row, "address")) ?? areaText,
    socials,
    how_to_buy: howToBuy,
    phone: pick(row, "phone"),
    email: pick(row, "email"),
    website: website && /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : null,
    address: pick(row, "address"),
    source_urls: splitUrls(pick(row, "sources")),
    origin_draft: origin,
    dishes,
    seed_note: notes.size ? [...notes].join(" · ") : null,
    dedupe_key: dedupeKey(name),
    raw: row,
  };
}

/**
 * Splits drafts into new vs duplicates, comparing against existing
 * (dedupe_key, instagram) pairs from listings + candidates, and within the batch.
 */
export function dedupeDrafts(
  drafts: CandidateDraft[],
  existing: { dedupe_key: string; instagram?: string | null }[],
): { fresh: CandidateDraft[]; duplicates: CandidateDraft[] } {
  const keys = new Set(existing.map((e) => e.dedupe_key).filter(Boolean));
  const handles = new Set(existing.map((e) => e.instagram).filter(Boolean) as string[]);
  const fresh: CandidateDraft[] = [];
  const duplicates: CandidateDraft[] = [];
  for (const d of drafts) {
    const ig = d.socials.instagram;
    if (keys.has(d.dedupe_key) || (ig && handles.has(ig))) {
      duplicates.push(d);
      continue;
    }
    keys.add(d.dedupe_key);
    if (ig) handles.add(ig);
    fresh.push(d);
  }
  return { fresh, duplicates };
}
