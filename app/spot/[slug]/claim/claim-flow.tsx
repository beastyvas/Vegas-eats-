"use client";
import { useActionState, useState } from "react";
import { startClaim, verifyEmailCode, type ClaimState, type VerifyState } from "./actions";

type Props = { slug: string; listingName: string; igHandle: string | null; maskedEmail: string | null; ourInstagram: string };

function VerifyEmail({ claimId, masked }: { claimId: string; masked?: string }) {
  const [state, action, pending] = useActionState<VerifyState, FormData>(verifyEmailCode.bind(null, claimId), {});
  return (
    <form action={action} className="card space-y-3 p-5">
      <p className="font-bold">We emailed a code to {masked}.</p>
      <label htmlFor="code" className="label">Enter the 6-character code</label>
      <input id="code" name="code" required autoComplete="one-time-code" maxLength={10} className="input w-48 font-mono text-xl uppercase tracking-widest" />
      {state.error && <p role="alert" className="text-sm font-bold text-chile">{state.error}</p>}
      <button className="btn-primary" disabled={pending}>{pending ? "Checking…" : "Verify & claim"}</button>
    </form>
  );
}

export function ClaimFlow({ slug, listingName, igHandle, maskedEmail, ourInstagram }: Props) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(startClaim.bind(null, slug), {});
  const [method, setMethod] = useState<string>(igHandle ? "ig_code" : maskedEmail ? "email_code" : "manual");

  if (state.method === "ig_code" && state.code) {
    return (
      <div role="status" className="card space-y-3 p-5">
        <p className="h-display text-2xl">Almost done</p>
        <p>From <strong>@{igHandle}</strong> (the Instagram on this listing), send a DM to <strong>{ourInstagram}</strong> with this code:</p>
        <p className="w-fit rounded-xl bg-ink px-5 py-3 font-mono text-3xl font-bold tracking-[0.3em] text-white">{state.code}</p>
        <p className="text-sm text-muted">We&apos;ll match it and unlock your page, usually within a day. The code is good for 3 days. Lost it? Start again to get a new one.</p>
      </div>
    );
  }
  if (state.method === "email_code" && state.claimId) return <VerifyEmail claimId={state.claimId} masked={state.maskedEmail} />;
  if (state.submitted) {
    return (
      <div role="status" className="card p-5">
        <p className="h-display text-2xl">Got it</p>
        <p className="mt-2">We&apos;ll review your claim for {listingName} and email you, usually within a day or two.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <fieldset className="space-y-3">
        <legend className="label">How should we verify you own {listingName}?</legend>
        {igHandle && (
          <label className="card flex cursor-pointer gap-3 p-4 has-[:checked]:border-ink">
            <input type="radio" name="method" value="ig_code" checked={method === "ig_code"} onChange={() => setMethod("ig_code")} className="mt-1 h-5 w-5" />
            <span><strong>DM us a code from @{igHandle}</strong><br /><span className="text-sm text-muted">Fastest if you run that Instagram.</span></span>
          </label>
        )}
        {maskedEmail && (
          <label className="card flex cursor-pointer gap-3 p-4 has-[:checked]:border-ink">
            <input type="radio" name="method" value="email_code" checked={method === "email_code"} onChange={() => setMethod("email_code")} className="mt-1 h-5 w-5" />
            <span><strong>Email a code to {maskedEmail}</strong><br /><span className="text-sm text-muted">The email we have on file for this spot.</span></span>
          </label>
        )}
        <label className="card flex cursor-pointer gap-3 p-4 has-[:checked]:border-ink">
          <input type="radio" name="method" value="manual" checked={method === "manual"} onChange={() => setMethod("manual")} className="mt-1 h-5 w-5" />
          <span><strong>Verify me another way</strong><br /><span className="text-sm text-muted">Tell us who you are; we&apos;ll reach out.</span></span>
        </label>
      </fieldset>
      {method === "manual" && (
        <div>
          <label htmlFor="evidence" className="label">Who are you, and how can we confirm? (phone, business license, a link…)</label>
          <textarea id="evidence" name="evidence" rows={4} maxLength={2000} required className="input" />
        </div>
      )}
      {state.error && <p role="alert" className="font-bold text-chile">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary">{pending ? "Working…" : "Continue"}</button>
    </form>
  );
}
