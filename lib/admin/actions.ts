"use server";

// Every change made in the admin panel. Each action: checks the admin, validates
// the form with Zod, writes with the admin's session (Row Level Security), then
// expires that restaurant's cached menu so diners see the change right away.

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireReadyAdmin } from "@/lib/admin/auth";
import { menuTag } from "@/lib/menu";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { FormState } from "@/lib/admin/session-actions";

const RESERVED = ["en", "es", "admin", "api", "qr"];
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes, like ironside-cafe.")
  .max(60, "Keep the address under 60 characters.")
  .refine((s) => !RESERVED.includes(s), "That address is reserved. Pick another one.");
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep it under ${max} characters.`)
    .optional()
    .transform((v) => v || undefined);
const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());

/** "Pão de Queijo!" -> "pao-de-queijo" */
function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
const i18n = (en: string, es?: string) => ({ en, ...(es ? { es } : {}) });
const fields = (form: FormData) => Object.fromEntries([...form.entries()].map(([k, v]) => [k, typeof v === "string" ? v : undefined]));

async function restaurantSlug(id: string) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("restaurants").select("slug").eq("id", id).single();
  return data?.slug as string | undefined;
}

// --- Restaurants ---------------------------------------------------------------

const restaurantSchema = z.object({
  name: z.string().trim().min(1, "Enter the restaurant's name.").max(80, "Keep the name under 80 characters."),
  slug: slugSchema,
  taglineEn: optionalText(140),
  taglineEs: optionalText(140),
  logoPath: optionalText(300),
  published: checkbox,
});

export async function saveRestaurant(id: string | null, _: FormState, form: FormData): Promise<FormState> {
  await requireReadyAdmin();
  const parsed = restaurantSchema.safeParse(fields(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const supabase = await createSupabaseServer();
  const row = {
    name: v.name,
    slug: v.slug,
    tagline: v.taglineEn ? i18n(v.taglineEn, v.taglineEs) : {},
    logo_path: v.logoPath ?? null,
    is_published: v.published,
  };
  const oldSlug = id ? await restaurantSlug(id) : undefined;
  const result = id ? await supabase.from("restaurants").update(row).eq("id", id).select("id").single() : await supabase.from("restaurants").insert(row).select("id").single();
  if (result.error) {
    if (result.error.code === "23505") return { error: `The address /${v.slug} is already used by another restaurant.` };
    return { error: `Not saved: ${result.error.message}` };
  }
  updateTag(menuTag(v.slug));
  if (oldSlug && oldSlug !== v.slug) updateTag(menuTag(oldSlug));
  if (!id) redirect(`/admin/restaurants/${result.data.id}`);
  return { ok: "Saved. The menu shows the change now." };
}

// --- Categories ----------------------------------------------------------------

const categorySchema = z.object({
  nameEn: z.string().trim().min(1, "Enter the category name in English.").max(40, "Keep it under 40 characters."),
  nameEs: optionalText(40),
});

export async function saveCategory(restaurantId: string, categoryId: string | null, _: FormState, form: FormData): Promise<FormState> {
  await requireReadyAdmin();
  const parsed = categorySchema.safeParse(fields(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await createSupabaseServer();
  const name = i18n(parsed.data.nameEn, parsed.data.nameEs);
  let error;
  if (categoryId) {
    ({ error } = await supabase.from("categories").update({ name }).eq("id", categoryId).eq("restaurant_id", restaurantId));
  } else {
    const { data: last } = await supabase.from("categories").select("sort_order").eq("restaurant_id", restaurantId).order("sort_order", { ascending: false }).limit(1);
    const base = slugify(parsed.data.nameEn) || "category";
    ({ error } = await supabase.from("categories").insert({ restaurant_id: restaurantId, slug: `${base}-${Date.now().toString(36).slice(-4)}`, name, sort_order: (last?.[0]?.sort_order ?? -1) + 1 }));
  }
  if (error) return { error: `Not saved: ${error.message}` };
  const slug = await restaurantSlug(restaurantId);
  if (slug) updateTag(menuTag(slug));
  return { ok: categoryId ? "Category renamed." : "Category added." };
}

/** Swaps sort order with the neighbour above (-1) or below (+1). Works for categories and dishes. */
export async function move(table: "categories" | "dishes", restaurantId: string, id: string, direction: -1 | 1) {
  await requireReadyAdmin();
  const supabase = await createSupabaseServer();
  const { data: rows } = await supabase.from(table).select("id, sort_order").eq("restaurant_id", restaurantId).order("sort_order");
  if (!rows) return;
  const list = rows.map((r, i) => ({ id: r.id as string, sort: i }));
  const i = list.findIndex((r) => r.id === id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i].sort, list[j].sort] = [list[j].sort, list[i].sort];
  // Renumber everything 0..n so ties from older data can't stall the order.
  await Promise.all(list.map((r) => supabase.from(table).update({ sort_order: r.sort }).eq("id", r.id)));
  const slug = await restaurantSlug(restaurantId);
  if (slug) updateTag(menuTag(slug));
}

export async function deleteCategory(restaurantId: string, categoryId: string) {
  await requireReadyAdmin();
  const supabase = await createSupabaseServer();
  // Dishes in it stay (category set to none) and can be moved to another category.
  await supabase.from("categories").delete().eq("id", categoryId).eq("restaurant_id", restaurantId);
  const slug = await restaurantSlug(restaurantId);
  if (slug) updateTag(menuTag(slug));
}

// --- Dishes --------------------------------------------------------------------

const dishSchema = z.object({
  nameEn: z.string().trim().min(1, "Enter the dish name in English.").max(80, "Keep the name under 80 characters."),
  nameEs: optionalText(80),
  descriptionEn: optionalText(400),
  descriptionEs: optionalText(400),
  price: z.coerce.number({ error: "Enter the price, like 12 or 12.50." }).min(0, "The price can't be negative.").max(10000, "That price looks too high."),
  categoryId: z
    .string()
    .optional()
    .transform((v) => v || null),
  plateCm: z.coerce.number({ error: "Enter the plate size in cm." }).min(3, "Plates are at least 3 cm.").max(80, "Plates are at most 80 cm."),
  servedIn: z.enum(["plate", "cup", "glass", "bowl", "pan"]),
  servedInOz: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null))
    .refine((v) => v === null || (v > 0 && v < 100), "Enter the size in oz, like 12."),
  tags: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8) : [])),
  photoPath: optionalText(300),
  available: checkbox,
});

export async function saveDish(restaurantId: string, dishId: string | null, _: FormState, form: FormData): Promise<FormState> {
  await requireReadyAdmin();
  const parsed = dishSchema.safeParse(fields(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  const supabase = await createSupabaseServer();
  const row = {
    name: i18n(v.nameEn, v.nameEs),
    description: v.descriptionEn ? i18n(v.descriptionEn, v.descriptionEs) : {},
    price_cents: Math.round(v.price * 100),
    category_id: v.categoryId,
    plate_diameter_cm: v.plateCm,
    served_in: v.servedIn,
    served_in_oz: v.servedIn === "cup" || v.servedIn === "glass" ? v.servedInOz : null,
    tags: v.tags,
    photo_path: v.photoPath ?? null,
    is_available: v.available,
  };
  let newId: string | undefined;
  if (dishId) {
    const { error } = await supabase.from("dishes").update(row).eq("id", dishId).eq("restaurant_id", restaurantId);
    if (error) return { error: `Not saved: ${error.message}` };
  } else {
    // The slug is the dish's address (/restaurant/dish/<slug>): set once, never changed.
    const base = slugify(v.nameEn) || "dish";
    const { data: taken } = await supabase.from("dishes").select("slug").eq("restaurant_id", restaurantId).like("slug", `${base}%`);
    const used = new Set((taken ?? []).map((d) => d.slug));
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    const { data: last } = await supabase.from("dishes").select("sort_order").eq("restaurant_id", restaurantId).order("sort_order", { ascending: false }).limit(1);
    const { data, error } = await supabase
      .from("dishes")
      .insert({ ...row, restaurant_id: restaurantId, slug, sort_order: (last?.[0]?.sort_order ?? -1) + 1 })
      .select("id")
      .single();
    if (error) return { error: `Not saved: ${error.message}` };
    newId = data.id;
  }
  const slug = await restaurantSlug(restaurantId);
  if (slug) updateTag(menuTag(slug));
  if (newId) redirect(`/admin/restaurants/${restaurantId}/dishes/${newId}?created=1`);
  return { ok: "Saved. The menu shows the change now." };
}

export async function setDishAvailable(restaurantId: string, dishId: string, available: boolean) {
  await requireReadyAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("dishes").update({ is_available: available }).eq("id", dishId).eq("restaurant_id", restaurantId);
  const slug = await restaurantSlug(restaurantId);
  if (slug) updateTag(menuTag(slug));
}

export async function deleteDish(restaurantId: string, dishId: string) {
  await requireReadyAdmin();
  const supabase = await createSupabaseServer();
  await supabase.from("dishes").delete().eq("id", dishId).eq("restaurant_id", restaurantId);
  const slug = await restaurantSlug(restaurantId);
  if (slug) updateTag(menuTag(slug));
  redirect(`/admin/restaurants/${restaurantId}/menu?deleted=1`);
}
