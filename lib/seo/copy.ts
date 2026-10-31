/** Category page titles phrased the way people search ("best birria las vegas"). */
const SEARCH_NAME: Record<string, string> = {
  "birria-tacos": "Birria & Tacos",
  "texas-bbq": "Texas BBQ",
  "bakery-desserts": "Home Bakers & Desserts",
  vegan: "Vegan Food",
};

export function categoryTitle(slug: string, name: string, areaName?: string) {
  const n = SEARCH_NAME[slug] ?? name;
  return areaName ? `Best locally owned ${n} in ${areaName}` : `Best locally owned ${n} in Las Vegas`;
}

export function categoryDescription(name: string, count: number, areaName?: string) {
  const where = areaName ? `${areaName}, Las Vegas` : "Las Vegas";
  return `${count} locally owned ${name.toLowerCase()} spots in ${where}: home kitchens, pop-ups, trucks, and restaurants. No chains, ranked by locals.`;
}
