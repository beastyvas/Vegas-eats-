/**
 * Round-robin items by a key so a section isn't six cookie bakers in a row.
 * Keeps each group's internal order (e.g. by heat).
 */
export function diversify<T>(items: T[], key: (t: T) => string, limit = items.length): T[] {
  const groups = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }
  const queues = [...groups.values()];
  const out: T[] = [];
  while (out.length < limit && queues.some((q) => q.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next) out.push(next);
      if (out.length >= limit) break;
    }
  }
  return out;
}
