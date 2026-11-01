import { NextResponse, after, type NextRequest } from "next/server";
import { recordEvent } from "@/lib/analytics";

/** Beacon endpoint for things a redirect can't count: page views and tap-to-call. */
export async function POST(req: NextRequest) {
  let body: { listing_id?: string; kind?: string } = {};
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const { listing_id, kind } = body;
  if (listing_id && /^[0-9a-f-]{36}$/.test(listing_id) && (kind === "view" || kind === "click_phone")) {
    after(() => recordEvent(req, listing_id, kind));
  }
  return new NextResponse(null, { status: 204 });
}
