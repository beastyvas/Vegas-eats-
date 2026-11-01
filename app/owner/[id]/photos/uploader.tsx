"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addPhoto } from "../actions";

const MAX = 1600;

/** Resize in the browser → WebP, so uploads are small and fast on cell data. */
async function toWebp(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
  const width = Math.round(bmp.width * scale);
  const height = Math.round(bmp.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.82));
  if (!blob) throw new Error("Couldn't process that image.");
  return { blob, width, height };
}

export function Uploader({ listingId, disabled }: { listingId: string; disabled: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fileRef.current?.files?.[0];
    const alt = String(fd.get("alt") ?? "").trim();
    if (!file) return setError("Choose a photo.");
    if (alt.length < 3) return setError("Describe the photo, e.g. “Quesabirria tacos with consomé”.");
    setBusy(true);
    setError(null);
    try {
      const { blob, width, height } = await toWebp(file);
      const path = `${listingId}/${crypto.randomUUID()}.webp`;
      const { error: upErr } = await createClient().storage.from("listing-photos").upload(path, blob, { contentType: "image/webp", upsert: false });
      if (upErr) throw new Error(upErr.message);
      const res = await addPhoto(listingId, { path, alt, width, height, ownerFace: fd.get("owner_face") === "on" });
      if (res.error) throw new Error(res.error);
      form.reset();
      setPreview(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5">
      <h2 className="h-display text-2xl">Add a photo</h2>
      <div>
        <label htmlFor="photo" className="label">Photo</label>
        <input
          id="photo" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/*" disabled={disabled || busy}
          onChange={(e) => { const f = e.target.files?.[0]; setPreview(f ? URL.createObjectURL(f) : null); }}
          className="block w-full text-sm"
        />
      </div>
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="max-h-56 rounded-xl object-cover" />
      )}
      <div>
        <label htmlFor="alt" className="label">Describe it <span className="font-normal text-muted">(required, read aloud to blind visitors)</span></label>
        <input id="alt" name="alt" maxLength={300} className="input" placeholder="Smoked brisket plate with mac and cheese" disabled={disabled || busy} />
      </div>
      <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="owner_face" className="h-5 w-5" /> This is a photo of me / my team</label>
      {error && <p role="alert" className="font-bold text-chile">{error}</p>}
      <button className="btn-primary" disabled={disabled || busy}>{busy ? "Uploading…" : "Upload"}</button>
    </form>
  );
}
