import "server-only";
import { NextResponse, type NextRequest } from "next/server";

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. Returns a 401 response if it doesn't match. */
export function rejectUnlessCron(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
