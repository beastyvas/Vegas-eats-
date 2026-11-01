import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default async function MePage() {
  const { user, profile } = await requireUser("/me");
  return (
    <div className="mx-auto max-w-xl py-10">
      <h1 className="h-display text-3xl">Your account</h1>
      <dl className="card mt-6 divide-y divide-line">
        <div className="flex justify-between p-4"><dt className="font-bold">Email</dt><dd>{user.email}</dd></div>
        <div className="flex justify-between p-4"><dt className="font-bold">Name on vouches</dt><dd>{profile?.display_name ?? "Not set"}</dd></div>
        <div className="flex justify-between p-4">
          <dt className="font-bold">Zip</dt>
          <dd>{profile?.zip ?? "Not set"} {profile?.zip && (profile.is_valley ? "(local ✓)" : "(outside the valley)")}</dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/onboarding?next=/me" className="btn-secondary">Edit profile</Link>
        <Link href="/owner" className="btn-secondary">Your spots</Link>
        {profile?.role === "admin" && <Link href="/admin" className="btn-secondary">Admin</Link>}
        <form action="/auth/signout" method="post">
          <button className="btn-ghost" type="submit">Sign out</button>
        </form>
      </div>
    </div>
  );
}
