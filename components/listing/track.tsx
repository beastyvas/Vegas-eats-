"use client";
import { useEffect } from "react";

function send(listingId: string, kind: "view" | "click_phone") {
  const body = JSON.stringify({ listing_id: listingId, kind });
  try {
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/track", { method: "POST", body, keepalive: true });
    }
  } catch {
    /* ignore */
  }
}

/** Counts a page view without making the (statically cached) page dynamic. */
export function ViewBeacon({ listingId }: { listingId: string }) {
  useEffect(() => send(listingId, "view"), [listingId]);
  return null;
}

export function PhoneLink({ listingId, phone, className, children }: { listingId: string; phone: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} onClick={() => send(listingId, "click_phone")} className={className}>
      {children}
    </a>
  );
}
