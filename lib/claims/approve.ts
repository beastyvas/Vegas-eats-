import "server-only";
import { refreshPublicPages } from "@/lib/revalidate";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Approves a claim: marks it approved, makes the claimant an owner, and flips
 * any outreach for that listing to "claimed". Uses the service role because the
 * email-code path is completed by the claimant, not an admin.
 */
export async function approveClaim(claimId: string, reviewerId: string | null) {
  const sb = createAdminClient();
  const { data: claim, error } = await sb.from("claims").select("id, listing_id, user_id, status").eq("id", claimId).single();
  if (error || !claim) throw new Error("Claim not found");
  if (claim.status !== "pending") throw new Error("Claim already reviewed");
  const now = new Date().toISOString();
  const { error: ownErr } = await sb.from("listing_owners").upsert({ listing_id: claim.listing_id, user_id: claim.user_id, verified_at: now });
  if (ownErr) throw new Error(ownErr.message);
  await sb.from("claims").update({ status: "approved", reviewed_by: reviewerId, reviewed_at: now }).eq("id", claimId);
  await sb.from("claim_codes").delete().eq("claim_id", claimId);
  await sb.from("outreach").update({ status: "claimed" }).eq("listing_id", claim.listing_id).neq("status", "claimed");
  refreshPublicPages();
  return claim;
}
