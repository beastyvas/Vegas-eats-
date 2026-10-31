import type { Metadata } from "next";
import { listListings } from "@/lib/data/listings";
import { ListingGrid } from "@/components/listing/listing-card";
import { ListingMap } from "@/components/map/listing-map";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Food trucks & pop-ups in Las Vegas",
  description: "Locally owned food trucks and pop-ups around the Las Vegas valley. No chains.",
  alternates: { canonical: "/trucks-today" },
};

export default async function TrucksToday() {
  const listings = await listListings({ types: ["food_truck", "pop_up"], limit: 200 });
  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Home", path: "/" }, { name: "Trucks & pop-ups", path: "/trucks-today" }]} />
      <h1 className="h-display mt-4 text-4xl sm:text-5xl">🚚 Where are the trucks?</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">
        Locally owned trucks and pop-ups. Live “here today” check-ins posted by the owners themselves are coming next.
        Until then, follow their socials for today&apos;s spot.
      </p>
      <div className="mt-6">
        <ListingMap listings={listings.map(({ slug, name, type, lat, lng, area }) => ({ slug, name, type, lat, lng, area }))} height="360px" label="Map of trucks and pop-ups" />
      </div>
      <h2 className="h-display mt-8 text-2xl">All trucks &amp; pop-ups</h2>
      <div className="mt-4"><ListingGrid listings={listings} /></div>
    </>
  );
}
