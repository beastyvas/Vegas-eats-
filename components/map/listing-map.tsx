"use client";
import { useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MLMap } from "maplibre-gl";

/**
 * MapLibre GL + OpenFreeMap tiles (free, no key, no usage cap).
 * Privacy: only listings with an exact location (brick-and-mortar) get a pin.
 * Everything else is rolled up into one bubble per AREA ("6 spots in Henderson").
 * The map library is only downloaded once the map scrolls into view.
 */
export type MapListing = {
  slug: string;
  name: string;
  type: string;
  lat: number | null;
  lng: number | null;
  area: { slug: string; name: string; centroid_lat: number; centroid_lng: number } | null;
};

const STYLE = "https://tiles.openfreemap.org/styles/liberty";
const VEGAS: [number, number] = [-115.17, 36.15];

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function ListingMap({ listings, height = "60vh", label = "Map of local spots" }: { listings: MapListing[]; height?: string; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setVisible(true), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !ref.current) return;
    let map: MLMap | undefined;
    let cancelled = false;
    (async () => {
      try {
        const maplibre = await import("maplibre-gl");
        if (cancelled || !ref.current) return;
        const m = new maplibre.Map({ container: ref.current, style: STYLE, center: VEGAS, zoom: 10, attributionControl: { compact: true } });
        map = m;
        m.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");

        const bounds = new maplibre.LngLatBounds();
        const exact = listings.filter((l) => l.lat != null && l.lng != null);
        const byArea = new Map<string, { area: NonNullable<MapListing["area"]>; items: MapListing[] }>();
        for (const l of listings) {
          if (l.lat != null && l.lng != null) continue;
          if (!l.area) continue;
          const g = byArea.get(l.area.slug) ?? { area: l.area, items: [] };
          g.items.push(l);
          byArea.set(l.area.slug, g);
        }

        for (const l of exact) {
          const pin = document.createElement("div");
          pin.className = "h-4 w-4 rounded-full border-2 border-white bg-[#A3231B] shadow";
          const popup = new maplibre.Popup({ offset: 12 }).setHTML(`<a href="/spot/${esc(l.slug)}" style="font-weight:800">${esc(l.name)}</a>`);
          new maplibre.Marker({ element: pin }).setLngLat([l.lng!, l.lat!]).setPopup(popup).addTo(m);
          bounds.extend([l.lng!, l.lat!]);
        }
        for (const { area, items } of byArea.values()) {
          const bubble = document.createElement("button");
          bubble.type = "button";
          bubble.setAttribute("aria-label", `${items.length} spots in ${area.name}`);
          bubble.className = "flex h-9 min-w-9 items-center justify-center rounded-full border-2 border-white bg-[#1F4D3A] px-2 text-sm font-extrabold text-white shadow";
          bubble.textContent = String(items.length);
          const list = items.slice(0, 8).map((i) => `<li><a href="/spot/${esc(i.slug)}">${esc(i.name)}</a></li>`).join("");
          const more = items.length > 8 ? `<li><a href="/area/${esc(area.slug)}">+${items.length - 8} more</a></li>` : "";
          const popup = new maplibre.Popup({ offset: 16 }).setHTML(
            `<p style="font-weight:800;margin:0 0 4px">${esc(area.name)}</p><p style="margin:0 0 6px;font-size:12px">General area only: we never show home addresses.</p><ul style="margin:0;padding-left:16px">${list}${more}</ul>`,
          );
          new maplibre.Marker({ element: bubble }).setLngLat([area.centroid_lng, area.centroid_lat]).setPopup(popup).addTo(m);
          bounds.extend([area.centroid_lng, area.centroid_lat]);
        }
        if (!bounds.isEmpty()) m.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 0 });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [visible, listings]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-line/40" style={{ height }}>
      <div ref={ref} role="region" aria-label={label} className="absolute inset-0" />
      {!visible && <p className="absolute inset-0 flex items-center justify-center text-sm font-bold text-muted">Loading map…</p>}
      {failed && <p role="alert" className="absolute inset-0 flex items-center justify-center bg-bg text-sm font-bold text-muted">Map couldn&apos;t load. The list has everything.</p>}
    </div>
  );
}
