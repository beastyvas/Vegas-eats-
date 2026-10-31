"use server";
import { z } from "zod";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { dedupeKey, inferType, matchArea, matchCategories, normalizeHandle } from "@/lib/candidates/normalize";
import type { Json } from "@/lib/database.types";

const schema = z.object({
  name: z.string().trim().min(2, "What's the spot called?").max(120),
  what: z.string().trim().max(500).optional(),
  where: z.string().trim().max(200).optional(),
  instagram: z.string().trim().max(120).optional(),
  link: z.string().trim().max(300).optional(),
  is_owner: z.literal("on").optional(),
  contact: z.string().trim().max(200).optional(),
  website_url: z.string().max(0, "bot").optional(), // honeypot: real people never see this field
});

export type SuggestState = { ok?: boolean; error?: string };

const recent = new Map<string, number[]>();

export async function suggestSpot(_prev: SuggestState, fd: FormData): Promise<SuggestState> {
  const raw = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string" && v !== "")) as Record<string, string>;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return issue.message === "bot" ? { ok: true } : { error: issue.message };
  }
  // Light per-instance rate limit (5 per 10 min per IP).
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 600_000);
  if (hits.length >= 5) return { error: "Thanks! That's a lot of suggestions. Try again in a few minutes." };
  recent.set(ip, [...hits, now]);

  const d = parsed.data;
  const ig = normalizeHandle(d.instagram);
  const text = [d.name, d.what].filter(Boolean).join(" ");
  const sb = createAdminClient();
  const { data, error } = await sb
    .from("candidates")
    .insert({
      source: "suggestion",
      name: d.name,
      type: inferType(text),
      categories: matchCategories(text),
      area: matchArea(d.where ?? null) ?? d.where ?? null,
      socials: (ig ? { instagram: ig } : {}) as Json,
      website: d.link && /^https?:\/\//.test(d.link) ? d.link : null,
      dishes: d.what ?? null,
      dedupe_key: dedupeKey(d.name),
      raw: { ...raw, submitted_at: new Date().toISOString(), is_owner: !!d.is_owner, contact: d.contact ?? null } as unknown as Json,
      seed_note: d.is_owner ? "Submitted by owner" : null,
    })
    .select("id")
    .single();
  if (error) return { error: "Couldn't save that. Please try again." };
  await sb.from("agent_jobs").insert({ agent: "chain_check", payload: { candidate_id: data.id } });
  return { ok: true };
}
