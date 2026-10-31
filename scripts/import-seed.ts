/**
 * Imports /seed/*.csv as CANDIDATES (not live listings) and queues a
 * chain-check for each. Safe to re-run: duplicates are skipped.
 *
 *   npm run import:seed                 # all CSVs in /seed
 *   npm run import:seed -- seed/foo.csv # specific files
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (reads .env.local).
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/database.types";
import { importCandidatesCsv } from "../lib/candidates/import";

function loadEnvFile(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

async function main() {
  loadEnvFile(path.resolve(".env.local"));
  loadEnvFile(path.resolve(".env"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");

  const args = process.argv.slice(2);
  const files = args.length
    ? args
    : readdirSync("seed").filter((f) => f.endsWith(".csv")).map((f) => path.join("seed", f));
  if (!files.length) throw new Error("No CSV files found in /seed");

  const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });
  for (const file of files) {
    const res = await importCandidatesCsv(supabase, readFileSync(file, "utf8"), path.basename(file), "seed");
    console.log(
      `${res.file}: ${res.rows} rows → ${res.inserted} new candidates, ${res.duplicates.length} duplicates, ${res.skipped} skipped (no name), ${res.chainChecksQueued} chain-checks queued`,
    );
    if (res.duplicates.length) console.log(`  duplicates: ${res.duplicates.map((d) => d.name).join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
