import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
  const [newCands, flaggedCands, published, drafts, queuedJobs] = await Promise.all([
    count(supabase.from("candidates").select("*", { count: "exact", head: true }).eq("status", "new")),
    count(supabase.from("candidates").select("*", { count: "exact", head: true }).eq("status", "new").not("seed_note", "is", null)),
    count(supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "published")),
    count(supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "draft")),
    count(supabase.from("agent_jobs").select("*", { count: "exact", head: true }).eq("status", "queued")),
  ]);
  const stats = [
    { label: "Candidates to review", value: newCands, href: "/admin/candidates" },
    { label: "…marked check/verify", value: flaggedCands, href: "/admin/candidates?flagged=1" },
    { label: "Published listings", value: published },
    { label: "Draft listings", value: drafts },
    { label: "Agent jobs queued", value: queuedJobs },
  ];
  return (
    <div>
      <h1 className="h-display text-3xl">Admin</h1>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <li key={s.label} className="card p-4">
            <p className="text-3xl font-black">{s.value}</p>
            {s.href ? <Link href={s.href} className="text-sm font-bold underline">{s.label}</Link> : <p className="text-sm font-bold">{s.label}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
