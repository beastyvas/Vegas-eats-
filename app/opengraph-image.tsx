import { ogCard, OG_SIZE } from "@/lib/og";
import { brand } from "@/config/brand";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = `${brand.name}: locally owned food in Las Vegas`;

export default function Image() {
  return ogCard({ kicker: "Las Vegas · locals only", title: "The food your neighbors actually eat.", sub: brand.tagline });
}
