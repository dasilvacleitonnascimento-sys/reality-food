// Loads the demo restaurants (lib/demo-data.ts) into Supabase:
// restaurants, categories, dishes (EN + ES text) and their media (logo,
// photos, 3D models) in the dish-media bucket. Safe to run again: it upserts.
//
//   npm run seed
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(import.meta.dirname, "..");
process.loadEnvFile(path.join(root, ".env.local"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const { getRestaurants } = await import(pathToFileURL(path.join(root, "lib", "demo-data.ts")).href);
const BUCKET = "dish-media";

const CONTENT_TYPES = { ".glb": "model/gltf-binary", ".usdz": "model/vnd.usdz+zip", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".webp": "image/webp" };
const uploaded = new Map();

/** "/models/x.glb" -> "/models/x.usdz" when that file exists. */
function usdzNextTo(glbUrl) {
  if (!glbUrl) return null;
  const usdz = glbUrl.replace(/\.glb$/, ".usdz");
  return existsSync(path.join(root, "public", usdz)) ? usdz : null;
}

/** Uploads /public/<publicPath> to <restaurantId>/<name> and returns the storage path. */
async function upload(restaurantId, publicPath) {
  if (!publicPath) return null;
  const key = `${restaurantId}:${publicPath}`;
  if (uploaded.has(key)) return uploaded.get(key);
  const file = path.join(root, "public", publicPath);
  const storagePath = `${restaurantId}/${path.basename(publicPath)}`;
  const body = await readFile(file);
  const { error } = await db.storage.from(BUCKET).upload(storagePath, body, {
    contentType: CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream",
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) throw new Error(`Upload ${publicPath}: ${error.message}`);
  uploaded.set(key, storagePath);
  return storagePath;
}

async function must(promise, what) {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

for (const r of getRestaurants()) {
  const es = r.translations?.es ?? {};
  const restaurant = await must(
    db
      .from("restaurants")
      .upsert(
        {
          slug: r.slug,
          name: r.name,
          tagline: { en: r.tagline, ...(es.tagline ? { es: es.tagline } : {}) },
          primary_color: r.primaryColor,
          is_published: true,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single(),
    `restaurant ${r.slug}`,
  );
  const rid = restaurant.id;
  await must(db.from("restaurants").update({ logo_path: await upload(rid, r.logo) }).eq("id", rid), "logo");

  const categories = await must(
    db
      .from("categories")
      .upsert(
        r.categories.map((c, i) => ({
          restaurant_id: rid,
          slug: c.id,
          name: { en: c.name, ...(es.categories?.[c.id] ? { es: es.categories[c.id] } : {}) },
          sort_order: i,
        })),
        { onConflict: "restaurant_id,slug" },
      )
      .select("id, slug"),
    "categories",
  );
  const categoryId = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  const rows = [];
  for (const [i, d] of r.dishes.entries()) {
    const t = es.dishes?.[d.id] ?? {};
    rows.push({
      restaurant_id: rid,
      category_id: categoryId[d.category] ?? null,
      slug: d.id,
      name: { en: d.name, ...(t.name ? { es: t.name } : {}) },
      description: { en: d.description, ...(t.description ? { es: t.description } : {}) },
      price_cents: Math.round(d.price * 100),
      tags: d.tags,
      photo_path: await upload(rid, d.photo),
      model_glb_path: await upload(rid, d.glbUrl),
      // iPhone AR file from `npm run build-usdz` (next to the .glb), if built.
      model_usdz_path: await upload(rid, d.usdzUrl ?? usdzNextTo(d.glbUrl)),
      plate_diameter_cm: d.plateDiameterCm,
      portion_cm: d.portionCm ?? null,
      served_in: d.servedIn?.kind ?? "plate",
      served_in_oz: d.servedIn?.oz ?? null,
      is_available: d.isAvailable,
      sort_order: i,
    });
    process.stdout.write(".");
  }
  await must(db.from("dishes").upsert(rows, { onConflict: "restaurant_id,slug" }), "dishes");
  console.log(`\n${r.name}: ${rows.length} dishes, ${categories.length} categories`);
}

console.log(`Uploaded ${uploaded.size} files to ${BUCKET}.`);
