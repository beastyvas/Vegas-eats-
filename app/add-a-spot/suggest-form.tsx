"use client";
import { useActionState } from "react";
import { suggestSpot, type SuggestState } from "./actions";

export function SuggestForm() {
  const [state, action, pending] = useActionState<SuggestState, FormData>(suggestSpot, {});
  if (state.ok) {
    return (
      <div role="status" className="card p-6">
        <p className="h-display text-2xl">Got it. Thank you! 🙏</p>
        <p className="mt-2">We check every suggestion (and make sure it&apos;s not a chain) before it goes live.</p>
      </div>
    );
  }
  return (
    <form action={action} className="card space-y-4 p-6">
      <div>
        <label htmlFor="name" className="label">Spot name</label>
        <input id="name" name="name" required maxLength={120} className="input" />
      </div>
      <div>
        <label htmlFor="what" className="label">What do they make? What should people get?</label>
        <textarea id="what" name="what" rows={3} maxLength={500} className="input" placeholder="Smoked brisket tacos, the consomé is unreal…" />
      </div>
      <div>
        <label htmlFor="where" className="label">Part of town (no home addresses, please)</label>
        <input id="where" name="where" maxLength={200} className="input" placeholder="North Las Vegas, Henderson, farmers markets…" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="instagram" className="label">Instagram</label>
          <input id="instagram" name="instagram" maxLength={120} className="input" placeholder="@handle" />
        </div>
        <div>
          <label htmlFor="link" className="label">Other link</label>
          <input id="link" name="link" type="url" maxLength={300} className="input" placeholder="https://" />
        </div>
      </div>
      <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="is_owner" className="h-5 w-5" /> This is my spot</label>
      <div>
        <label htmlFor="contact" className="label">Your email or IG (optional, so we can follow up)</label>
        <input id="contact" name="contact" maxLength={200} className="input" />
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="website_url">Leave this empty</label>
        <input id="website_url" name="website_url" tabIndex={-1} autoComplete="off" />
      </div>
      {state.error && <p role="alert" className="font-bold text-chile">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary">{pending ? "Sending…" : "Suggest this spot"}</button>
    </form>
  );
}
