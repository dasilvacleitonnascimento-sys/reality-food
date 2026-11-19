// Typed reads for the admin panel. Every function checks the admin first, then
// reads with the admin's own session (Row Level Security: admins see everything,
// including unpublished restaurants).

import { notFound } from "next/navigation";
import { requireReadyAdmin } from "@/lib/admin/auth";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { CategoryRow, DishRow, RestaurantRow } from "@/lib/supabase/database.types";

export type RestaurantSummary = Pick<RestaurantRow, "id" | "slug" | "name" | "is_published" | "logo_path"> & {
  dishes: number;
  withModel: number;
};

export async function listRestaurants(): Promise<RestaurantSummary[]> {
  await requireReadyAdmin();
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, slug, name, is_published, logo_path, dishes(model_glb_path)")
    .order("name");
  if (error) throw new Error(`Restaurants: ${error.message}`);
  return (data ?? []).map((r) => {
    const dishes = (r.dishes ?? []) as unknown as Pick<DishRow, "model_glb_path">[];
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      is_published: r.is_published,
      logo_path: r.logo_path,
      dishes: dishes.length,
      withModel: dishes.filter((d) => d.model_glb_path).length,
    };
  });
}

export async function getRestaurant(id: string): Promise<RestaurantRow> {
  await requireReadyAdmin();
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.from("restaurants").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Restaurant: ${error.message}`);
  if (!data) notFound();
  return data as RestaurantRow;
}

export type MenuData = { restaurant: RestaurantRow; categories: CategoryRow[]; dishes: DishRow[] };

export async function getMenuData(restaurantId: string): Promise<MenuData> {
  const restaurant = await getRestaurant(restaurantId);
  const supabase = await createSupabaseServer();
  const [cats, dishes] = await Promise.all([
    supabase.from("categories").select("*").eq("restaurant_id", restaurantId).order("sort_order"),
    supabase.from("dishes").select("*").eq("restaurant_id", restaurantId).order("sort_order"),
  ]);
  if (cats.error) throw new Error(`Categories: ${cats.error.message}`);
  if (dishes.error) throw new Error(`Dishes: ${dishes.error.message}`);
  return { restaurant, categories: (cats.data ?? []) as CategoryRow[], dishes: (dishes.data ?? []) as DishRow[] };
}

export async function getDish(restaurantId: string, dishId: string): Promise<{ menu: MenuData; dish: DishRow }> {
  const menu = await getMenuData(restaurantId);
  const dish = menu.dishes.find((d) => d.id === dishId);
  if (!dish) notFound();
  return { menu, dish };
}
