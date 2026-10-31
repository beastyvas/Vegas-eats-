import Link from "next/link";

export function Section({ id, title, kicker, intro, href, hrefLabel = "See all", children }: {
  id: string; title: string; kicker?: string; intro?: React.ReactNode; href?: string; hrefLabel?: string; children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          {kicker && <p className="text-sm font-extrabold uppercase tracking-wider text-chile">{kicker}</p>}
          <h2 id={id} className="h-display text-2xl sm:text-3xl">{title}</h2>
          {intro && <p className="mt-1 max-w-2xl text-muted">{intro}</p>}
        </div>
        {href && <Link href={href} className="text-sm font-extrabold underline decoration-2 underline-offset-4 hover:text-chile">{hrefLabel} →</Link>}
      </div>
      {children}
    </section>
  );
}
