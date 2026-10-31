import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { LISTING_TYPE_LABELS } from "@/config/app";
import { Constants } from "@/lib/database.types";

type SP = { status?: string; flagged?: string; q?: string };

const VERDICT_STYLE: Record<string, string> = {
  local: "bg-green text-white",
  chain: "bg-chile text-white",
  unsure: "bg-mustard text-ink",
};

export default async function CandidatesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const status = (Constants.public.Enums.candidate_status as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as (typeof Constants.public.Enums.candidate_status)[number])
    : "new";

  let query = supabase
    .from("candidates")
    .select("id, name, type, categories, area, socials, seed_note, source, source_file, created_at, chain_checks(verdict, created_at)")
    .eq("status", status)
    .order("seed_note", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (sp.flagged) query = query.not("seed_note", "is", null);
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);
  const { data: rows, error } = await query;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="h-display text-3xl">Candidates</h1>
        <form className="flex gap-2" role="search">
          <input type="hidden" name="status" value={status} />
          <label htmlFor="q" className="sr-only">Search candidates</label>
          <input id="q" name="q" defaultValue={sp.q} placeholder="Search name" className="input w-48" />
          <button className="btn-secondary" type="submit">Search</button>
        </form>
      </div>
      <nav aria-label="Status" className="mt-4 flex flex-wrap gap-2">
        {Constants.public.Enums.candidate_status.map((s) => (
          <Link key={s} href={`/admin/candidates?status=${s}`} aria-current={s === status ? "page" : undefined}
            className={`chip ${s === status ? "bg-ink text-white" : ""}`}>{s}</Link>
        ))}
        <Link href={`/admin/candidates?status=${status}&flagged=1`} className="chip">only check/verify</Link>
      </nav>
      {error && <p role="alert" className="mt-4 text-chile">{error.message}</p>}
      <p className="mt-4 text-sm text-muted">{rows?.length ?? 0} shown</p>
      <ul className="mt-2 divide-y divide-line card">
        {rows?.map((c) => {
          const latest = [...(c.chain_checks ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
          const ig = (c.socials as Record<string, string>)?.instagram;
          return (
            <li key={c.id}>
              <Link href={`/admin/candidates/${c.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 p-4 hover:bg-bg">
                <span className="font-bold">{c.name}</span>
                {c.type && <span className="chip">{LISTING_TYPE_LABELS[c.type]}</span>}
                {c.area && <span className="text-sm text-muted">{c.area}</span>}
                {ig && <span className="text-sm text-muted">@{ig}</span>}
                {c.categories.length > 0 && <span className="text-sm text-muted">{c.categories.join(", ")}</span>}
                {c.seed_note && <span className="chip border-mustard bg-mustard/30">⚠ {c.seed_note}</span>}
                <span className={`chip ml-auto ${latest ? VERDICT_STYLE[latest.verdict] : ""}`}>
                  {latest ? `chain-check: ${latest.verdict}` : "chain-check pending"}
                </span>
              </Link>
            </li>
          );
        })}
        {rows?.length === 0 && <li className="p-6 text-muted">Nothing here. <Link href="/admin/import" className="underline">Import a CSV</Link>.</li>}
      </ul>
    </div>
  );
}
