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
  growth: ListingType[];       // e.g. ["food_truck","restaurant"] from "Truck -> restaurant"
  dedupe_key: string;
  raw: Record<string, string>;
};

const SYNONYMS: Record<string, string[]> = {
  name: ["name", "business", "business_name", "spot", "spot_name", "seller", "seller_name", "vendor", "restaurant", "brand"],
  type: ["type", "format", "listing_type", "seller_type", "kind", "business_type", "model"],
  categories: ["category", "categories", "cuisine", "cuisines", "food", "food_type", "specialty", "style"],
  area: ["area", "neighborhood", "neighbourhood", "location_where", "where", "part_of_town", "side", "region", "location", "city", "zone"],
  instagram: ["instagram", "ig", "ig_handle", "instagram_handle", "insta"],
  tiktok: ["tiktok", "tik_tok", "tiktok_handle"],
  facebook: ["facebook", "fb"],
  website: ["website", "site", "url", "web", "link", "order_link", "order_url"],
  phone: ["phone", "phone_number", "tel"],
  email: ["email", "e_mail", "contact_email"],
  address: ["address", "street_address", "location_address"],
  how_to_buy: ["how_to_buy", "where_how_to_buy", "how_to_order", "ordering", "order", "buy", "pickup"],
  contact: ["handle_contact", "contact_handle", "contact", "handle", "contact_info"],
  dishes: ["dishes", "what_to_get", "what_they_sell", "what_to_order", "known_for", "signature", "signature_dishes", "must_try", "menu", "menu_highlights", "items"],
  origin: ["story", "origin", "origin_story", "local_owned_note", "about", "description", "bio"],
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

/** Placeholder values that mean "we don't know yet". */
const BLANK = /^(tbd|tba|n\/?a|none|unknown|\?|-+)$/i;

function pick(row: Record<string, string>, key: keyof typeof SYNONYMS): string | null {
  for (const syn of SYNONYMS[key]) {
    const v = row[syn];
    if (v != null && String(v).trim() !== "" && !BLANK.test(String(v).trim())) return String(v).trim();
  }
  return null;
}

const TYPE_RULES: [RegExp, ListingType][] = [
  [/truck|trailer|cart/i, "food_truck"],
  [/pop[\s_-]?up|mobile|farmers?\s*market|stand|event/i, "pop_up"],
  [/home|cottage|kitchen|ig\s*seller|dm\s*to\s*order|instagram\s*seller/i, "home_seller"],
  [/restaurant|brick|storefront|shop|cafe|café|diner|pizzeria|bar\b|deli|butcher|market|location/i, "restaurant"],
];

function inferOne(text: string): ListingType | null {
  const t = text.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["home_seller", "pop_up", "food_truck", "restaurant"].includes(t)) return t as ListingType;
  for (const [re, type] of TYPE_RULES) if (re.test(text)) return type;
  return null;
}

/**
 * "Truck -> restaurant" => restaurant (current stage is the last one).
 * "Trucks + restaurants" => restaurant (brick-and-mortar wins when combined).
 */
export function inferType(text: string | null): ListingType | null {
  if (!text) return null;
  const stages = growthStages(text);
  if (stages.length > 1) return stages[stages.length - 1];
  if (/\+|&|\band\b/.test(text)) {
    const parts = text.split(/\+|&|\band\b/).map(inferOne).filter(Boolean) as ListingType[];
    if (parts.includes("restaurant")) return "restaurant";
    if (parts.length) return parts[0];
  }
  return inferOne(text);
}

/** "Home -> truck -> restaurant" => ["home_seller","food_truck","restaurant"] */
export function growthStages(text: string | null): ListingType[] {
  if (!text || !/->|→|=>/.test(text)) return [];
  return text
    .split(/->|→|=>/)
    .map((p) => inferOne(p))
    .filter((t): t is ListingType => t !== null);
}

/** keyword → category slug */
const CATEGORY_KEYWORDS: [RegExp, string][] = [
  [/bbq|barbe?cue|brisket|smoke/i, "texas-bbq"],
  [/soul|southern|fried chicken|oxtail|catfish/i, "soul-food"],
  [/birria|taco|quesabirria/i, "birria-tacos"],
  [/pizza|slice/i, "pizza"],
  [/mexican|tamale|pupusa(?!s)|elote|mariscos|torta/i, "mexican"],
  [/filipin|lumpia|adobo|ube|pinoy/i, "filipino"],
  [/bak(e|ery|ing)|dessert|cake|cookie|pastr|donut|churro|sweet|pan dulce|cupcake|bread|sourdough|bagel|muffin|croissant|macaron|brownie|treat|crumb|sweet potato pie/i, "bakery-desserts"],
  [/vegan|plant[\s-]?based|vegetarian/i, "vegan"],
  [/caribbean|jamaican|jerk|haitian|trinidad|puerto ric|cuban/i, "caribbean"],
  [/burger|smash/i, "burgers"],
  [/hawai|poke|loco moco|island|samoan|tongan/i, "hawaiian"],
  [/korean|kbbq/i, "korean"],
  [/thai/i, "thai"],
  [/vietnam|\bpho\b|banh mi/i, "vietnamese"],
  [/chinese|dim sum|dumpling|szechuan|sichuan/i, "chinese"],
  [/salvador|pupusas|guatemal|hondur|venezuel|colombi|peruvian|arepa|empanada|latin american|central american/i, "latin-american"],
  [/wing/i, "wings"],
  [/seafood|crawfish|shrimp|crab|fish/i, "seafood"],
  [/breakfast|brunch/i, "breakfast"],
  [/coffee|boba|tea|drink|agua fresca|juice|smoothie/i, "coffee-drinks"],
  [/ethiopian|nigerian|african|ghana/i, "ethiopian-african"],
  [/mediterranean|greek|gyro|falafel|lebanese|middle eastern/i, "mediterranean"],
  [/sandwich|deli|hoagie|cheesesteak/i, "sandwiches"],
  [/late[\s-]?night|street food|snack/i, "snacks-street"],
];

export function matchCategories(text: string | null): string[] {
  if (!text) return [];
  const out = new Set<string>();
  for (const [re, slug] of CATEGORY_KEYWORDS) if (re.test(text)) out.add(slug);
  return [...out];
}

const AREA_KEYWORDS: [RegExp, string][] = [
  [/north\s*(las\s*vegas|lv)|\bnlv\b|\bcraig\b|(las vegas|lv) blvd n\b/i, "north-las-vegas"],
  [/henderson|green valley|anthem|water street/i, "henderson"],
  [/summerlin/i, "summerlin"],
  [/centennial/i, "centennial-hills"],
  [/chinatown|spring mountain/i, "chinatown"],
  [/spring valley/i, "spring-valley"],
  [/downtown|arts district|fremont|dtlv|westside|s main st|rancho dr/i, "downtown-arts-district"],
  [/east\s*(side|las vegas|lv)/i, "east-side"],
  [/south\s*west|southwest|mountain'?s edge|enterprise|rhodes ranch/i, "southwest"],
  [/north\s*west|northwest|lone mountain|\(nw\)|\bnw\b/i, "northwest"],
  [/blue diamond|silverado|s\.? las vegas blvd/i, "southwest"],
  [/rainbow|w\.? sahara|buffalo/i, "spring-valley"],
  [/valley view|sunset rd/i, "paradise-unlv"],
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

  // Free-form "contact/handle" cells: "@handle / me@x.com", "facebook.com/x", "site.com"
  const contact = pick(row, "contact");
  let contactEmail: string | null = null;
  let contactSite: string | null = null;
  if (contact) {
    for (const tok of contact.split(/\s*[,;|]\s*|\s+\/\s+|\s+/).map((t) => t.trim()).filter(Boolean)) {
      if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(tok)) contactEmail ??= tok.toLowerCase();
      else if (/facebook\.com/i.test(tok)) socials.facebook ??= tok.startsWith("http") ? tok : `https://${tok}`;
      else if (/instagram\.com|^@/i.test(tok)) {
        const h = normalizeHandle(tok);
        if (h && !socials.instagram) socials.instagram = h;
      } else if (/tiktok\.com/i.test(tok)) {
        const h = normalizeHandle(tok);
        if (h && !socials.tiktok) socials.tiktok = h;
      } else if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(tok)) contactSite ??= tok;
    }
  }

  let website = pick(row, "website") ?? contactSite;
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

  const categories = matchCategories([catText, typeText, dishes, name].filter(Boolean).join(" "));
  const howToBuy = pick(row, "how_to_buy");
  // A location cell that starts with a street number is an address.
  const address = pick(row, "address") ?? (areaText && /^\d+\s+\S/.test(areaText) ? areaText : null);
  // Notes that only say "Verify"/"check" aren't a story.
  const originDraft = origin && !(NOTE_FLAG.test(origin) && origin.length < 25) ? origin : null;

  return {
    name,
    type:
      inferType(typeText) ??
      inferType([name, catText, origin].filter(Boolean).join(" ")),
    categories: categories.length ? categories : catText ? [catText] : [],
    area: matchArea(areaText) ?? matchArea(address) ?? matchArea(howToBuy) ?? areaText,
    socials,
    how_to_buy: howToBuy,
    phone: pick(row, "phone"),
    email: pick(row, "email") ?? contactEmail,
    website: website && /^https?:\/\//i.test(website) ? website : website ? `https://${website}` : null,
    address,
    source_urls: splitUrls(pick(row, "sources")),
    origin_draft: originDraft,
    growth: growthStages(typeText),
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
