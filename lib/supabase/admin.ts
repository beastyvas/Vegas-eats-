import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

/**
 * Service-role client: BYPASSES RLS. Server-only, used by cron jobs, the
 * analytics beacon/redirects, and webhooks. Never import from client code.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(env.supabaseUrl(), env.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
