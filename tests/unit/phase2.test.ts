import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { diversify } from "@/lib/diversify";
import { listingJsonLd, JsonLd } from "@/lib/seo/jsonld";
import { categoryTitle } from "@/lib/seo/copy";
import type { ListingDetail } from "@/lib/data/listings";

describe("diversify", () => {
  it("round-robins groups and respects limit", () => {
    const items = ["a1", "a2", "a3", "b1", "c1", "c2"].map((id) => ({ id, g: id[0] }));
    expect(diversify(items, (i) => i.g, 5).map((i) => i.id)).toEqual(["a1", "b1", "c1", "a2", "c2"]);
  });
});

const base: ListingDetail = {
  id: "1", slug: "x", name: "X", type: "home_seller", story_hook: "Hook", what_to_order: null, price_level: 2,
  vouch_local_count: 0, vouch_total_count: 0, heat_score: 0, is_featured: false, license_verified_at: null,
  published_at: null, growth_path: [], lat: 36.1, lng: -115.1,
  area: { slug: "henderson", name: "Henderson", centroid_lat: 36, centroid_lng: -115 },
  categories: [{ slug: "pizza", name: "Pizza", emoji: "🍕" }], photo: null, origin_story: null, how_to_buy: {},
  order_url: null, website: null, phone: null, email: null, show_phone: true, show_email: false,
  street_address: "123 Secret Ln", city: "Las Vegas", zip: "89101", founded_year: null, updated_at: "",
  socials: [], hours: [{ dow: 5, opens: "17:00:00", closes: "22:00:00" }], schedules: [], photos: [],
};

describe("JSON-LD", () => {
  it("never emits an address or geo for home sellers", () => {
    const d = listingJsonLd(base);
    expect(d.address).toBeUndefined();
    expect(d.geo).toBeUndefined();
    expect(d["@type"]).toBe("LocalBusiness");
    expect(d.areaServed).toMatchObject({ name: "Henderson, Las Vegas, NV" });
  });
  it("emits address, geo and hours for restaurants", () => {
    const d = listingJsonLd({ ...base, type: "restaurant" });
    expect(d["@type"]).toBe("Restaurant");
    expect(d.address).toMatchObject({ streetAddress: "123 Secret Ln", addressRegion: "NV" });
    expect(d.geo).toMatchObject({ latitude: 36.1 });
    expect(d.openingHoursSpecification).toEqual([{ "@type": "OpeningHoursSpecification", dayOfWeek: "Friday", opens: "17:00", closes: "22:00" }]);
  });
  it("escapes < so data can't break out of the script tag", () => {
    expect(JsonLd({ data: { x: "</script><script>alert(1)</script>" } }).__html).not.toContain("</script>");
  });
});

describe("SEO copy", () => {
  it("phrases titles like searches", () => {
    expect(categoryTitle("birria-tacos", "Birria & Tacos", "North Las Vegas")).toBe("Best locally owned Birria & Tacos in North Las Vegas");
  });
});
