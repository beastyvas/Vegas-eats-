import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { LISTING_TYPE_LABELS, type ListingType } from "@/config/app";
import { GeocodeButton } from "./geocode-button";

function since(days: number) {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const head = { count: "exact" as const, head: true };
  const [newCands, flaggedCands, claims, edits, licenses, published, owned, ungeocoded, byType, searches, views30] = await Promise.all([
    count(supabase.from("candidates").select("*", head).eq("status", "new")),
    count(supabase.from("candidates").select("*", head).eq("status", "new").not("seed_note", "is", null)),
    count(supabase.from("claims").select("*", head).eq("status", "pending")),
    count(supabase.from("edit_requests").select("*", head).eq("status", "pending")),
    count(supabase.from("license_verifications").select("*", head).eq("status", "pending")),
    count(supabase.from("listings").select("*", head).eq("status", "published")),
    count(supabase.from("listings").select("*", head).not("claimed_at", "is", null)),
    count(supabase.from("listings").select("*", head).eq("type", "restaurant").not("street_address", "is", null).is("lat", null)),
    supabase.from("listings").select("type").eq("status", "published"),
    supabase.from("searches").select("query, result_count").not("query", "is", null).gte("created_at", since(30)).limit(5000),
    count(supabase.from("events").select("*", head).eq("kind", "view").gte("created_at", since(30))),
  ]);

  const typeCounts = new Map<string, number>();
  for (const r of byType.data ?? []) typeCounts.set(r.type, (typeCounts.get(r.type) ?? 0) + 1);
  const top = new Map<string, { n: number; zero: number }>();
  for (const s of searches.data ?? []) {
    const e = top.get(s.query!) ?? { n: 0, zero: 0 };
    e.n++;
    if (s.result_count === 0) e.zero++;
    top.set(s.query!, e);
  }
  const topSearches = [...top.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 10);
  const zeroSearches = [...top.entries()].filter(([, v]) => v.zero > 0).sort((a, b) => b[1].zero - a[1].zero).slice(0, 15);

  const queues = [
    { label: "Candidates to review", value: newCands, href: "/admin/candidates" },
    { label: "…marked check/verify", value: flaggedCands, href: "/admin/candidates?flagged=1" },
    { label: "Claims", value: claims, href: "/admin/claims" },
    { label: "Edit requests", value: edits, href: "/admin/edits" },
    { label: "Licenses to verify", value: licenses, href: "/admin/licenses" },
  ];
  const stats = [
    { label: "Published listings", value: published },
    { label: "Claimed by owners", value: owned },
    { label: "Page views (30d)", value: views30 },
  ];

  return (
    <div>
      <h1 className="h-display text-3xl">Admin</h1>
      <h2 className="mt-6 text-sm font-extrabold uppercase tracking-wider text-muted">Queues</h2>
      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {queues.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className={`card block p-4 hover:border-ink ${s.value > 0 ? "border-2 border-mustard" : ""}`}>
              <p className="text-3xl font-black">{s.value}</p>
              <p className="text-sm font-bold underline">{s.label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-sm font-extrabold uppercase tracking-wider text-muted">Site</h2>
      <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <li key={s.label} className="card p-4"><p className="text-3xl font-black">{s.value}</p><p className="text-sm font-bold">{s.label}</p></li>
        ))}
        {[...typeCounts.entries()].map(([t, n]) => (
          <li key={t} className="card p-4"><p className="text-3xl font-black">{n}</p><p className="text-sm font-bold">{LISTING_TYPE_LABELS[t as ListingType]}</p></li>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="gaps">
          <h2 id="gaps" className="h-display text-xl">Searches with zero results <span className="text-sm font-normal text-muted">(30d): gaps to fill</span></h2>
          {zeroSearches.length ? (
            <ol className="mt-3 space-y-1 text-sm">
              {zeroSearches.map(([q, v]) => <li key={q} className="flex justify-between"><span>“{q}”</span><span className="font-bold">{v.zero}×</span></li>)}
            </ol>
          ) : <p className="mt-2 text-sm text-muted">None yet.</p>}
        </section>
        <section className="card p-5" aria-labelledby="top">
          <h2 id="top" className="h-display text-xl">Top searches <span className="text-sm font-normal text-muted">(30d)</span></h2>
          {topSearches.length ? (
            <ol className="mt-3 space-y-1 text-sm">
              {topSearches.map(([q, v]) => <li key={q} className="flex justify-between"><span>“{q}”</span><span className="font-bold">{v.n}</span></li>)}
            </ol>
          ) : <p className="mt-2 text-sm text-muted">None yet.</p>}
        </section>
      </div>

      <div className="mt-6"><GeocodeButton missing={ungeocoded} /></div>
    </div>
  );
}
