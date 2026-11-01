"use client";
import { useActionState, useState } from "react";
import { saveListing, type FormState } from "../actions";
import { HOW_TO_BUY_KEYS, HOW_TO_BUY_LABELS } from "@/lib/listings/form";
import { DAY_NAMES } from "@/lib/time/open-now";

export type EditDefaults = {
  story_hook: string; origin_story: string; what_to_order: string; order_url: string; website: string;
  phone: string; email: string; show_phone: boolean; show_email: boolean; price_level: string; founded_year: string;
  area_id: string; instagram: string; tiktok: string; facebook: string; how_to_buy: Record<string, boolean | string>;
  category_ids: number[]; hours: { dow: number; opens: string; closes: string }[];
};

function F({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-muted">{hint}</p>}
      {error && <p className="mt-1 text-sm font-bold text-chile">{error}</p>}
    </div>
  );
}

export function EditForm({ listingId, isHome, d, areas, categories }: { listingId: string; isHome: boolean; d: EditDefaults; areas: { id: number; name: string }[]; categories: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveListing.bind(null, listingId), {});
  const fe = state.fieldErrors ?? {};
  const [hook, setHook] = useState(d.story_hook);
  const hoursByDay = new Map(d.hours.map((h) => [h.dow, h]));

  return (
    <form action={action} className="space-y-8">
      <section className="card space-y-4 p-5" aria-labelledby="s-story">
        <h2 id="s-story" className="h-display text-2xl">Your story</h2>
        <F id="story_hook" label="One-line hook (shows on every card)" hint={`${hook.length}/140. Make it you: “Started selling birria out of my garage in 2019.”`} error={fe.story_hook}>
          <input id="story_hook" name="story_hook" maxLength={140} value={hook} onChange={(e) => setHook(e.target.value)} className="input" />
        </F>
        <F id="origin_story" label="The full story" hint="How you started, who's in the kitchen, whose recipes. Locals love this part." error={fe.origin_story}>
          <textarea id="origin_story" name="origin_story" rows={7} maxLength={4000} defaultValue={d.origin_story} className="input" />
        </F>
        <F id="what_to_order" label="What should people get?" error={fe.what_to_order}>
          <textarea id="what_to_order" name="what_to_order" rows={2} maxLength={1000} defaultValue={d.what_to_order} className="input" />
        </F>
      </section>

      <section className="card space-y-4 p-5" aria-labelledby="s-buy">
        <h2 id="s-buy" className="h-display text-2xl">How to buy</h2>
        <fieldset>
          <legend className="sr-only">Ways to buy</legend>
          <div className="flex flex-wrap gap-4">
            {HOW_TO_BUY_KEYS.map((k) => (
              <label key={k} className="flex items-center gap-2 font-semibold">
                <input type="checkbox" name={`htb_${k}`} defaultChecked={!!d.how_to_buy[k]} className="h-5 w-5" /> {HOW_TO_BUY_LABELS[k]}
              </label>
            ))}
          </div>
        </fieldset>
        <F id="how_to_buy_notes" label="Details" hint="e.g. “DM by Thursday for Saturday pickup.”" error={fe.how_to_buy_notes}>
          <input id="how_to_buy_notes" name="how_to_buy_notes" maxLength={300} defaultValue={typeof d.how_to_buy.notes === "string" ? d.how_to_buy.notes : ""} className="input" />
        </F>
        <div className="grid gap-4 sm:grid-cols-2">
          <F id="order_url" label="Online ordering link" error={fe.order_url}><input id="order_url" name="order_url" defaultValue={d.order_url} className="input" placeholder="https://" /></F>
          <F id="website" label="Website" error={fe.website}><input id="website" name="website" defaultValue={d.website} className="input" /></F>
          <F id="instagram" label="Instagram" error={fe.instagram}><input id="instagram" name="instagram" defaultValue={d.instagram} className="input" placeholder="@yourspot" /></F>
          <F id="tiktok" label="TikTok" error={fe.tiktok}><input id="tiktok" name="tiktok" defaultValue={d.tiktok} className="input" /></F>
          <F id="facebook" label="Facebook page link" error={fe.facebook}><input id="facebook" name="facebook" defaultValue={d.facebook} className="input" /></F>
          <F id="price_level" label="Price" error={fe.price_level}>
            <select id="price_level" name="price_level" defaultValue={d.price_level} className="input">
              <option value="">Not set</option><option value="1">$</option><option value="2">$$</option><option value="3">$$$</option><option value="4">$$$$</option>
            </select>
          </F>
          <F id="phone" label="Phone" error={fe.phone}><input id="phone" name="phone" type="tel" defaultValue={d.phone} className="input" /></F>
          <F id="email" label="Email" error={fe.email}><input id="email" name="email" type="email" defaultValue={d.email} className="input" /></F>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="show_phone" defaultChecked={d.show_phone} className="h-5 w-5" /> Show phone publicly</label>
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="show_email" defaultChecked={d.show_email} className="h-5 w-5" /> Show email publicly</label>
        </div>
      </section>

      <section className="card space-y-4 p-5" aria-labelledby="s-where">
        <h2 id="s-where" className="h-display text-2xl">Where & when</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <F id="area_id" label="Part of town" hint={isHome ? "Only the general area shows. We never publish home addresses." : undefined} error={fe.area_id}>
            <select id="area_id" name="area_id" defaultValue={d.area_id} className="input">
              <option value="">Not set</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </F>
          <F id="founded_year" label="Year you started" error={fe.founded_year}><input id="founded_year" name="founded_year" inputMode="numeric" defaultValue={d.founded_year} className="input" /></F>
        </div>
        <fieldset>
          <legend className="label">Hours <span className="font-normal text-muted">(leave a day blank or tick Closed. Late nights past midnight are fine.)</span></legend>
          <div className="space-y-2">
            {DAY_NAMES.map((name, dow) => {
              const h = hoursByDay.get(dow);
              return (
                <div key={dow} className="grid grid-cols-[6.5rem_1fr_1fr_auto] items-center gap-2">
                  <span className="font-bold">{name}</span>
                  <label className="sr-only" htmlFor={`open_${dow}`}>{name} opens</label>
                  <input id={`open_${dow}`} name={`open_${dow}`} type="time" defaultValue={h?.opens.slice(0, 5)} className="input" />
                  <label className="sr-only" htmlFor={`close_${dow}`}>{name} closes</label>
                  <input id={`close_${dow}`} name={`close_${dow}`} type="time" defaultValue={h?.closes.slice(0, 5)} className="input" />
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" name={`closed_${dow}`} className="h-4 w-4" /> Closed</label>
                </div>
              );
            })}
          </div>
          {fe.hours && <p className="mt-1 text-sm font-bold text-chile">{fe.hours}</p>}
        </fieldset>
      </section>

      <section className="card space-y-3 p-5" aria-labelledby="s-cats">
        <h2 id="s-cats" className="h-display text-2xl">Categories {fe.category_ids && <span className="text-base text-chile">(pick at least one)</span>}</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c.id} className="chip cursor-pointer has-[:checked]:bg-green has-[:checked]:text-white">
              <input type="checkbox" name="category_ids" value={c.id} defaultChecked={d.category_ids.includes(c.id)} className="sr-only" />
              {c.name}
            </label>
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-line bg-bg/95 px-4 py-3">
        <button type="submit" disabled={pending} className="btn-primary">{pending ? "Saving…" : "Save changes"}</button>
        {state.ok && <p role="status" className="font-bold text-green">Saved. Your page is updated.</p>}
        {state.error && <p role="alert" className="font-bold text-chile">{state.error}</p>}
      </div>
    </form>
  );
}
