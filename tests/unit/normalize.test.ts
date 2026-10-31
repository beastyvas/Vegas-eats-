import { describe, expect, it } from "vitest";
import { dedupeDrafts, dedupeKey, inferType, matchArea, matchCategories, normalizeHandle, rowToCandidate } from "@/lib/candidates/normalize";
import { parseCsv } from "@/lib/candidates/import";

describe("header-tolerant CSV mapping", () => {
  const csv = [
    "Business Name,Type,Cuisine,Neighborhood,IG,How to Order,Known For,Notes,Source",
    'Smokey Joe\'s BBQ,food truck,Texas BBQ,North Las Vegas,@SmokeyJoesLV,DM to order,"Brisket, burnt ends",,https://example.com/a',
    "Big Pizza Co,restaurant,Pizza,Summerlin,https://instagram.com/bigpizza/,walk-in,Pepperoni,check - might be a chain,",
    "Tita's Kitchen,,Filipino lumpia,East Side,titaskitchen,DM,Lumpia,,",
    ",,,,,,,,",
  ].join("\n");
  const rows = parseCsv(csv);
  const drafts = rows.map(rowToCandidate);

  it("maps synonyms and infers fields", () => {
    const a = drafts[0]!;
    expect(a.name).toBe("Smokey Joe's BBQ");
    expect(a.type).toBe("food_truck");
    expect(a.categories).toContain("texas-bbq");
    expect(a.area).toBe("north-las-vegas");
    expect(a.socials.instagram).toBe("smokeyjoeslv");
    expect(a.dishes).toBe("Brisket, burnt ends");
    expect(a.source_urls).toEqual(["https://example.com/a"]);
  });
  it("extracts handles from URLs and surfaces check/verify notes", () => {
    const b = drafts[1]!;
    expect(b.socials.instagram).toBe("bigpizza");
    expect(b.seed_note).toMatch(/check/);
    expect(b.area).toBe("summerlin");
  });
  it("infers home seller from DM ordering when type is blank", () => {
    expect(drafts[2]!.type).toBe("home_seller");
    expect(drafts[2]!.categories).toContain("filipino");
  });
  it("drops blank rows and rows without a name", () => {
    expect(rows).toHaveLength(3);
    expect(rowToCandidate({ name: "", ig: "@x" })).toBeNull();
  });
});

describe("helpers", () => {
  it("dedupeKey ignores punctuation and noise words", () => {
    expect(dedupeKey("The Birria Bros LV")).toBe(dedupeKey("birria bros."));
  });
  it("normalizeHandle", () => {
    expect(normalizeHandle("@Foo.Bar")).toBe("foo.bar");
    expect(normalizeHandle("https://www.instagram.com/foo_bar/")).toBe("foo_bar");
    expect(normalizeHandle("not a handle!")).toBeNull();
  });
  it("inferType / matchArea / matchCategories", () => {
    expect(inferType("Pop-up at farmers market")).toBe("pop_up");
    expect(inferType("cottage baker")).toBe("home_seller");
    expect(matchArea("Green Valley, Henderson")).toBe("henderson");
    expect(matchCategories("quesabirria tacos")).toEqual(["birria-tacos"]);
  });
  it("dedupeDrafts catches existing name, existing IG, and in-batch repeats", () => {
    const mk = (name: string, ig?: string) => rowToCandidate({ name, instagram: ig ?? "" })!;
    const { fresh, duplicates } = dedupeDrafts(
      [mk("Alpha Tacos"), mk("Beta BBQ", "taken_handle"), mk("Gamma Pizza"), mk("gamma pizza")],
      [{ dedupe_key: dedupeKey("Alpha Tacos") }, { dedupe_key: "zzz", instagram: "taken_handle" }],
    );
    expect(fresh.map((d) => d.name)).toEqual(["Gamma Pizza"]);
    expect(duplicates).toHaveLength(3);
  });
});
