import { LISTING_TYPE_LABELS } from "@/config/app";
import type { GrowthStep } from "@/lib/data/listings";

/** "Food truck → Restaurant", only rendered when there's an actual journey (2+ steps). */
export function GrowthPath({ steps, size = "sm" }: { steps: GrowthStep[]; size?: "sm" | "lg" }) {
  if (steps.length < 2) return null;
  const text = size === "lg" ? "text-sm" : "text-xs";
  return (
    <ol aria-label="Growth path" className={`flex flex-wrap items-center gap-1 ${text} font-bold`}>
      {steps.map((s, i) => (
        <li key={i} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true" className="text-chile">→</span>}
          <span className={`rounded-full px-2 py-0.5 ${i === steps.length - 1 ? "bg-green text-white" : "bg-line text-ink"}`}>
            {LISTING_TYPE_LABELS[s.stage] ?? s.stage}
            {s.year ? ` ’${String(s.year).slice(2)}` : ""}
          </span>
        </li>
      ))}
    </ol>
  );
}
