import Image from "next/image";
import { photoUrl } from "@/lib/photos";
import { CategoryArt } from "./category-art";
import type { ListingCard } from "@/lib/data/listings";

export function ListingPhoto({ listing, sizes, priority = false, className = "" }: { listing: Pick<ListingCard, "photo" | "categories">; sizes: string; priority?: boolean; className?: string }) {
  if (listing.photo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={photoUrl(listing.photo.storage_path)} alt={listing.photo.alt_text} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  const cat = listing.categories[0];
  return <CategoryArt categorySlug={cat?.slug} emoji={cat?.emoji} className={className} />;
}
