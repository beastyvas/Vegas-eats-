/** Outbound link targets for a listing (shared by the spot page and the /go redirect). */
export type LinkKind = "order" | "instagram" | "tiktok" | "facebook" | "website" | "directions";

type L = {
  name: string;
  order_url: string | null;
  website: string | null;
  street_address: string | null;
  city: string | null;
  type: string;
  socials: { platform: string; url: string }[];
};

export function directionsUrl(l: Pick<L, "name" | "street_address" | "city">) {
  const q = [l.name, l.street_address, l.city ?? "Las Vegas", "NV"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function linkTarget(l: L, kind: LinkKind): string | null {
  const safe = (u: string | null | undefined) => (u && /^https?:\/\//i.test(u) ? u : null);
  switch (kind) {
    case "order": return safe(l.order_url);
    case "website": return safe(l.website);
    case "instagram":
    case "tiktok":
    case "facebook": return safe(l.socials.find((s) => s.platform === kind)?.url);
    case "directions": return l.type === "restaurant" && l.street_address ? directionsUrl(l) : null;
  }
}

export const LINK_EVENT: Record<LinkKind, "click_order" | "click_instagram" | "click_tiktok" | "click_social" | "click_website" | "click_directions"> = {
  order: "click_order",
  instagram: "click_instagram",
  tiktok: "click_tiktok",
  facebook: "click_social",
  website: "click_website",
  directions: "click_directions",
};

export const goHref = (listingId: string, kind: LinkKind) => `/go/${listingId}/${kind}`;
