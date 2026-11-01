import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import { LicenseForm, ChangeRequestForm } from "./small-forms";

type Stat = { kind: string; total: number; uniques: number };

/** ISO timestamp `days` ago (server render: a fresh request every time). */
function since(days: number) {
  return new Date(Date.now() - days * 86400_000).toISOString();
}

function sum(rows: Stat[], kinds: string[], field: "total" | "uniques" = "total") {
  return rows.filter((r) => kinds.includes(r.kind)).reduce((a, r) => a + Number(r[field]), 0);
}

export default async function OwnerDashboard({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ claimed?: string }> }) {
  const { id } = await params;
  const { claimed } = await searchParams;
  const { supabase, listing } = await requireOwner(id);
  const [m, w, w2, lic, edits] = await Promise.all([
    supabase.rpc("listing_stats", { p_listing: id, p_since: since(30) }),
    supabase.rpc("listing_stats", { p_listing: id, p_since: since(7) }),
    supabase.rpc("listing_stats", { p_listing: id, p_since: since(14) }),
    supabase.from("license_verifications").select("status, created_at").eq("listing_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("edit_requests").select("id, status, changes, created_at").eq("listing_id", id).order("created_at", { ascending: false }).limit(5),
  ]);
  const month = (m.data ?? []) as Stat[];
  const week = (w.data ?? []) as Stat[];
  const twoWeeks = (w2.data ?? []) as Stat[];
  const CLICKS = ["click_order", "click_instagram", "click_tiktok", "click_directions", "click_phone", "click_website", "click_social"];
  const viewsWeek = sum(week, ["view"], "uniques");
  const viewsPrev = sum(twoWeeks, ["view"], "uniques") - viewsWeek;
  const trend = viewsPrev > 0 ? Math.round(((viewsWeek - viewsPrev) / viewsPrev) * 100) : null;

  const tiles = [
    { label: "Visitors this month", value: sum(month, ["view"], "uniques") },
    { label: "Taps to Instagram", value: sum(month, ["click_instagram"]) },
    { label: "Taps to order / call / directions", value: sum(month, ["click_order", "click_phone", "click_directions"]) },
    { label: "New vouches", value: sum(month, ["vouch"]) },
  ];
  const latestLicense = lic.data?.[0];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/owner" className="text-sm font-bold underline">← Your spots</Link>
      {claimed && <p role="status" className="mt-4 rounded-xl bg-green p-3 font-bold text-white">You&apos;re verified! This page is yours now.</p>}
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <h1 className="h-display text-4xl">{listing.name}</h1>
        <div className="flex flex-wrap gap-2">
          <Link href={`/owner/${id}/edit`} className="btn-primary">Edit page</Link>
          <Link href={`/owner/${id}/photos`} className="btn-secondary">Photos</Link>
          <Link prefetch={false} href={`/spot/${listing.slug}`} className="btn-ghost">View live →</Link>
        </div>
      </div>

      <section aria-labelledby="scoreboard" className="mt-8">
        <h2 id="scoreboard" className="h-display text-2xl">Your scoreboard <span className="text-base font-normal text-muted">(last 30 days)</span></h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((t) => (
            <li key={t.label} className="card p-4">
              <p className="text-3xl font-black">{t.value}</p>
              <p className="text-sm font-bold text-muted">{t.label}</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          This week: <strong>{viewsWeek}</strong> visitors, <strong>{sum(week, CLICKS)}</strong> taps
          {trend !== null && <> ({trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last week)</>}.
          {listing.heat_score >= 8 && <> <span className="font-bold">🔥 You&apos;re heating up.</span></>}
        </p>
      </section>

      <section aria-labelledby="checklist" className="card mt-8 p-5">
        <h2 id="checklist" className="h-display text-xl">Make your page pop</h2>
        <ul className="mt-2 space-y-1">
          {[
            [!!listing.origin_story, "Tell your story", `/owner/${id}/edit`],
            [!!listing.what_to_order, "Say what to order", `/owner/${id}/edit`],
            [(listing.listing_hours ?? []).length > 0, "Add your hours", `/owner/${id}/edit`],
            [(listing.listing_photos ?? []).length > 0, "Add photos (yours and your food)", `/owner/${id}/photos`],
          ].map(([done, label, href]) => (
            <li key={label as string}>{done ? "✅" : "⬜"} <Link href={href as string} className="underline">{label as string}</Link></li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="license" className="card mt-6 p-5">
        <h2 id="license" className="h-display text-xl">Verified licensed badge</h2>
        {listing.license_verified_at ? (
          <p className="mt-2 font-bold text-green">✓ Verified. Your badge is showing.</p>
        ) : latestLicense?.status === "pending" ? (
          <p className="mt-2">Submitted {new Date(latestLicense.created_at).toLocaleDateString()}. We&apos;re checking it.</p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">Have a cottage food registration, business license, or health permit? Add it and we&apos;ll verify it. Licensed sellers get a badge locals trust.</p>
            <div className="mt-3"><LicenseForm listingId={id} /></div>
          </>
        )}
      </section>

      <section aria-labelledby="changes" className="card mt-6 p-5">
        <h2 id="changes" className="h-display text-xl">Change name, type, or address</h2>
        <p className="mt-1 text-sm text-muted">These go to our team for a quick check so nobody can hijack a listing.</p>
        <div className="mt-3"><ChangeRequestForm listingId={id} current={listing} /></div>
        {(edits.data ?? []).length > 0 && (
          <ul className="mt-4 space-y-1 text-sm">
            {edits.data!.map((e) => <li key={e.id}>{new Date(e.created_at).toLocaleDateString()}: {Object.keys(e.changes as object).join(", ")}: <strong>{e.status}</strong></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
