"use server";
import { requireAdmin } from "@/lib/auth";
import { importCandidatesCsv, type ImportResult } from "@/lib/candidates/import";

export type ImportState = { results?: ImportResult[]; error?: string };

const MAX_BYTES = 2_000_000;

export async function importCsv(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const { supabase } = await requireAdmin();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choose at least one CSV file." };
  try {
    const results: ImportResult[] = [];
    for (const f of files) {
      if (f.size > MAX_BYTES) return { error: `${f.name} is over 2 MB.` };
      results.push(await importCandidatesCsv(supabase, await f.text(), f.name, "seed"));
    }
    return { results };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Import failed." };
  }
}
