// Attaches a processed 3D model to a dish that already exists in Supabase
// (e.g. one created in the admin panel). Uploads the .glb (and the .usdz next to
// it, if there is one) under versioned names and updates only that dish's model
// fields. Name, price, photo and everything else stay as they are.
//
//   npm run publish-model -- <restaurant-slug> <dish-slug> <model.glb> [--usdz <model.usdz>] [--plate <cm>]
//
// Process the scan first (see .claude/skills/add-dish): crop-scan, import-model,
// build-usdz, check-models. --plate also saves the measured plate size.
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (server only).

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { usdz: { type: "string" }, plate: { type: "string" } },
});
const [slug, dishSlug, glbArg] = positionals;
if (!slug || !dishSlug || !glbArg) {
  console.error("Usage: npm run publish-model -- <restaurant-slug> <dish-slug> <model.glb> [--usdz <model.usdz>] [--plate <cm>]");
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

const glbPath = path.resolve(glbArg);
if (!glbPath.endsWith(".glb") || !existsSync(glbPath)) throw new Error(`Not a .glb file: ${glbArg}`);
const usdzPath = values.usdz ? path.resolve(values.usdz) : glbPath.replace(/\.glb$/, ".usdz");
const hasUsdz = existsSync(usdzPath);
if (values.usdz && !hasUsdz) throw new Error(`No such file: ${values.usdz}`);
const plate = values.plate ? Number(values.plate) : undefined;
if (plate !== undefined && !(plate >= 3 && plate <= 80)) throw new Error("--plate must be a size in cm between 3 and 80");

const MAX_BYTES = 5 * 1024 * 1024;
const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const must = async (promise, what) => {
  const { data, error } = await promise;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
};

const restaurant = await must(db.from("restaurants").select("id").eq("slug", slug).single(), `restaurant /${slug}`);
const dish = await must(db.from("dishes").select("id, slug").eq("restaurant_id", restaurant.id).eq("slug", dishSlug).single(), `dish ${dishSlug} in /${slug}`);

const glbBytes = await readFile(glbPath);
// One version for both files: new URLs, so phones never keep an old cached model.
const version = createHash("sha256").update(glbBytes).digest("hex").slice(0, 8);
async function upload(file, bytes, ext, type) {
  if (bytes.length > MAX_BYTES) console.warn(`warning: ${path.basename(file)} is ${(bytes.length / 1048576).toFixed(1)} MB (target is under 5 MB)`);
  const storagePath = `${restaurant.id}/${dish.slug}.${version}${ext}`;
  const { error } = await db.storage.from("dish-media").upload(storagePath, bytes, { contentType: type, upsert: true, cacheControl: "31536000" });
  if (error) throw new Error(`Upload ${path.basename(file)}: ${error.message}`);
  console.log(`uploaded ${path.basename(file)} -> ${storagePath} (${(bytes.length / 1024).toFixed(0)} KB)`);
  return storagePath;
}

const update = {
  model_glb_path: await upload(glbPath, glbBytes, ".glb", "model/gltf-binary"),
  model_usdz_path: hasUsdz ? await upload(usdzPath, await readFile(usdzPath), ".usdz", "model/vnd.usdz+zip") : null,
  ...(plate ? { plate_diameter_cm: plate } : {}),
};
await must(db.from("dishes").update(update).eq("id", dish.id), "dish update");
console.log(`3D attached to /${slug}/dish/${dish.slug}${hasUsdz ? " (with iPhone file)" : " (no .usdz: iPhone converts on the fly)"}. Live within a few minutes.`);
