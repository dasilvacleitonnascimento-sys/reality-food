// Publishes ONE dish from the demo data to Supabase: uploads its photo, .glb and
// .usdz under versioned names and upserts its row. No other dish is touched.
//
//   npm run publish-dish -- <restaurant-slug> <dish-id>
//
// Why not `npm run seed`? Seed rewrites every dish and uploads files under fixed
// names (e.g. burger.glb) with a 1-year cache: phones that already opened the old
// model would keep showing it. Versioned names (burger.3f2a9c1b.glb) are new URLs,
// so every phone gets the new model within minutes (the menu cache is "minutes").
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (server only).

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const [slug, dishId] = process.argv.slice(2);
if (!slug || !dishId) {
  console.error("Usage: npm run publish-dish -- <restaurant-slug> <dish-id>");
  process.exit(1);
}
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

const r = getRestaurants().find((x) => x.slug === slug);
const d = r?.dishes.find((x) => x.id === dishId);
if (!r || !d) throw new Error(`No dish ${slug}/${dishId} in the demo data (lib/demo-data.ts, lib/demo-ironside.ts)`);
const es = r.translations?.es?.dishes?.[d.id] ?? {};

const must = async (promise, what) => {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
};
const restaurant = await must(db.from("restaurants").select("id").eq("slug", slug).single(), `restaurant ${slug} (run npm run seed once to create it)`);
const rid = restaurant.id;
const category = await must(db.from("categories").select("id").eq("restaurant_id", rid).eq("slug", d.category).single(), `category ${d.category}`);
// Sort it right after the dish it follows in the data file.
const index = r.dishes.findIndex((x) => x.id === dishId);
const previous = r.dishes[index - 1];
const prevRow = previous ? await must(db.from("dishes").select("sort_order").eq("restaurant_id", rid).eq("slug", previous.id).maybeSingle(), "previous dish") : null;

// One version for all three files: the first 8 hex of the .glb's hash.
const glbBytes = await readFile(path.join(root, "public", d.glbUrl));
const version = createHash("sha256").update(glbBytes).digest("hex").slice(0, 8);
const TYPES = { ".glb": "model/gltf-binary", ".usdz": "model/vnd.usdz+zip", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
async function upload(publicPath) {
  const ext = path.extname(publicPath);
  const storagePath = `${rid}/${path.basename(publicPath, ext)}.${version}${ext}`;
  const body = await readFile(path.join(root, "public", publicPath));
  const { error } = await db.storage.from("dish-media").upload(storagePath, body, { contentType: TYPES[ext] ?? "application/octet-stream", upsert: true, cacheControl: "31536000" });
  if (error) throw new Error(`Upload ${publicPath}: ${error.message}`);
  console.log(`uploaded ${publicPath} -> ${storagePath} (${(body.length / 1024).toFixed(0)} KB)`);
  return storagePath;
}
const usdz = d.usdzUrl ?? d.glbUrl.replace(/\.glb$/, ".usdz");

const row = {
  restaurant_id: rid,
  category_id: category.id,
  slug: d.id,
  name: { en: d.name, ...(es.name ? { es: es.name } : {}) },
  description: { en: d.description, ...(es.description ? { es: es.description } : {}) },
  price_cents: Math.round(d.price * 100),
  tags: d.tags,
  photo_path: await upload(d.photo),
  model_glb_path: await upload(d.glbUrl),
  model_usdz_path: existsSync(path.join(root, "public", usdz)) ? await upload(usdz) : null,
  plate_diameter_cm: d.plateDiameterCm,
  portion_cm: d.portionCm ?? null,
  served_in: d.servedIn?.kind ?? "plate",
  served_in_oz: d.servedIn?.oz ?? null,
  is_available: d.isAvailable,
  sort_order: prevRow?.sort_order ?? index,
};
const saved = await must(db.from("dishes").upsert(row, { onConflict: "restaurant_id,slug" }).select("slug, plate_diameter_cm, price_cents"), "dish");
console.log(`Published ${slug}/${saved[0].slug}: ${saved[0].plate_diameter_cm} cm, $${(saved[0].price_cents / 100).toFixed(2)}. Live on the menu within a few minutes.`);
