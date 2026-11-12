// True-size check for every dish model.
//
// Plate3D promises "true size", so every .glb must match the plate diameter
// stored for the dish, sit exactly on the table, and stay small enough for
// restaurant Wi-Fi. Fails (exit code 1) if any model is off.
//
// Run: npm run check-models

import { stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getBounds } from "@gltf-transform/core";
import { createIO } from "./demo/export.mjs";

const root = path.resolve(import.meta.dirname, "..");

export const LIMITS = {
  diameterError: 0.005, // 0.5% -> 1.5 mm on a 30 cm plate
  belowTable: 0.0002, // nothing may poke more than 0.2 mm under the table
  offCenter: 0.002, // plate centered within 2 mm
  portion: 0.003, // food size shown to diners must match the model within 3 mm
  maxBytes: 5 * 1024 * 1024,
  warnBytes: 1.5 * 1024 * 1024,
};

export async function checkModels() {
  const { getRestaurants } = await import(pathToFileURL(path.join(root, "lib", "demo-data.ts")).href);
  const io = await createIO();
  const rows = [];
  let failed = false;

  for (const restaurant of getRestaurants()) {
    for (const dish of restaurant.dishes) {
      if (!dish.glbUrl) continue;
      const file = path.join(root, "public", dish.glbUrl);
      const problems = [];
      const { size } = await stat(file);
      const doc = await io.read(file);
      const b = getBounds(doc.getRoot().listScenes()[0]);
      const width = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]);
      const expected = dish.plateDiameterCm / 100;
      const error = (width - expected) / expected;
      const center = [(b.max[0] + b.min[0]) / 2, (b.max[2] + b.min[2]) / 2];

      if (Math.abs(error) > LIMITS.diameterError) problems.push(`plate is ${(width * 100).toFixed(2)} cm, expected ${dish.plateDiameterCm} cm`);
      if (b.min[1] < -LIMITS.belowTable) problems.push(`${(-b.min[1] * 1000).toFixed(1)} mm below the table (would float in AR)`);
      if (Math.hypot(...center) > LIMITS.offCenter) problems.push(`off center by ${(Math.hypot(...center) * 1000).toFixed(1)} mm`);
      if (size > LIMITS.maxBytes) problems.push(`file is ${(size / 1048576).toFixed(1)} MB (max 5 MB)`);

      // Food only: skip the plate (ceramic) and sauces pooled on it (gloss).
      let portion = "";
      if (dish.portionCm) {
        const food = doc
          .getRoot()
          .listNodes()
          .filter((n) => n.getMesh() && !["ceramic", "gloss"].includes(n.getName()))
          .map((n) => getBounds(n));
        const min = [0, 1, 2].map((i) => Math.min(...food.map((f) => f.min[i])));
        const max = [0, 1, 2].map((i) => Math.max(...food.map((f) => f.max[i])));
        const measured = { width: max[0] - min[0], depth: max[2] - min[2], height: max[1] - min[1] };
        portion = `${(measured.width * 100).toFixed(1)}x${(measured.depth * 100).toFixed(1)}x${(measured.height * 100).toFixed(1)}`;
        for (const key of ["width", "depth", "height"]) {
          const stated = dish.portionCm[key] / 100;
          if (Math.abs(measured[key] - stated) > LIMITS.portion) {
            problems.push(`portion ${key} is ${(measured[key] * 100).toFixed(1)} cm, menu says ${dish.portionCm[key]} cm`);
          }
        }
      }
      const warning = size > LIMITS.warnBytes ? "large file" : "";

      failed ||= problems.length > 0;
      rows.push({
        dish: dish.id,
        plate: `${(width * 100).toFixed(2)} / ${dish.plateDiameterCm} cm`,
        error: `${(error * 100).toFixed(2)}%`,
        height: `${((b.max[1] - b.min[1]) * 100).toFixed(1)} cm`,
        portion: portion ? `${portion} cm` : "",
        size: `${(size / 1024).toFixed(0)} KB`,
        result: problems.length ? `FAIL: ${problems.join("; ")}` : warning ? `ok (${warning})` : "ok",
      });
    }
  }

  console.table(rows);
  return !failed;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ok = await checkModels();
  if (!ok) {
    console.error("Some models are not true to size. Fix them before publishing.");
    process.exit(1);
  }
}
