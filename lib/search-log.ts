import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

/** Fire-and-forget: powers "top searches" and "zero-result searches" (gaps to fill) in admin. */
export async function logSearch(query: string | undefined, filters: Record<string, unknown>, resultCount: number) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const q = query?.trim().toLowerCase().slice(0, 120) || null;
    const f = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== false && v !== ""));
    if (!q && !Object.keys(f).length) return;
    await createAdminClient().from("searches").insert({ query: q, filters: f as Json, result_count: resultCount });
  } catch {
    // analytics must never break search
  }
}
