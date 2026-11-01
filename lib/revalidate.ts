import "server-only";
import { revalidatePath, revalidateTag, updateTag } from "next/cache";

/** Every cached public-data fetch carries this tag (see lib/supabase/public.ts). */
export const PUBLIC_DATA_TAG = "public-data";

/**
 * Call after ANY change that public pages show.
 * - In Server Actions (owner/admin edits): updateTag → read-your-own-writes; the
 *   next visit blocks for fresh data instead of serving the stale page.
 * - In Route Handlers (cron): updateTag isn't allowed, so expire the tag at once.
 * Then mark every page under the root layout for re-render.
 */
export function refreshPublicPages() {
  try {
    updateTag(PUBLIC_DATA_TAG);
  } catch {
    revalidateTag(PUBLIC_DATA_TAG, { expire: 0 });
  }
  revalidatePath("/", "layout");
}
