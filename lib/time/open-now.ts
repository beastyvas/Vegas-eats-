/**
 * Open-now evaluation in Las Vegas local time. Mirrors SQL `public.is_open_at`.
 * Hours with closes <= opens run past midnight into the next day.
 */
export type HoursRow = { dow: number; opens: string; closes: string };

const TZ = "America/Los_Angeles";

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function localParts(at: Date, timeZone = TZ): { dow: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return { dow, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function isOpenAt(hours: HoursRow[], at: Date = new Date()): boolean {
  const { dow, minutes } = localParts(at);
  const yesterday = (dow + 6) % 7;
  return hours.some((h) => {
    const o = toMinutes(h.opens);
    const c = toMinutes(h.closes);
    if (c > o) return h.dow === dow && minutes >= o && minutes < c;
    // overnight
    return (h.dow === dow && minutes >= o) || (h.dow === yesterday && minutes < c);
  });
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${suffix}` : `${h12}${suffix}`;
}
