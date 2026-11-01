import Link from "next/link";
import { requireOwner } from "@/lib/owner";
import { EditForm } from "./edit-form";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, listing: l } = await requireOwner(id);
  const [{ data: areas }, { data: categories }] = await Promise.all([
    supabase.from("areas").select("id, name").order("sort"),
    supabase.from("categories").select("id, name").eq("is_active", true).order("sort"),
  ]);
  const social = (p: string) => l.listing_socials?.find((s) => s.platform === p);
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/owner/${id}`} className="text-sm font-bold underline">← Dashboard</Link>
      <h1 className="h-display mt-3 text-4xl">Edit {l.name}</h1>
      <p className="mt-1 text-muted">Changes go live right away. To change the name, type, or address, use the request form on your dashboard.</p>
      <div className="mt-6">
        <EditForm
          listingId={id}
          isHome={l.type === "home_seller"}
          areas={areas ?? []}
          categories={categories ?? []}
          d={{
            story_hook: l.story_hook ?? "", origin_story: l.origin_story ?? "", what_to_order: l.what_to_order ?? "",
            order_url: l.order_url ?? "", website: l.website ?? "", phone: l.phone ?? "", email: l.email ?? "",
            show_phone: l.show_phone, show_email: l.show_email, price_level: l.price_level ? String(l.price_level) : "",
            founded_year: l.founded_year ? String(l.founded_year) : "", area_id: l.area_id ? String(l.area_id) : "",
            instagram: social("instagram")?.handle ?? "", tiktok: social("tiktok")?.handle ?? "", facebook: social("facebook")?.url ?? "",
            how_to_buy: (l.how_to_buy as Record<string, boolean | string>) ?? {},
            category_ids: (l.listing_categories ?? []).map((c) => c.category_id),
            hours: l.listing_hours ?? [],
          }}
        />
      </div>
    </div>
  );
}
