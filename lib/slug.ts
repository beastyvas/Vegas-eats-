/** "Birria Bros. (NLV)" -> "birria-bros-nlv" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Picks `base`, or `base-2`, `base-3`... not present in `taken`. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  const root = slugify(base) || "spot";
  if (!taken.has(root)) return root;
  for (let i = 2; i < 1000; i++) {
    const s = `${root}-${i}`;
    if (!taken.has(s)) return s;
  }
  return `${root}-${Date.now()}`;
}
