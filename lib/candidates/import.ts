import Papa from "papaparse";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import { dedupeDrafts, dedupeKey, rowToCandidate, type CandidateDraft } from "./normalize";

export type ImportResult = {
  file: string;
  rows: number;
  inserted: number;
  duplicates: { name: string }[];
  skipped: number;
  chainChecksQueued: number;
};

export function parseCsv(text: string): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
  });
  return parsed.data;
}

/**
 * Imports CSV text as CANDIDATES (never live listings) and queues a
 * chain-check job for each new one. Works with either an admin user's client
 * (RLS: admin) or the service-role client.
 */
export async function importCandidatesCsv(
  supabase: SupabaseClient<Database>,
  csvText: string,
  file: string,
  source: "seed" | "manual" = "seed",
): Promise<ImportResult> {
  const rows = parseCsv(csvText);
  const drafts = rows.map(rowToCandidate).filter((d): d is CandidateDraft => d !== null);

  const [{ data: cands, error: e1 }, { data: listings, error: e2 }, { data: socials, error: e3 }] = await Promise.all([
    supabase.from("candidates").select("dedupe_key, socials"),
    supabase.from("listings").select("id, name"),
    supabase.from("listing_socials").select("listing_id, handle").eq("platform", "instagram"),
  ]);
  if (e1 || e2 || e3) throw new Error((e1 ?? e2 ?? e3)!.message);

  const igByListing = new Map((socials ?? []).map((s) => [s.listing_id, s.handle?.toLowerCase() ?? null]));
  const existing = [
    ...(cands ?? []).map((c) => ({
      dedupe_key: c.dedupe_key,
      instagram: (c.socials as Record<string, string> | null)?.instagram ?? null,
    })),
    ...(listings ?? []).map((l) => ({ dedupe_key: dedupeKey(l.name), instagram: igByListing.get(l.id) ?? null })),
  ];

  const { fresh, duplicates } = dedupeDrafts(drafts, existing);

  let inserted = 0;
  let queued = 0;
  for (let i = 0; i < fresh.length; i += 200) {
    const batch = fresh.slice(i, i + 200).map((d) => ({
      source,
      source_file: file,
      raw: d.raw as unknown as Json,
      name: d.name,
      type: d.type,
      categories: d.categories,
      area: d.area,
      socials: d.socials as unknown as Json,
      how_to_buy: d.how_to_buy,
      phone: d.phone,
      email: d.email,
      website: d.website,
      address: d.address,
      source_urls: d.source_urls,
      origin_draft: d.origin_draft,
      dishes: d.dishes,
      seed_note: d.seed_note,
      dedupe_key: d.dedupe_key,
    }));
    const { data, error } = await supabase.from("candidates").insert(batch).select("id");
    if (error) throw new Error(`Insert failed: ${error.message}`);
    inserted += data.length;

    const jobs = data.map((c) => ({ agent: "chain_check", payload: { candidate_id: c.id } as Json }));
    const { error: jobErr } = await supabase.from("agent_jobs").insert(jobs);
    if (jobErr) throw new Error(`Queueing chain checks failed: ${jobErr.message}`);
    queued += jobs.length;
  }

  return {
    file,
    rows: rows.length,
    inserted,
    duplicates: duplicates.map((d) => ({ name: d.name })),
    skipped: rows.length - drafts.length,
    chainChecksQueued: queued,
  };
}
