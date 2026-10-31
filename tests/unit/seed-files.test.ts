import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/candidates/import";
import { rowToCandidate, type CandidateDraft } from "@/lib/candidates/normalize";

const load = (f: string) => parseCsv(readFileSync(`seed/${f}`, "utf8")).map(rowToCandidate) as CandidateDraft[];
const byName = (rows: CandidateDraft[], n: string) => rows.find((r) => r.name === n)!;

describe("seed/vegas_local_eats_v2.csv", () => {
  const rows = load("vegas_local_eats_v2.csv");
  it("parses every row with a type and a category", () => {
    expect(rows).toHaveLength(43);
    expect(rows.every((r) => r && r.type && r.categories.length > 0)).toBe(true);
  });
  it("reads growth paths and handles", () => {
    const b = byName(rows, "Birria Bros");
    expect(b.type).toBe("restaurant");
    expect(b.growth).toEqual(["food_truck", "restaurant"]);
    expect(b.socials.instagram).toBe("birriabros702");
  });
  it("prefers restaurant for mixed formats and treats TBD as blank", () => {
    expect(byName(rows, "Vito's Tacos").type).toBe("restaurant");
    expect(byName(rows, "Braeswood Barbecue").area).toBeNull();
  });
  it("detects street addresses and check/verify notes", () => {
    expect(byName(rows, "Good Pie").address).toBe("1212 S Main St (Arts District)");
    expect(byName(rows, "LoLo's Chicken and Waffles").seed_note).toMatch(/chain/);
    expect(byName(rows, "Fox Smokehouse BBQ").seed_note).toBe("Verify");
    expect(byName(rows, "Fox Smokehouse BBQ").origin_draft).toBeNull();
  });
});

describe("seed/vegas_local_food_sellers_starter.csv", () => {
  const rows = load("vegas_local_food_sellers_starter.csv");
  it("parses every row", () => {
    expect(rows).toHaveLength(45);
    expect(rows.every((r) => r.type && r.categories.length > 0)).toBe(true);
  });
  it("cottage bakers are home sellers with no address", () => {
    const k = byName(rows, "Bake by Kate LV");
    expect(k.type).toBe("home_seller");
    expect(k.address).toBeNull();
    expect(k.socials.instagram).toBe("bake.bykatelv");
    expect(k.email).toBe("bake.bykatelv@gmail.com");
  });
  it("pop-ups get type, vegan category, and parsed links", () => {
    const v = byName(rows, "La Casa Vegana");
    expect(v.type).toBe("pop_up");
    expect(v.categories).toContain("vegan");
    expect(v.socials.facebook).toBe("https://facebook.com/lacasa.vegana.10");
    expect(byName(rows, "Roll the Veg").website).toBe("https://rolltheveg.com");
    expect(byName(rows, "Crumbphoria").categories).not.toContain("vietnamese");
  });
});
