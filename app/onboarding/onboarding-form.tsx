"use client";
import { useActionState } from "react";
import { saveOnboarding, type OnboardingState } from "./actions";

export function OnboardingForm({ next, defaultName }: { next: string; defaultName: string }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(saveOnboarding, {});
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="zip" className="label">Your zip code</label>
        <input id="zip" name="zip" inputMode="numeric" pattern="\d{5}" maxLength={5} required className="input" placeholder="89101" aria-describedby="zip-help" />
        <p id="zip-help" className="mt-1 text-sm text-muted">
          Vouches from Las Vegas Valley zips count fully. We never show your zip to anyone.
        </p>
      </div>
      <div>
        <label htmlFor="display_name" className="label">Name to show on vouches <span className="font-normal text-muted">(optional)</span></label>
        <input id="display_name" name="display_name" maxLength={60} className="input" defaultValue={defaultName} placeholder="Maria G." />
      </div>
      {state.error && <p role="alert" className="text-sm font-bold text-chile">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">{pending ? "Saving…" : "Continue"}</button>
    </form>
  );
}
