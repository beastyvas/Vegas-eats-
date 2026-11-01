"use server";
import { revalidatePath } from "next/cache";
import { refreshPublicPages } from "@/lib/revalidate";
import { redirect } from "next/navigation";
import type { TablesUpdate } from "@/lib/database.types";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveClaim } from "@/lib/claims/approve";
import { hashCode } from "@/lib/claims/codes";
import { geocode } from "@/lib/geo/geocode";

// ---------- Claims ----------
export async function approveClaimAction(claimId: string, fd: FormData) {
  const { user } = await requireAdmin();
  const code = String(fd.get("code") ?? "").trim();
  const admin = createAdminClient();
  const { data: claim } = await admin.from("claims").select("method").eq("id", claimId).single();
  if (claim?.method === "ig_code" && fd.get("override") !== "on") {
    const { data: row } = await admin.from("claim_codes").select("code_hash, expires_at").eq("claim_id", claimId).maybeSingle();
    if (!row || row.code_hash !== hashCode(claimId, code)) {
      redirect(`/admin/claims?error=${encodeURIComponent("Code doesn't match what we issued. Check the DM came from the listing's Instagram.")}`);
    }
  }
  await approveClaim(claimId, user.id);
  revalidatePath("/admin/claims");
}

export async function rejectClaimAction(claimId: string) {
  const { supabase, user } = await requireAdmin();
  await supabase.from("claims").update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", claimId);
  await supabase.from("claim_codes").delete().eq("claim_id", claimId);
  revalidatePath("/admin/claims");
}

// ---------- Edit requests ----------
export async function decideEdit(editId: string, fd: FormData) {
  const { supabase, user } = await requireAdmin();
  const approve = fd.get("intent") === "approve";
  const { data: req } = await supabase.from("edit_requests").select("*, listings(id, slug, type)").eq("id", editId).single();
  if (!req || req.status !== "pending") return;
  if (approve && req.listings) {
    const c = req.changes as Record<string, string>;
    const patch: TablesUpdate<"listings"> = {};
    if (c.name) patch.name = c.name;
    if (c.type) patch.type = c.type as TablesUpdate<"listings">["type"];
    if ("street_address" in c) patch.street_address = c.street_address || null;
    if ("city" in c) patch.city = c.city || null;
    if ("zip" in c) patch.zip = c.zip || null;
    const finalType = patch.type ?? req.listings.type;
    if ("street_address" in patch || "type" in patch) {
      patch.lat = null;
      patch.lng = null;
      if (finalType !== "home_seller" && patch.street_address) {
        const pt = await geocode(String(patch.street_address), String(patch.city ?? "Las Vegas"));
        if (pt.ok) { patch.lat = pt.lat; patch.lng = pt.lng; }
      }
    }
    await supabase.from("listings").update(patch).eq("id", req.listings.id);
    refreshPublicPages();
  }
  await supabase.from("edit_requests").update({ status: approve ? "approved" : "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", editId);
  revalidatePath("/admin/edits");
}

// ---------- Licenses ----------
export async function decideLicense(id: string, fd: FormData) {
  const { supabase, user } = await requireAdmin();
  const approve = fd.get("intent") === "approve";
  const note = String(fd.get("admin_note") ?? "").slice(0, 500) || null;
  const { data: lv } = await supabase.from("license_verifications").select("*").eq("id", id).single();
  if (!lv || lv.status !== "pending") return;
  if (approve) {
    await supabase.from("listings").update({ license_number: lv.license_number, license_verified_at: new Date().toISOString() }).eq("id", lv.listing_id);
    refreshPublicPages();
  }
  await supabase.from("license_verifications").update({ status: approve ? "approved" : "rejected", admin_note: note, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/licenses");
}
