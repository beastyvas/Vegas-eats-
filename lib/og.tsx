import { ImageResponse } from "next/og";
import { brand } from "@/config/brand";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared OG card: warm brand look, big type, readable as a thumbnail. */
export function ogCard({ kicker, title, sub, emoji }: { kicker: string; title: string; sub?: string | null; emoji?: string | null }) {
  const c = brand.colors;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: c.mustard, padding: 48 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", background: c.background, border: `8px solid ${c.ink}`, borderRadius: 40, padding: 56 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", background: c.ink, color: "#fff", fontSize: 28, fontWeight: 800, padding: "10px 22px", borderRadius: 999 }}>{kicker}</div>
            {emoji ? <div style={{ fontSize: 96 }}>{emoji}</div> : null}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: title.length > 28 ? 72 : 92, fontWeight: 800, color: c.ink, lineHeight: 1.02, letterSpacing: -2 }}>{title}</div>
            {sub ? <div style={{ marginTop: 20, fontSize: 34, color: c.muted, lineHeight: 1.25 }}>{sub.length > 110 ? sub.slice(0, 107) + "…" : sub}</div> : null}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, fontWeight: 800 }}>
            <div style={{ color: c.chile }}>{brand.name}</div>
            <div style={{ color: c.ink }}>Locally owned · No chains</div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
