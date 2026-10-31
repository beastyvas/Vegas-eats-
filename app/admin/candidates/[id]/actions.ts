"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { readListingForm, socialRows } from "@/lib/listings/form";
import { slugify, uniqueSlug } from "@/lib/slug";
import type { Json } from "@/lib/database.types";

/** e.g. ["food_truck","restaurant"] -> [{stage:"food_truck", year:2019}, {stage:"restaurant"}] */
function buildGrowthPath(stages: string[], current: string, foundedYear: number | null) {
  const path = stages.length ? [...stages] : [current];
  if (path[path.length - 1] !== current) path.push(current);
  return path.map((stage, i) => (i === 0 && foundedYear ? { stage, year: foundedYear } : { stage }));
}

export type ApproveState = { error?: string; fieldErrors?: Record<string, string> };

async function nextCandidateUrl(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], excludeId: string) {
  const { data } = await supabase
    .from("candidates")
    .select("id")
    .eq("status", "new")
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? `/admin/candidates/${data.id}` : "/admin/candidates";
}

export async function approveCandidate(candidateId: string, _prev: ApproveState, fd: FormData): Promise<ApproveState> {
  const { supabase, user } = await requireAdmin();
  const { parsed, howToBuy, categoryIds } = readListingForm(fd);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Fix the highlighted fields.", fieldErrors };
  }
  const f = parsed.data;
  if (!categoryIds.length) return { error: "Pick at least one category.", fieldErrors: { category_ids: "Required" } };
  const publish = fd.get("intent") !== "draft";

  const { data: cand } = await supabase.from("candidates").select("id, status, growth").eq("id", candidateId).single();
  if (!cand || cand.status !== "new") return { error: "This candidate was already reviewed." };

  const base = f.slug ?? slugify(f.name);
  const { data: taken } = await supabase.from("listings").select("slug").like("slug", `${base}%`);
  const slug = f.slug && !(taken ?? []).some((t) => t.slug === f.slug) ? f.slug : uniqueSlug(base, new Set((taken ?? []).map((t) => t.slug)));

  if (f.how_to_buy_notes) howToBuy.notes = f.how_to_buy_notes;

  const { data: listing, error } = await supabase
    .from("listings")
    .insert({
      slug,
      name: f.name,
      type: f.type,
      status: publish ? "published" : "draft",
      area_id: f.area_id,
      price_level: f.price_level,
      founded_year: f.founded_year,
      story_hook: f.story_hook,
      origin_story: f.origin_story,
      what_to_order: f.what_to_order,
      how_to_buy: howToBuy as Json,
      order_url: f.order_url,
      website: f.website,
      phone: f.phone,
      email: f.email,
      street_address: f.street_address,
      city: f.city,
      zip: f.zip,
      growth_path: buildGrowthPath(cand.growth, f.type, f.founded_year) as Json,
      last_seen_active_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();
  if (error || !listing) return { error: error?.message ?? "Could not create listing." };

  const results = await Promise.all([
    supabase.from("listing_categories").insert(categoryIds.map((category_id) => ({ listing_id: listing.id, category_id }))),
    (() => {
      const rows = socialRows(listing.id, f);
      return rows.length ? supabase.from("listing_socials").insert(rows) : Promise.resolve({ error: null });
    })(),
    supabase
      .from("candidates")
      .update({ status: "approved", listing_id: listing.id, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
      .eq("id", candidateId),
    supabase
      .from("chain_checks")
      .update({ admin_decision: "local", decided_by: user.id, decided_at: new Date().toISOString() })
      .eq("candidate_id", candidateId),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: `Listing created (${listing.slug}) but a follow-up step failed: ${failed.error.message}` };

  revalidatePath("/", "layout");
  redirect(await nextCandidateUrl(supabase, candidateId));
}

export async function rejectCandidate(candidateId: string, fd: FormData) {
  const { supabase, user } = await requireAdmin();
  const asChain = fd.get("intent") === "chain";
  const note = String(fd.get("admin_note") ?? "").slice(0, 1000) || null;
  const now = new Date().toISOString();
  await supabase
    .from("candidates")
    .update({ status: asChain ? "chain" : "rejected", admin_note: note, reviewed_by: user.id, reviewed_at: now })
    .eq("id", candidateId)
    .eq("status", "new");
  if (asChain) {
    const { data: existing } = await supabase.from("chain_checks").select("id").eq("candidate_id", candidateId).limit(1);
    if (existing?.length) {
      await supabase.from("chain_checks").update({ admin_decision: "chain", decided_by: user.id, decided_at: now }).eq("candidate_id", candidateId);
    } else {
      await supabase.from("chain_checks").insert({
        candidate_id: candidateId,
        verdict: "chain",
        admin_decision: "chain",
        reasoning: note ?? "Marked as chain by admin.",
        decided_by: user.id,
        decided_at: now,
      });
    }
  }
  redirect(await nextCandidateUrl(supabase, candidateId));
}

export async function markDuplicate(candidateId: string) {
  const { supabase, user } = await requireAdmin();
  await supabase
    .from("candidates")
    .update({ status: "duplicate", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", candidateId)
    .eq("status", "new");
  redirect(await nextCandidateUrl(supabase, candidateId));
}
