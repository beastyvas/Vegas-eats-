import Link from "next/link";
import { SearchBox } from "@/components/ui/search-box";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="text-6xl" aria-hidden="true">🌮</p>
      <h1 className="h-display mt-4 text-4xl">That page wandered off</h1>
      <p className="mt-3 text-muted">Maybe it closed, maybe it moved. Search for it, or <Link href="/" className="font-bold text-ink underline">head home</Link>.</p>
      <div className="mt-6"><SearchBox size="md" /></div>
    </div>
  );
}
