import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { rejectUnlessCron } from "@/lib/cron/auth";
import { appConfig } from "@/config/app";

/** Hourly: recompute "Heating up" scores, then refresh cached pages. */
export async function GET(req: NextRequest) {
  const denied = rejectUnlessCron(req);
  if (denied) return denied;
  const { data, error } = await createAdminClient().rpc("refresh_heat", { p_non_valley_weight: appConfig.vouches.nonValleyWeight });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, listings: data });
}
