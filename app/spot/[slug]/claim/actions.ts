"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { CODE_TTL_HOURS, MAX_CODE_ATTEMPTS, generateCode, hashCode } from "@/lib/claims/codes";
import { approveClaim } from "@/lib/claims/approve";
import { emailEnabled, maskEmail, sendEmail } from "@/lib/email";
import { brand } from "@/config/brand";

export type ClaimState = {
  error?: string;
  claimId?: string;
  method?: "ig_code" | "email_code" | "manual";
  code?: string;
  maskedEmail?: string;
  submitted?: boolean;
};

export async function startClaim(slug: string, _prev: ClaimState, fd: FormData): Promise<ClaimState> {
  const { supabase, user } = await requireUser(`/spot/${slug}/claim`);
  const method = fd.get("method");
  if (method !== "ig_code" && method !== "email_code" && method !== "manual") return { error: "Pick a way to verify." };
  const evidence = String(fd.get("evidence") ?? "").trim().slice(0, 2000) || null;
  if (method === "manual" && (!evidence || evidence.length < 20)) return { error: "Tell us a bit more so we can verify you (at least a sentence)." };

  const admin = createAdminClient();
  const { data: l } = await admin
    .from("listings")
    .select("id, name, email, listing_socials(platform, handle)")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!l) return { error: "Listing not found." };
  const ig = l.listing_socials?.find((s) => s.platform === "instagram")?.handle;
  if (method === "ig_code" && !ig) return { error: "This listing has no Instagram on file. Pick another option." };
  if (method === "email_code" && (!l.email || !emailEnabled())) return { error: "Email verification isn't available for this listing." };

  // One pending claim per user per listing: reuse it if it exists.
  const { data: existing } = await supabase.from("claims").select("id").eq("listing_id", l.id).eq("user_id", user.id).eq("status", "pending").maybeSingle();
  let claimId = existing?.id;
  if (claimId) {
    await admin.from("claims").update({ method, evidence, contact_note: user.email ?? null }).eq("id", claimId);
  } else {
    const { data: created, error } = await supabase
      .from("claims")
      .insert({ listing_id: l.id, user_id: user.id, method, evidence, contact_note: user.email ?? null })
      .select("id")
      .single();
    if (error || !created) return { error: "Couldn't start the claim. Please try again." };
    claimId = created.id;
  }

  if (method === "manual") {
    await admin.from("claim_codes").delete().eq("claim_id", claimId);
    return { claimId, method, submitted: true };
  }

  const code = generateCode();
  const expires = new Date(Date.now() + CODE_TTL_HOURS[method] * 3600_000).toISOString();
  const { error: codeErr } = await admin.from("claim_codes").upsert({ claim_id: claimId, code_hash: hashCode(claimId, code), attempts: 0, expires_at: expires });
  if (codeErr) return { error: "Couldn't create a code. Please try again." };

  if (method === "email_code") {
    try {
      await sendEmail({
        to: l.email!,
        subject: `Your ${brand.name} verification code: ${code}`,
        text: `Someone (hopefully you) is claiming the ${l.name} page on ${brand.name}.\n\nYour code: ${code}\n\nIt expires in ${CODE_TTL_HOURS.email_code} hours. If this wasn't you, ignore this email.`,
      });
    } catch {
      return { error: "We couldn't send the email. Try another option." };
    }
    return { claimId, method, maskedEmail: maskEmail(l.email!) };
  }
  // ig_code: show the code; the owner DMs it to us FROM the listing's Instagram.
  return { claimId, method, code };
}

export type VerifyState = { error?: string };

export async function verifyEmailCode(claimId: string, _prev: VerifyState, fd: FormData): Promise<VerifyState> {
  const { user } = await requireUser("/owner");
  const admin = createAdminClient();
  const { data: claim } = await admin.from("claims").select("id, user_id, listing_id, method, status").eq("id", claimId).maybeSingle();
  if (!claim || claim.user_id !== user.id || claim.status !== "pending" || claim.method !== "email_code") return { error: "This claim can't be verified." };
  const { data: row } = await admin.from("claim_codes").select("*").eq("claim_id", claimId).maybeSingle();
  if (!row) return { error: "No active code. Request a new one." };
  if (new Date(row.expires_at) < new Date()) return { error: "That code expired. Request a new one." };
  if (row.attempts >= MAX_CODE_ATTEMPTS) return { error: "Too many tries. Request a new code." };
  if (row.code_hash !== hashCode(claimId, String(fd.get("code") ?? ""))) {
    await admin.from("claim_codes").update({ attempts: row.attempts + 1 }).eq("claim_id", claimId);
    return { error: `That code doesn't match. ${MAX_CODE_ATTEMPTS - row.attempts - 1} tries left.` };
  }
  await approveClaim(claimId, null);
  redirect(`/owner/${claim.listing_id}?claimed=1`);
}
