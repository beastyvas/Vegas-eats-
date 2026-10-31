import { ImportForm } from "./import-form";

export default function ImportPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="h-display text-3xl">Import CSV</h1>
      <p className="mt-2 text-muted">
        Rows become <strong>candidates</strong>, not live listings. Nothing is published until you approve it. Duplicates (same
        name or Instagram handle as an existing listing/candidate) are skipped, and every new candidate gets a chain-check queued.
        Headers are matched loosely (e.g. <code>name / business</code>, <code>ig / instagram</code>, <code>area / neighborhood</code>).
        You can also run <code>npm run import:seed</code> from the repo.
      </p>
      <div className="mt-6"><ImportForm /></div>
    </div>
  );
}
