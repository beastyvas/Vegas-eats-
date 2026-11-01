import { describe, expect, it } from "vitest";
import { cleanAddress, inVegasValley, parseCensus } from "@/lib/geo/parse";

describe("cleanAddress", () => {
  it("drops suites, unit numbers and parentheticals", () => {
    expect(cleanAddress("3720 E Sunset Rd Ste 103")).toBe("3720 E Sunset Rd");
    expect(cleanAddress("1212 S Main St (Arts District)")).toBe("1212 S Main St");
    expect(cleanAddress("1911 Stella Lake Ste 150 (NW)")).toBe("1911 Stella Lake");
    expect(cleanAddress("3700 E Charleston #150")).toBe("3700 E Charleston");
    expect(cleanAddress("450 S Buffalo Dr, Suite 115")).toBe("450 S Buffalo Dr");
    expect(cleanAddress("508 Fremont St")).toBe("508 Fremont St");
  });
});

describe("geo helpers", () => {
  it("bounds the valley", () => {
    expect(inVegasValley({ lat: 36.17, lng: -115.14 })).toBe(true);
    expect(inVegasValley({ lat: 34.05, lng: -118.24 })).toBe(false); // LA
  });
  it("parses Census responses", () => {
    expect(parseCensus({ result: { addressMatches: [{ coordinates: { x: -115.15, y: 36.16 } }] } })).toEqual({ lat: 36.16, lng: -115.15 });
    expect(parseCensus({ result: { addressMatches: [] } })).toBeNull();
    expect(parseCensus(null)).toBeNull();
  });
});
