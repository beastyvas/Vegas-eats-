import Link from "next/link";
import Image from "next/image";
import { requireOwner } from "@/lib/owner";
import { photoUrl } from "@/lib/photos";
import { deletePhoto, updatePhoto } from "../actions";
import { Uploader } from "./uploader";

export default async function PhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, listing } = await requireOwner(id);
  const { data: photos } = await supabase.from("listing_photos").select("*").eq("listing_id", id).order("sort");
  const list = photos ?? [];
  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/owner/${id}`} className="text-sm font-bold underline">← Dashboard</Link>
      <h1 className="h-display mt-3 text-4xl">Photos</h1>
      <p className="mt-1 text-muted">Real food, big and up front. Faces too: locals love knowing who&apos;s cooking. The first photo is your cover. Up to 12.</p>
      <div className="mt-6"><Uploader listingId={id} disabled={list.length >= 12} /></div>
      {list.length > 0 && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {list.map((p, i) => (
            <li key={p.id} className="card overflow-hidden">
              <div className="relative aspect-[4/3]">
                <Image src={photoUrl(p.storage_path)} alt={p.alt_text} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
                {i === 0 && <span className="absolute left-3 top-3 rounded-full bg-mustard px-3 py-1 text-xs font-extrabold">Cover</span>}
              </div>
              <form action={updatePhoto.bind(null, id, p.id)} className="space-y-2 p-4">
                <label htmlFor={`alt-${p.id}`} className="label">Description</label>
                <input id={`alt-${p.id}`} name="alt" defaultValue={p.alt_text} maxLength={300} className="input" />
                <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="owner_face" defaultChecked={p.is_owner_face} className="h-4 w-4" /> Me / my team</label>
                <div className="flex flex-wrap gap-2">
                  <button name="intent" value="save" className="btn-secondary px-4 py-1.5 text-sm">Save</button>
                  {i > 0 && <button name="intent" value="cover" className="btn-ghost px-4 py-1.5 text-sm">Make cover</button>}
                  <button formAction={deletePhoto.bind(null, id, p.id)} className="btn-ghost px-4 py-1.5 text-sm text-chile">Delete</button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-muted">Viewing <Link prefetch={false} href={`/spot/${listing.slug}`} className="underline">your live page</Link> may take a minute to show new photos.</p>
    </div>
  );
}
