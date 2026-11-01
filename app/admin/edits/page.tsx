import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { decideEdit } from "../queues-actions";

export default async function EditsQueue() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("edit_requests")
    .select("id, changes, reason, created_at, listings(name, slug, type, street_address, city, zip)")
    .eq("status", "pending")
    .order("created_at");
  return (
    <div>
      <h1 className="h-display text-3xl">Edit requests</h1>
      <p className="mt-1 text-muted">Name, type, and address changes from owners. Home sellers never get a street address. Approving one clears it automatically.</p>
      <ul className="mt-6 space-y-3">
        {(data ?? []).map((e) => {
          const cur = (e.listings ?? {}) as Record<string, string | null>;
          return (
            <li key={e.id} className="card p-5">
              <Link prefetch={false} href={`/spot/${cur.slug}`} className="h-display text-xl underline">{cur.name}</Link>
              <table className="mt-3 w-full text-sm">
                <thead><tr className="text-left"><th className="pr-3">Field</th><th className="pr-3">Now</th><th>Requested</th></tr></thead>
                <tbody>
                  {Object.entries(e.changes as Record<string, string>).map(([k, v]) => (
                    <tr key={k} className="border-t border-line"><td className="py-1 pr-3 font-bold">{k}</td><td className="pr-3 text-muted">{cur[k] ?? "–"}</td><td>{v || "–"}</td></tr>
                  ))}
                </tbody>
              </table>
              {e.reason && <p className="mt-2 text-sm">“{e.reason}”</p>}
              <form action={decideEdit.bind(null, e.id)} className="mt-3 flex gap-2">
                <button name="intent" value="approve" className="btn-primary">Approve</button>
                <button name="intent" value="reject" className="btn-ghost text-chile">Reject</button>
              </form>
            </li>
          );
        })}
        {(data ?? []).length === 0 && <li className="card p-6 text-muted">No pending edit requests.</li>}
      </ul>
    </div>
  );
}
