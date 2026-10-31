/**
 * The ONE place the brand lives. Swap the name, tagline, domain, and colors
 * here and the whole site (UI, metadata, JSON-LD, OG images, emails) follows.
 */
export const brand = {
  name: "{{BRAND}}",
  shortName: "{{BRAND}}",
  tagline: "No chains. If it's not locally owned, it's not on here.",
  description:
    "The locals-only food directory for Las Vegas: home cooks, pop-ups, food trucks, and locally owned restaurants. Texas BBQ, soul food, birria, pizza, and more, vouched for by people who live here.",
  domain: "example.com",
  city: "Las Vegas",
  region: "NV",
  email: "hello@example.com",
  /** Our IG account: claim codes are DMed *to* this handle by owners. */
  instagram: "@yourbrand",
  colors: {
    background: "#FBF6EC", // warm off-white
    surface: "#FFFDF8",
    ink: "#2A1F14",        // body text (AA on background)
    muted: "#6B5B4B",      // secondary text (AA on background)
    chile: "#A3231B",      // primary accent: chile red
    mustard: "#D9A21B",    // highlight (use with ink text)
    green: "#1F4D3A",      // deep green
    line: "#E8DCC6",       // hairlines / borders
  },
} as const;

export type Brand = typeof brand;
