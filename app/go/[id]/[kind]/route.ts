import { NextResponse, after, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { LINK_EVENT, linkTarget, type LinkKind } from "@/lib/links";
import { recordEvent } from "@/lib/analytics";

/** Counted outbound link: /go/<listing id>/<kind> → 302 to the real destination. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id) || !(kind in LINK_EVENT)) return NextResponse.redirect(new URL("/", req.url));
  const { data: l } = await createPublicClient()
    .from("listings")
    .select("id, slug, name, type, order_url, website, street_address, city, listing_socials(platform, url)")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (!l) return NextResponse.redirect(new URL("/", req.url));
  const target = linkTarget({ ...l, socials: l.listing_socials ?? [] }, kind as LinkKind);
  if (!target) return NextResponse.redirect(new URL(`/spot/${l.slug}`, req.url));
  after(() => recordEvent(req, l.id, LINK_EVENT[kind as LinkKind]));
  const res = NextResponse.redirect(target, 302);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}
