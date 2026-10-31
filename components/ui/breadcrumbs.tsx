import Link from "next/link";

export function Breadcrumbs({ crumbs }: { crumbs: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="pt-4 text-sm font-semibold text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => (
          <li key={c.path} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {i === crumbs.length - 1 ? <span aria-current="page" className="text-ink">{c.name}</span> : <Link href={c.path} className="hover:underline">{c.name}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
