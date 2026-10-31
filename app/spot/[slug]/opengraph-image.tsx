import { ogCard, OG_SIZE } from "@/lib/og";
import { getListing } from "@/lib/data/listings";
import { LISTING_TYPE_LABELS } from "@/config/app";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Local spot";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const l = await getListing(slug);
  if (!l) return ogCard({ kicker: "Las Vegas · locals only", title: "Local spot" });
  return ogCard({
    kicker: `${LISTING_TYPE_LABELS[l.type]} · ${l.area?.name ?? "Las Vegas"}`,
    title: l.name,
    sub: l.story_hook ?? l.what_to_order,
    emoji: l.categories[0]?.emoji,
  });
}
