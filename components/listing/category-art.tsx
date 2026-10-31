/** Warm placeholder art for spots without photos yet: category emoji on a food-color field. */
const PALETTES = [
  { bg: "#A3231B", dot: "#B8382C" }, // chile
  { bg: "#1F4D3A", dot: "#2A6049" }, // deep green
  { bg: "#C98A0E", dot: "#D99D24" }, // mustard
  { bg: "#3B2A1E", dot: "#4E3A2B" }, // smoke
  { bg: "#B5482F", dot: "#C65B41" }, // paprika
  { bg: "#2F5D62", dot: "#3B6F75" }, // agave
];

const FIXED: Record<string, number> = { "texas-bbq": 3, "birria-tacos": 0, "soul-food": 2, pizza: 4, vegan: 1, "bakery-desserts": 5 };

function paletteFor(seed: string) {
  if (seed in FIXED) return PALETTES[FIXED[seed]];
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

export function CategoryArt({ categorySlug, emoji, className = "" }: { categorySlug?: string; emoji?: string | null; className?: string }) {
  const p = paletteFor(categorySlug ?? "x");
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center ${className}`}
      style={{
        backgroundColor: p.bg,
        backgroundImage: `radial-gradient(${p.dot} 2px, transparent 2.5px)`,
        backgroundSize: "18px 18px",
      }}
    >
      <span className="text-6xl drop-shadow-[0_3px_0_rgba(0,0,0,0.25)] sm:text-7xl">{emoji ?? "🍽️"}</span>
    </div>
  );
}
