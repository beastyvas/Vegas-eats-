"use client";
import { useEffect, useState } from "react";
import { isOpenAt, type HoursRow } from "@/lib/time/open-now";

/** Computed in the browser so statically cached pages stay accurate. */
export function OpenNow({ hours }: { hours: HoursRow[] }) {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const tick = () => setOpen(isOpenAt(hours));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [hours]);
  if (open === null) return <p className="mt-2 h-6" aria-hidden="true" />;
  return (
    <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-extrabold ${open ? "bg-green text-white" : "bg-line text-ink"}`}>
      {open ? "Open now" : "Closed now"}
    </p>
  );
}
