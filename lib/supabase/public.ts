import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const PUBLIC_DATA_TAG = "public-data"; // keep in sync with lib/revalidate.ts

/**
 * Cookie-less anon client for public, cacheable (ISR) pages. RLS restricts it
 * to published data, and because it never touches cookies the page can stay static.
 * Fetches are tagged so admin/owner changes can expire them immediately.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, next: { tags: [PUBLIC_DATA_TAG] } } as RequestInit),
      },
    },
  );
}
