"use client";
import { useActionState } from "react";
import { requestChange, submitLicense, type FormState } from "./actions";
import { LISTING_TYPES, LISTING_TYPE_LABELS } from "@/config/app";

export function LicenseForm({ listingId }: { listingId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitLicense.bind(null, listingId), {});
  if (state.ok) return <p role="status" className="font-bold">Thanks! We&apos;ll verify it and add your badge.</p>;
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <div>
        <label htmlFor="license_number" className="label">License / permit number</label>
        <input id="license_number" name="license_number" required maxLength={80} className="input" />
      </div>
      <div>
        <label htmlFor="license_kind" className="label">Type</label>
        <select id="license_kind" name="license_kind" className="input">
          <option value="cottage_food">Cottage food</option><option value="business">Business license</option>
          <option value="health_permit">Health permit</option><option value="other">Other</option>
        </select>
      </div>
      <button className="btn-secondary" disabled={pending}>Submit</button>
      {state.error && <p role="alert" className="text-sm font-bold text-chile sm:col-span-3">{state.error}</p>}
    </form>
  );
}

export function ChangeRequestForm({ listingId, current }: { listingId: string; current: { name: string; type: string; street_address: string | null; city: string | null; zip: string | null } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(requestChange.bind(null, listingId), {});
  if (state.ok) return <p role="status" className="font-bold">Sent. We&apos;ll review it shortly.</p>;
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label htmlFor="cr_name" className="label">Name</label><input id="cr_name" name="name" defaultValue={current.name} className="input" /></div>
        <div>
          <label htmlFor="cr_type" className="label">Type</label>
          <select id="cr_type" name="type" defaultValue={current.type} className="input">
            {LISTING_TYPES.map((t) => <option key={t} value={t}>{LISTING_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="cr_addr" className="label">Street address <span className="font-normal text-muted">(storefronts only, never a home address)</span></label>
          <input id="cr_addr" name="street_address" defaultValue={current.street_address ?? ""} className="input" />
        </div>
        <div><label htmlFor="cr_city" className="label">City</label><input id="cr_city" name="city" defaultValue={current.city ?? ""} className="input" /></div>
        <div><label htmlFor="cr_zip" className="label">Zip</label><input id="cr_zip" name="zip" defaultValue={current.zip ?? ""} inputMode="numeric" maxLength={5} className="input" /></div>
      </div>
      <div><label htmlFor="cr_reason" className="label">What changed?</label><input id="cr_reason" name="reason" maxLength={1000} className="input" placeholder="We moved into a storefront!" /></div>
      {state.error && <p role="alert" className="text-sm font-bold text-chile">{state.error}</p>}
      <button className="btn-secondary" disabled={pending}>Request change</button>
    </form>
  );
}
