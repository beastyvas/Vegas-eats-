"use client";
import { useActionState, useState } from "react";
import { approveCandidate, type ApproveState } from "./actions";
import { LISTING_TYPES, LISTING_TYPE_LABELS, type ListingType } from "@/config/app";
import { HOW_TO_BUY_KEYS, HOW_TO_BUY_LABELS } from "@/lib/listings/form";

export type ApproveDefaults = {
  name: string;
  slug: string;
  type: ListingType | null;
  area_id: number | null;
  category_ids: number[];
  story_hook: string;
  origin_story: string;
  what_to_order: string;
  website: string;
  phone: string;
  email: string;
  street_address: string;
  instagram: string;
  tiktok: string;
  how_to_buy: Partial<Record<(typeof HOW_TO_BUY_KEYS)[number], boolean>>;
  how_to_buy_notes: string;
};

type Opt = { id: number; name: string };

function Field({ name, label, error, children }: { name: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      {children}
      {error && <p id={`${name}-err`} className="mt-1 text-sm font-bold text-chile">{error}</p>}
    </div>
  );
}

export function ApproveForm({ candidateId, defaults, areas, categories }: { candidateId: string; defaults: ApproveDefaults; areas: Opt[]; categories: Opt[] }) {
  const [state, action, pending] = useActionState<ApproveState, FormData>(approveCandidate.bind(null, candidateId), {});
  const [type, setType] = useState<ListingType | "">(defaults.type ?? "");
  const fe = state.fieldErrors ?? {};
  const err = (k: string) => (fe[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});

  return (
    <form action={action} className="card space-y-4 p-5">
      <h2 className="h-display text-xl">Edit &amp; approve</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Name" error={fe.name}>
          <input id="name" name="name" required defaultValue={defaults.name} className="input" {...err("name")} />
        </Field>
        <Field name="slug" label="URL slug (/spot/…)" error={fe.slug}>
          <input id="slug" name="slug" defaultValue={defaults.slug} className="input" {...err("slug")} />
        </Field>
        <Field name="type" label="Type" error={fe.type}>
          <select id="type" name="type" required value={type} onChange={(e) => setType(e.target.value as ListingType)} className="input" {...err("type")}>
            <option value="" disabled>Choose…</option>
            {LISTING_TYPES.map((t) => <option key={t} value={t}>{LISTING_TYPE_LABELS[t]}</option>)}
          </select>
        </Field>
        <Field name="area_id" label="Area" error={fe.area_id}>
          <select id="area_id" name="area_id" defaultValue={defaults.area_id ?? ""} className="input">
            <option value="">Unknown</option>
            {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="label">Categories {fe.category_ids && <span className="text-chile">(required)</span>}</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c.id} className="chip cursor-pointer has-[:checked]:bg-green has-[:checked]:text-white">
              <input type="checkbox" name="category_ids" value={c.id} defaultChecked={defaults.category_ids.includes(c.id)} className="sr-only" />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <Field name="story_hook" label="Story hook (one line on every card, ≤140)" error={fe.story_hook}>
        <input id="story_hook" name="story_hook" maxLength={140} defaultValue={defaults.story_hook} className="input" placeholder="Started as a backyard pit in 2019…" />
      </Field>
      <Field name="origin_story" label="Origin story" error={fe.origin_story}>
        <textarea id="origin_story" name="origin_story" rows={4} maxLength={4000} defaultValue={defaults.origin_story} className="input" />
      </Field>
      <Field name="what_to_order" label="What to order" error={fe.what_to_order}>
        <textarea id="what_to_order" name="what_to_order" rows={2} maxLength={1000} defaultValue={defaults.what_to_order} className="input" />
      </Field>

      <fieldset>
        <legend className="label">How to buy</legend>
        <div className="flex flex-wrap gap-3">
          {HOW_TO_BUY_KEYS.map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={`htb_${k}`} defaultChecked={!!defaults.how_to_buy[k]} /> {HOW_TO_BUY_LABELS[k]}
            </label>
          ))}
        </div>
        <input aria-label="How to buy notes" name="how_to_buy_notes" maxLength={300} defaultValue={defaults.how_to_buy_notes} className="input mt-2" placeholder="e.g. DM by Thursday for Saturday pickup" />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="instagram" label="Instagram handle" error={fe.instagram}>
          <input id="instagram" name="instagram" defaultValue={defaults.instagram} className="input" placeholder="handle (no @)" />
        </Field>
        <Field name="tiktok" label="TikTok handle" error={fe.tiktok}>
          <input id="tiktok" name="tiktok" defaultValue={defaults.tiktok} className="input" />
        </Field>
        <Field name="website" label="Website" error={fe.website}>
          <input id="website" name="website" defaultValue={defaults.website} className="input" />
        </Field>
        <Field name="order_url" label="Order link" error={fe.order_url}>
          <input id="order_url" name="order_url" className="input" />
        </Field>
        <Field name="phone" label="Phone" error={fe.phone}>
          <input id="phone" name="phone" defaultValue={defaults.phone} className="input" />
        </Field>
        <Field name="email" label="Email (private unless owner opts in)" error={fe.email}>
          <input id="email" name="email" type="email" defaultValue={defaults.email} className="input" />
        </Field>
        <Field name="price_level" label="Price" error={fe.price_level}>
          <select id="price_level" name="price_level" className="input" defaultValue="">
            <option value="">Unknown</option>
            <option value="1">$</option><option value="2">$$</option><option value="3">$$$</option><option value="4">$$$$</option>
          </select>
        </Field>
        <Field name="founded_year" label="Started (year)" error={fe.founded_year}>
          <input id="founded_year" name="founded_year" inputMode="numeric" className="input" placeholder="2019" />
        </Field>
      </div>

      {type && type !== "home_seller" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field name="street_address" label="Street address" error={fe.street_address}>
            <input id="street_address" name="street_address" defaultValue={defaults.street_address} className="input" />
          </Field>
          <Field name="city" label="City" error={fe.city}>
            <input id="city" name="city" defaultValue="Las Vegas" className="input" />
          </Field>
          <Field name="zip" label="Zip" error={fe.zip}>
            <input id="zip" name="zip" inputMode="numeric" className="input" />
          </Field>
        </div>
      ) : type === "home_seller" ? (
        <p className="rounded-xl bg-mustard/25 p-3 text-sm">
          Home seller: <strong>no street address will be stored or shown</strong>. Only the general area.
        </p>
      ) : null}

      {state.error && <p role="alert" className="font-bold text-chile">{state.error}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" name="intent" value="publish" disabled={pending} className="btn-primary">{pending ? "Saving…" : "Approve & publish"}</button>
        <button type="submit" name="intent" value="draft" disabled={pending} className="btn-secondary">Approve as draft</button>
      </div>
    </form>
  );
}
