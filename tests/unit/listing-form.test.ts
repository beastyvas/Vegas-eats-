import { describe, expect, it } from "vitest";
import { listingFormSchema, socialRows } from "@/lib/listings/form";
import { safeNext } from "@/lib/safe-next";

describe("listing form", () => {
  it("strips street address and zip for home sellers", () => {
    const r = listingFormSchema.parse({ name: "Tita's", type: "home_seller", street_address: "123 Secret Ln", zip: "89101" });
    expect(r.street_address).toBeNull();
    expect(r.zip).toBeNull();
  });
  it("keeps address for restaurants and normalizes URLs", () => {
    const r = listingFormSchema.parse({ name: "Spot", type: "restaurant", street_address: "1 Main", website: "spot.com" });
    expect(r.street_address).toBe("1 Main");
    expect(r.website).toBe("https://spot.com");
  });
  it("rejects bad zip and price", () => {
    expect(listingFormSchema.safeParse({ name: "x", type: "restaurant", zip: "8910" }).success).toBe(false);
    expect(listingFormSchema.safeParse({ name: "x", type: "restaurant", price_level: "7" }).success).toBe(false);
  });
  it("builds social rows", () => {
    expect(socialRows("L", { instagram: "@foo", tiktok: null, facebook: null })).toEqual([
      { listing_id: "L", platform: "instagram", handle: "foo", url: "https://www.instagram.com/foo/" },
    ]);
  });
});

describe("safeNext", () => {
  it("only allows relative paths", () => {
    expect(safeNext("/admin")).toBe("/admin");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext(null, "/me")).toBe("/me");
  });
});
