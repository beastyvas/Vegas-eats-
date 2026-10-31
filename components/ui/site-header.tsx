import Link from "next/link";
import { brand } from "@/config/brand";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-bg/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="h-display text-xl text-ink sm:text-2xl">
          {brand.name}
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm font-bold sm:gap-3">
          <Link href="/eats" className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-line">Eats</Link>
          <Link href="/trucks-today" className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-line">Trucks today</Link>
          <Link href="/me" className="whitespace-nowrap rounded-full px-3 py-2 hover:bg-line">Account</Link>
        </nav>
      </div>
    </header>
  );
}
