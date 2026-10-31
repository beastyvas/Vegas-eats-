import { brand } from "@/config/brand";

// Phase 1 placeholder. The real homepage (search, trucks today, most vouched,
// new on the list, categories, "Started small") lands in Phase 2.
export default function HomePage() {
  return (
    <section className="py-16 text-center">
      <h1 className="h-display text-4xl sm:text-6xl">{brand.name}</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{brand.tagline}</p>
      <p className="mt-8 text-sm text-muted">The directory opens in Phase 2.</p>
    </section>
  );
}
