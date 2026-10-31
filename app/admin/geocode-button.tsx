"use client";
import { useActionState } from "react";
import { geocodeMissing, type GeocodeState } from "./actions";

export function GeocodeButton({ missing }: { missing: number }) {
  const [state, action, pending] = useActionState<GeocodeState>(geocodeMissing, {});
  return (
    <form action={action} className="card flex flex-wrap items-center gap-3 p-4">
      <p className="flex-1 text-sm">
        <strong>{missing}</strong> restaurant address{missing === 1 ? "" : "es"} not on the map yet (shown at area level until geocoded).
      </p>
      <button className="btn-secondary" disabled={pending || missing === 0}>{pending ? "Geocoding… (~1/sec)" : "Geocode addresses"}</button>
      {state.done != null && (
        <p role="status" className="w-full text-sm">
          Placed {state.done} on the map.{state.failed?.length ? ` Couldn't find: ${state.failed.join(", ")}. Edit their addresses and retry.` : ""}
        </p>
      )}
      {state.error && <p role="alert" className="w-full text-sm font-bold text-chile">{state.error}</p>}
    </form>
  );
}
