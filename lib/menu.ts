// Menu data for diner pages. Reads published menus from Supabase (cached), or
// falls back to the demo data when Supabase isn't configured.

import { cacheLife, cacheTag } from "next/cache";
import * as demo from "./demo-data";
import type { Dish, Restaurant } from "./demo-data";
import type { Locale } from "./i18n/config";
import { translateTag } from "./i18n/tags";
import { hasSupabase, mediaUrl, supabasePublic } from "./supabase/public";

type I18n = { en: string; es?: string };
const pick = (text: I18n | null | undefined, locale: Locale) => (text ? (text[locale] ?? text.en) : "");

type DishRow = {
  slug: string;
  name: I18n;
  description: I18n;
  price_cents: number;
  tags: string[];
  photo_path: string | null;
  model_glb_path: string | null;
  model_usdz_path: string | null;
  plate_diameter_cm: number;
  portion_cm: Dish["portionCm"] | null;
  served_in: "plate" | "cup" | "glass" | "bowl" | "pan";
  served_in_oz: number | null;
  is_available: boolean;
  category: { slug: string } | null;
};

/** Cache tag to revalidate when a restaurant's menu changes (owner dashboard). */
export const menuTag = (slug: string) => `menu:${slug}`;

/** A published restaurant with its menu in the diner's language, or undefined. */
export async function getMenu(slug: string, locale: Locale): Promise<Restaurant | undefined> {
  if (!hasSupabase) return demo.getRestaurant(slug, locale);
  return getMenuFromDb(slug, locale);
}

async function getMenuFromDb(slug: string, locale: Locale): Promise<Restaurant | undefined> {
  "use cache";
  cacheLife("minutes");
  cacheTag(menuTag(slug));

  const db = supabasePublic!;
  const { data: r, error } = await db
    .from("restaurants")
    .select("id, slug, name, tagline, logo_path, primary_color")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(`Menu ${slug}: ${error.message}`);
  if (!r) return undefined;

  const [{ data: categories, error: catError }, { data: dishes, error: dishError }] = await Promise.all([
    db.from("categories").select("slug, name, sort_order").eq("restaurant_id", r.id).order("sort_order"),
    db
      .from("dishes")
      .select(
        "slug, name, description, price_cents, tags, photo_path, model_glb_path, model_usdz_path, plate_diameter_cm, portion_cm, served_in, served_in_oz, is_available, category:categories(slug)",
      )
      .eq("restaurant_id", r.id)
      .order("sort_order")
      .returns<DishRow[]>(),
  ]);
  if (catError || dishError) throw new Error(`Menu ${slug}: ${(catError ?? dishError)!.message}`);

  return {
    name: r.name,
    slug: r.slug,
    logo: mediaUrl(r.logo_path) ?? "/icon.svg",
    tagline: pick(r.tagline as I18n, locale),
    primaryColor: r.primary_color,
    categories: (categories ?? []).map((c) => ({ id: c.slug, name: pick(c.name as I18n, locale) })),
    dishes: (dishes ?? []).map((d) => ({
      id: d.slug,
      name: pick(d.name, locale),
      description: pick(d.description, locale),
      price: d.price_cents / 100,
      category: d.category?.slug ?? "",
      // "" = no photo yet (text-only card).
      photo: mediaUrl(d.photo_path) ?? "",
      glbUrl: mediaUrl(d.model_glb_path),
      usdzUrl: mediaUrl(d.model_usdz_path),
      plateDiameterCm: Number(d.plate_diameter_cm),
      portionCm: d.portion_cm ?? undefined,
      servedIn: d.served_in === "plate" ? undefined : { kind: d.served_in, oz: d.served_in_oz ?? undefined },
      tags: d.tags.map((t) => translateTag(t, locale)),
      isAvailable: d.is_available,
    })),
  };
}

/** Slugs of all published restaurants (for prerendering). */
export async function getMenuSlugs(): Promise<string[]> {
  if (!hasSupabase) return demo.getRestaurants().map((r) => r.slug);
  return getMenuSlugsFromDb();
}

async function getMenuSlugsFromDb() {
  "use cache";
  cacheLife("minutes");
  const { data, error } = await supabasePublic!.from("restaurants").select("slug").eq("is_published", true);
  if (error) throw new Error(`Restaurants: ${error.message}`);
  return (data ?? []).map((r) => r.slug);
}

/** slug + dish id pairs of every published dish (for prerendering). */
export async function getDishParams(): Promise<{ slug: string; id: string }[]> {
  if (!hasSupabase) return demo.getRestaurants().flatMap((r) => r.dishes.map((d) => ({ slug: r.slug, id: d.id })));
  return getDishParamsFromDb();
}

async function getDishParamsFromDb() {
  "use cache";
  cacheLife("minutes");
  const { data, error } = await supabasePublic!.from("dishes").select("slug, restaurant:restaurants!inner(slug, is_published)").eq("restaurant.is_published", true);
  if (error) throw new Error(`Dishes: ${error.message}`);
  return (data ?? []).map((d) => ({ slug: (d.restaurant as unknown as { slug: string }).slug, id: d.slug }));
}
