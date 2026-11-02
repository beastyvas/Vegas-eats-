import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { generateCode, hashCode, normalizeCode } from "@/lib/claims/codes";
import { maskEmail } from "@/lib/email";

describe("claim codes", () => {
  it("are 6 unambiguous characters", () => {
    for (let i = 0; i < 50; i++) expect(generateCode()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });
  it("hash is tied to the claim and forgiving of case/spaces", () => {
    expect(hashCode("c1", "ab3 kq7")).toBe(hashCode("c1", "AB3KQ7"));
    expect(hashCode("c1", "AB3KQ7")).not.toBe(hashCode("c2", "AB3KQ7"));
    expect(normalizeCode(" ab-3k ")).toBe("AB3K");
  });
});

describe("maskEmail", () => {
  it("hides most of the local part", () => {
    expect(maskEmail("bake.bykatelv@gmail.com")).toBe("b••••••••v@gmail.com");
    expect(maskEmail("ab@x.com")).toBe("a•@x.com");
  });
});

import { ownerFormSchema, readHours } from "@/lib/listings/owner-form";

describe("owner form", () => {
  it("normalizes handles and links", () => {
    const r = ownerFormSchema.parse({ instagram: "https://www.instagram.com/birriabros702/", tiktok: "@tt", website: "spot.com" });
    expect(r.instagram).toBe("birriabros702");
    expect(r.tiktok).toBe("tt");
    expect(r.website).toBe("https://spot.com");
  });
  it("reads hours incl. overnight and closed days", () => {
    const fd = new FormData();
    fd.set("open_5", "20:00"); fd.set("close_5", "02:00");
    fd.set("closed_6", "on"); fd.set("open_6", "10:00"); fd.set("close_6", "12:00");
    expect(readHours(fd)).toEqual({ hours: [{ dow: 5, opens: "20:00", closes: "02:00" }] });
    const bad = new FormData(); bad.set("open_1", "10:00");
    expect(readHours(bad).error).toBeTruthy();
  });
});

import { friendlyAuthError } from "@/lib/auth-errors";
describe("friendlyAuthError", () => {
  it("explains PKCE / rate limit errors in plain English", () => {
    expect(friendlyAuthError("PKCE code verifier not found in storage.")).toMatch(/different browser/);
    expect(friendlyAuthError("email rate limit exceeded")).toMatch(/Too many/);
    expect(friendlyAuthError("Something else")).toBe("Something else");
  });
});
