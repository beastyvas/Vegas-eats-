import { describe, expect, it } from "vitest";
import { slugify, uniqueSlug } from "@/lib/slug";

describe("slugify", () => {
  it("makes clean URL slugs", () => {
    expect(slugify("Birria Bros. (NLV)")).toBe("birria-bros-nlv");
    expect(slugify("Mama's Soul Food & BBQ")).toBe("mamas-soul-food-and-bbq");
    expect(slugify("Panadería La Única")).toBe("panaderia-la-unica");
  });
  it("dedupes with numeric suffixes", () => {
    expect(uniqueSlug("Birria Bros", new Set(["birria-bros", "birria-bros-2"]))).toBe("birria-bros-3");
    expect(uniqueSlug("!!!", new Set())).toBe("spot");
  });
});
