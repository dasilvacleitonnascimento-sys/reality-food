import type { Locale } from "./config";

// Common menu tags in Spanish. Unknown tags stay as written.
const ES: Record<string, string> = {
  Popular: "Popular",
  Vegetarian: "Vegetariano",
  Vegan: "Vegano",
  "Gluten-free": "Sin gluten",
  Spicy: "Picante",
  "Chef's pick": "Recomendación del chef",
  "To share": "Para compartir",
  New: "Nuevo",
  "Real scan": "Escaneo real",
};

export function translateTag(tag: string, locale: Locale): string {
  if (locale === "en") return tag;
  const protein = /^(\d+)g protein$/i.exec(tag);
  if (protein) return `${protein[1]} g de proteína`;
  return ES[tag] ?? tag;
}
