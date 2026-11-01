import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { approveClaimAction, rejectClaimAction } from "../queues-actions";

const METHOD: Record<string, string> = { ig_code: "Instagram DM code", email_code: "Email code", phone_code: "Phone", manual: "Manual review" };

export default async function ClaimsQueue({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: claims } = await supabase
    .from("claims")
    .select("id, method, evidence, contact_note, created_at, listings(name, slug, listing_socials(platform, handle))")
    .eq("status", "pending")
    .order("created_at");
  return (
    <div>
      <h1 className="h-display text-3xl">Claims</h1>
      <p className="mt-1 text-muted">
        Instagram claims: open your DMs, find the code sent <strong>from the listing&apos;s Instagram</strong>, and type it here. It must match the one we issued.
      </p>
      {error && <p role="alert" className="mt-3 rounded-xl bg-chile/10 p-3 font-bold text-chile">{error}</p>}
      <ul className="mt-6 space-y-3">
        {(claims ?? []).map((c) => {
          const ig = c.listings?.listing_socials?.find((s) => s.platform === "instagram")?.handle;
          return (
            <li key={c.id} className="card p-5">
              <p className="flex flex-wrap items-center gap-2">
                <Link prefetch={false} href={`/spot/${c.listings?.slug}`} className="h-display text-xl underline">{c.listings?.name}</Link>
                <span className="chip">{METHOD[c.method]}</span>
                <span className="text-sm text-muted">by {c.contact_note ?? "unknown"} · {new Date(c.created_at).toLocaleString()}</span>
              </p>
              {c.method === "ig_code" && ig && <p className="mt-1 text-sm">Expect a DM from <strong>@{ig}</strong>.</p>}
              {c.evidence && <p className="mt-2 whitespace-pre-wrap rounded-xl bg-bg p-3 text-sm">{c.evidence}</p>}
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <form action={approveClaimAction.bind(null, c.id)} className="flex flex-wrap items-end gap-2">
                  {c.method === "ig_code" && (
                    <>
                      <div>
                        <label htmlFor={`code-${c.id}`} className="label">Code from DM</label>
                        <input id={`code-${c.id}`} name="code" className="input w-36 font-mono uppercase" />
                      </div>
                      <label className="flex items-center gap-1 pb-2 text-sm"><input type="checkbox" name="override" /> Skip code check</label>
                    </>
                  )}
                  <button className="btn-primary">Approve</button>
                </form>
                <form action={rejectClaimAction.bind(null, c.id)}><button className="btn-ghost text-chile">Reject</button></form>
              </div>
            </li>
          );
        })}
        {(claims ?? []).length === 0 && <li className="card p-6 text-muted">No pending claims.</li>}
      </ul>
    </div>
  );
}
