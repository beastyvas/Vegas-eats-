import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { HOW_TO_BUY_KEYS } from "@/lib/listings/form";
import { ApproveForm, type ApproveDefaults } from "./approve-form";
import { markDuplicate, rejectCandidate } from "./actions";

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: c }, { data: areas }, { data: categories }] = await Promise.all([
    supabase.from("candidates").select("*, chain_checks(*)").eq("id", id).maybeSingle(),
    supabase.from("areas").select("id, name, slug").order("sort"),
    supabase.from("categories").select("id, name, slug").eq("is_active", true).order("sort"),
  ]);
  if (!c) notFound();

  const socials = (c.socials ?? {}) as Record<string, string>;
  const { data: similar } = await supabase
    .from("listings")
    .select("id, name, slug, status")
    .ilike("name", `%${c.name.split(/\s+/).slice(0, 2).join("%")}%`)
    .limit(5);

  const htbText = (c.how_to_buy ?? "").toLowerCase();
  const defaults: ApproveDefaults = {
    name: c.name,
    slug: slugify(c.name),
    type: c.type,
    area_id: areas?.find((a) => a.slug === c.area)?.id ?? null,
    category_ids: (categories ?? []).filter((cat) => c.categories.includes(cat.slug)).map((cat) => cat.id),
    story_hook: "",
    origin_story: c.origin_draft ?? "",
    what_to_order: c.dishes ?? "",
    website: c.website ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    street_address: c.address ?? "",
    instagram: socials.instagram ?? "",
    tiktok: socials.tiktok ?? "",
    how_to_buy: Object.fromEntries(
      HOW_TO_BUY_KEYS.map((k) => [k, htbText.includes(k === "dm" ? "dm" : k.replace("_", "-")) || htbText.includes(k.replace("_", " "))]),
    ),
    how_to_buy_notes: c.how_to_buy ?? "",
  };

  const checks = [...(c.chain_checks ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const reviewed = c.status !== "new";

  return (
    <div>
      <Link href="/admin/candidates" className="text-sm font-bold underline">← All candidates</Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="h-display text-3xl">{c.name}</h1>
        <span className="chip">{c.status}</span>
        {c.seed_note && <span className="chip border-mustard bg-mustard/30">⚠ {c.seed_note}</span>}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <section className="card p-5" aria-labelledby="cc">
            <h2 id="cc" className="h-display text-xl">Chain check</h2>
            {checks.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Queued. The chain-check agent (Phase 6) will fill this in. You make the final call either way.</p>
            ) : (
              checks.map((ch) => (
                <div key={ch.id} className="mt-3 border-t border-line pt-3 text-sm first:border-0 first:pt-0">
                  <p>
                    <strong>Verdict: {ch.verdict}</strong>
                    {ch.admin_decision && <> · your call: <strong>{ch.admin_decision}</strong></>}
                    {ch.is_franchise != null && <> · franchise: {ch.is_franchise ? "yes" : "no"}</>}
                    {ch.out_of_state_locations != null && <> · out-of-state locations: {ch.out_of_state_locations}</>}
                  </p>
                  {ch.reasoning && <p className="mt-1">{ch.reasoning}</p>}
                  {ch.evidence_urls.length > 0 && (
                    <ul className="mt-1 list-disc pl-5">
                      {ch.evidence_urls.map((u) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="break-all underline">{u}</a></li>)}
                    </ul>
                  )}
                </div>
              ))
            )}
          </section>

          <section className="card p-5 text-sm" aria-labelledby="src">
            <h2 id="src" className="h-display text-xl">Source</h2>
            <p className="mt-1 text-muted">{c.source}{c.source_file ? ` · ${c.source_file}` : ""} · added {new Date(c.created_at).toLocaleDateString()}</p>
            {c.source_urls.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {c.source_urls.map((u) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="break-all underline">{u}</a></li>)}
              </ul>
            )}
            {socials.instagram && (
              <p className="mt-2">IG: <a className="underline" href={`https://www.instagram.com/${socials.instagram}/`} target="_blank" rel="noopener noreferrer">@{socials.instagram}</a></p>
            )}
            <details className="mt-3">
              <summary className="cursor-pointer font-bold">Raw row</summary>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                {Object.entries((c.raw ?? {}) as Record<string, string>).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="contents"><dt className="font-bold">{k}</dt><dd className="break-words">{v}</dd></div>
                ))}
              </dl>
            </details>
          </section>

          {similar && similar.length > 0 && (
            <section className="card border-mustard p-5 text-sm" aria-labelledby="sim">
              <h2 id="sim" className="h-display text-xl">Possible existing listings</h2>
              <ul className="mt-2 list-disc pl-5">
                {similar.map((s) => <li key={s.id}>{s.name} <span className="text-muted">/{s.slug} · {s.status}</span></li>)}
              </ul>
            </section>
          )}
        </div>

        <div className="space-y-4">
          {reviewed ? (
            <p className="card p-5">Already reviewed ({c.status}).{c.admin_note ? ` Note: ${c.admin_note}` : ""}</p>
          ) : (
            <>
              <ApproveForm candidateId={c.id} defaults={defaults} areas={areas ?? []} categories={categories ?? []} />
              <form action={rejectCandidate.bind(null, c.id)} className="card space-y-3 p-5">
                <h2 className="h-display text-xl">Not listing it</h2>
                <label htmlFor="admin_note" className="label">Note (optional)</label>
                <input id="admin_note" name="admin_note" className="input" placeholder="e.g. 40+ locations in CA/TX" />
                <div className="flex flex-wrap gap-3">
                  <button type="submit" name="intent" value="chain" className="btn-primary">Mark as chain</button>
                  <button type="submit" name="intent" value="reject" className="btn-secondary">Reject</button>
                  <button type="submit" formAction={markDuplicate.bind(null, c.id)} className="btn-ghost">Duplicate</button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
