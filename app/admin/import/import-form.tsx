"use client";
import { useActionState } from "react";
import Link from "next/link";
import { importCsv, type ImportState } from "./actions";

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(importCsv, {});
  return (
    <div className="space-y-4">
      <form action={action} className="card space-y-3 p-5">
        <label htmlFor="files" className="label">CSV files</label>
        <input id="files" name="files" type="file" accept=".csv,text/csv" multiple required className="block w-full text-sm" />
        <button type="submit" disabled={pending} className="btn-primary">{pending ? "Importing…" : "Import as candidates"}</button>
      </form>
      {state.error && <p role="alert" className="font-bold text-chile">{state.error}</p>}
      {state.results?.map((r) => (
        <div key={r.file} role="status" className="card p-4 text-sm">
          <p className="font-bold">{r.file}</p>
          <p>
            {r.rows} rows → <strong>{r.inserted}</strong> new candidates · {r.duplicates.length} duplicates skipped · {r.skipped} rows without a name ·{" "}
            {r.chainChecksQueued} chain-checks queued
          </p>
          {r.duplicates.length > 0 && <p className="mt-1 text-muted">Duplicates: {r.duplicates.map((d) => d.name).join(", ")}</p>}
        </div>
      ))}
      {state.results && <Link href="/admin/candidates" className="btn-secondary">Review candidates →</Link>}
    </div>
  );
}
