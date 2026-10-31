import { brand } from "@/config/brand";
import { appConfig } from "@/config/app";
import { photoUrl } from "@/lib/photos";
import type { ListingCard, ListingDetail } from "@/lib/data/listings";

const site = () => appConfig.siteUrl.replace(/\/$/, "");
const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** schema.org for a listing. Home sellers get NO street address, only the area served. */
export function listingJsonLd(l: ListingDetail) {
  const url = `${site()}/spot/${l.slug}`;
  const type = l.type === "restaurant" ? "Restaurant" : l.type === "home_seller" ? "LocalBusiness" : "FoodEstablishment";
  const sameAs = [...l.socials.map((s) => s.url), l.website].filter(Boolean);
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    "@id": url,
    name: l.name,
    url,
    description: l.story_hook ?? l.what_to_order ?? undefined,
    servesCuisine: l.categories.map((c) => c.name),
    image: l.photos.length ? l.photos.map((p) => photoUrl(p.storage_path)) : [`${url}/opengraph-image`],
    priceRange: l.price_level ? "$".repeat(l.price_level) : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    telephone: l.phone ?? undefined,
    areaServed: l.area ? { "@type": "Place", name: `${l.area.name}, Las Vegas, NV` } : { "@type": "City", name: "Las Vegas, NV" },
  };
  if (l.type !== "home_seller" && l.street_address) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: l.street_address,
      addressLocality: l.city ?? brand.city,
      addressRegion: brand.region,
      postalCode: l.zip ?? undefined,
      addressCountry: "US",
    };
    if (l.lat != null && l.lng != null) data.geo = { "@type": "GeoCoordinates", latitude: l.lat, longitude: l.lng };
  }
  if (l.hours.length) {
    data.openingHoursSpecification = l.hours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY[h.dow],
      opens: h.opens.slice(0, 5),
      closes: h.closes.slice(0, 5),
    }));
  }
  if (l.order_url) data.hasMenu = l.order_url;
  return data;
}

export function itemListJsonLd(name: string, path: string, items: ListingCard[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: `${site()}${path}`,
    itemListElement: items.slice(0, 50).map((l, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${site()}/spot/${l.slug}`,
      name: l.name,
    })),
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${site()}${c.path}` })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: site(),
    potentialAction: { "@type": "SearchAction", target: `${site()}/search?q={query}`, "query-input": "required name=query" },
  };
}

/** Safe inline JSON-LD (escapes "<" so content can't break out of the script tag). */
export function JsonLd({ data }: { data: unknown }) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
