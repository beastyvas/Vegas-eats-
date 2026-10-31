export function SearchBox({ defaultValue = "", size = "lg", autoFocus = false }: { defaultValue?: string; size?: "lg" | "md"; autoFocus?: boolean }) {
  const big = size === "lg";
  return (
    <form action="/search" role="search" className="flex w-full items-stretch gap-2">
      <label htmlFor="site-search" className="sr-only">Search local spots</label>
      <input
        id="site-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder="birria, brisket, ube, Henderson…"
        className={`input flex-1 border-ink ${big ? "h-14 rounded-full px-5 text-lg" : "h-11 rounded-full px-4"}`}
      />
      <button type="submit" className={`btn-primary ${big ? "h-14 px-6 text-lg" : "h-11"}`}>Search</button>
    </form>
  );
}
