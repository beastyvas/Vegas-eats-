import { describe, expect, it } from "vitest";
import { formatTime, isOpenAt, localParts } from "@/lib/time/open-now";

// 2026-11-06 is a Friday. Las Vegas is UTC-8 (PST) then.
const at = (iso: string) => new Date(iso);

describe("open now (Las Vegas time)", () => {
  it("reads local day/time", () => {
    expect(localParts(at("2026-11-07T03:30:00Z"))).toEqual({ dow: 5, minutes: 19 * 60 + 30 }); // Fri 7:30pm
  });
  it("same-day hours", () => {
    const hours = [{ dow: 5, opens: "17:00", closes: "22:00" }];
    expect(isOpenAt(hours, at("2026-11-07T03:30:00Z"))).toBe(true); // Fri 7:30pm
    expect(isOpenAt(hours, at("2026-11-07T06:30:00Z"))).toBe(false); // Fri 10:30pm
    expect(isOpenAt(hours, at("2026-11-06T20:00:00Z"))).toBe(false); // Fri noon
  });
  it("overnight hours spill into the next day", () => {
    const hours = [{ dow: 5, opens: "20:00", closes: "02:00" }]; // Fri 8pm - Sat 2am
    expect(isOpenAt(hours, at("2026-11-07T09:30:00Z"))).toBe(true); // Sat 1:30am
    expect(isOpenAt(hours, at("2026-11-07T10:30:00Z"))).toBe(false); // Sat 2:30am
  });
  it("handles DST (summer is UTC-7)", () => {
    const hours = [{ dow: 3, opens: "11:00", closes: "14:00" }]; // Wed
    expect(isOpenAt(hours, at("2026-07-01T18:30:00Z"))).toBe(true); // Wed 11:30am PDT
  });
  it("formats times", () => {
    expect(formatTime("17:00:00")).toBe("5pm");
    expect(formatTime("09:30")).toBe("9:30am");
    expect(formatTime("00:00")).toBe("12am");
  });
});
