import Link from "next/link";
import { brand } from "@/config/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm text-muted sm:grid-cols-2">
        <p>
          <strong className="text-ink">{brand.name}</strong>: {brand.tagline} Listing is always free.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-4 sm:justify-end">
          <Link href="/about" className="underline-offset-4 hover:underline">About</Link>
          <Link href="/add-a-spot" className="underline-offset-4 hover:underline">Suggest a spot</Link>
          <Link href="/owner" className="underline-offset-4 hover:underline">For owners</Link>
        </nav>
      </div>
    </footer>
  );
}
