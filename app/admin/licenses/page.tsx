import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { decideLicense } from "../queues-actions";

const KIND: Record<string, string> = { cottage_food: "Cottage food", business: "Business license", health_permit: "Health permit", other: "Other" };

export default async function LicensesQueue() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("license_verifications")
    .select("id, license_number, license_kind, created_at, listings(name, slug, type)")
    .eq("status", "pending")
    .order("created_at");
  return (
    <div>
      <h1 className="h-display text-3xl">License verifications</h1>
      <p className="mt-1 text-muted">
        Check the number against Southern Nevada Health District / Clark County / city business license lookups before approving. Approving shows a “Verified licensed” badge.
      </p>
      <ul className="mt-6 space-y-3">
        {(data ?? []).map((v) => (
          <li key={v.id} className="card p-5">
            <p className="flex flex-wrap items-center gap-2">
              <Link prefetch={false} href={`/spot/${v.listings?.slug}`} className="h-display text-xl underline">{v.listings?.name}</Link>
              <span className="chip">{KIND[v.license_kind] ?? v.license_kind}</span>
            </p>
            <p className="mt-2 font-mono text-lg">{v.license_number}</p>
            <form action={decideLicense.bind(null, v.id)} className="mt-3 flex flex-wrap items-end gap-2">
              <div className="flex-1"><label htmlFor={`n-${v.id}`} className="label">Note (optional)</label><input id={`n-${v.id}`} name="admin_note" className="input" /></div>
              <button name="intent" value="approve" className="btn-primary">Verify</button>
              <button name="intent" value="reject" className="btn-ghost text-chile">Reject</button>
            </form>
          </li>
        ))}
        {(data ?? []).length === 0 && <li className="card p-6 text-muted">Nothing to verify.</li>}
      </ul>
    </div>
  );
}
