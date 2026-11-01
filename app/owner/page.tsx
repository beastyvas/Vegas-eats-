import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function OwnerHome() {
  const { supabase, user } = await requireUser("/owner");
  const [{ data: owned }, { data: claims }] = await Promise.all([
    supabase.from("listing_owners").select("listing_id, listings(id, name, slug, type)").eq("user_id", user.id),
    supabase.from("claims").select("id, status, method, created_at, listings(name, slug)").eq("user_id", user.id).neq("status", "approved").order("created_at", { ascending: false }),
  ]);
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="h-display text-4xl">Your spots</h1>
      {owned && owned.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {owned.map((o) => o.listings && (
            <li key={o.listing_id}>
              <Link href={`/owner/${o.listing_id}`} className="card flex items-center justify-between p-5 hover:border-ink">
                <span className="h-display text-xl">{o.listings.name}</span>
                <span className="font-bold">Dashboard →</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-6 p-6">
          <p className="font-bold">You haven&apos;t claimed a spot yet.</p>
          <p className="mt-1 text-muted">Find your spot, open its page, and tap <strong>Claim this page</strong>. Not listed? <Link href="/add-a-spot" className="font-bold text-ink underline">Add it</Link>.</p>
          <form action="/search" className="mt-4 flex gap-2"><label htmlFor="q" className="sr-only">Find your spot</label><input id="q" name="q" className="input" placeholder="Your spot's name" /><button className="btn-primary">Find</button></form>
        </div>
      )}
      {claims && claims.length > 0 && (
        <section aria-labelledby="claims" className="mt-8">
          <h2 id="claims" className="h-display text-2xl">Claims</h2>
          <ul className="mt-3 space-y-2">
            {claims.map((c) => (
              <li key={c.id} className="card flex flex-wrap justify-between gap-2 p-4 text-sm">
                <span><strong>{c.listings?.name}</strong> · {c.method === "ig_code" ? "Instagram DM" : c.method === "email_code" ? "Email code" : "Manual review"}</span>
                <span className={c.status === "rejected" ? "font-bold text-chile" : "font-bold"}>{c.status === "pending" ? "In review" : "Not approved"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
