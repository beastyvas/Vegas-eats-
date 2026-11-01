import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailEnabled, maskEmail } from "@/lib/email";
import { brand } from "@/config/brand";
import { ClaimFlow } from "./claim-flow";

export const metadata: Metadata = { title: "Claim your page", robots: { index: false } };

export default async function ClaimPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, user } = await requireUser(`/spot/${slug}/claim`);
  const { data: l } = await createAdminClient()
    .from("listings")
    .select("id, name, email, listing_socials(platform, handle)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!l) notFound();

  const { data: own } = await supabase.from("listing_owners").select("listing_id").eq("listing_id", l.id).eq("user_id", user.id).maybeSingle();
  if (own) redirect(`/owner/${l.id}`);
  const { data: pending } = await supabase.from("claims").select("id, method, created_at").eq("listing_id", l.id).eq("user_id", user.id).eq("status", "pending").maybeSingle();

  const ig = l.listing_socials?.find((s) => s.platform === "instagram")?.handle ?? null;
  return (
    <div className="mx-auto max-w-xl py-10">
      <Link href={`/spot/${slug}`} className="text-sm font-bold underline">← {l.name}</Link>
      <h1 className="h-display mt-3 text-4xl">Claim {l.name}</h1>
      <p className="mt-2 text-muted">Free, forever. Once you&apos;re verified you can add photos, your story, hours, and “here today” updates, and see your stats.</p>
      {pending && (
        <p className="mt-4 rounded-xl bg-mustard/30 p-3 text-sm">
          You already have a claim in review (started {new Date(pending.created_at).toLocaleDateString()}). Starting again replaces it and gives you a fresh code.
        </p>
      )}
      <div className="mt-6">
        <ClaimFlow slug={slug} listingName={l.name} igHandle={ig} maskedEmail={l.email && emailEnabled() ? maskEmail(l.email) : null} ourInstagram={brand.instagram} />
      </div>
    </div>
  );
}
