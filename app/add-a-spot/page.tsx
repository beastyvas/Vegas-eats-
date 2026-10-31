import type { Metadata } from "next";
import { SuggestForm } from "./suggest-form";

export const metadata: Metadata = {
  title: "Suggest a local spot",
  description: "Know a locally owned food spot in Las Vegas that should be on the list? Tell us.",
  alternates: { canonical: "/add-a-spot" },
};

export default function AddASpot() {
  return (
    <div className="mx-auto max-w-xl py-10">
      <h1 className="h-display text-4xl">Put us on</h1>
      <p className="mt-3 text-lg text-muted">
        Home baker crushing it? Truck with a line every Friday? Tell us. Locally owned only: we double-check every spot isn&apos;t a chain.
      </p>
      <div className="mt-6"><SuggestForm /></div>
    </div>
  );
}
