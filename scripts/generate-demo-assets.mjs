// Generates the Demo Bistro assets:
//   public/images/demo-bistro-logo.svg
//   public/images/<dish>.jpg     photo rendered from the 3D model (menu card + 3D poster)
//   public/models/<dish>.glb     true-to-scale model, 1 unit = 1 meter, textured
//
// Run all:  npm run demo-assets
// Run one:  npm run demo-assets -- burrata
//
// These procedural models stand in until real photogrammetry scans arrive (Prompt 4).

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { burrata, chocolateCake, shrimpRisotto } from "./demo/dishes.mjs";
import { bake, writeGlb } from "./demo/export.mjs";
import { pudim, pudimSlice } from "./demo/pudim.mjs";
import { renderPhoto } from "./demo/render.mjs";
import { checkModels } from "./check-models.mjs";

const root = path.resolve(import.meta.dirname, "..");
const imagesDir = path.join(root, "public", "images");
const modelsDir = path.join(root, "public", "models");
await mkdir(imagesDir, { recursive: true });
await mkdir(modelsDir, { recursive: true });

const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" role="img" aria-label="Demo Bistro">
  <circle cx="56" cy="56" r="56" fill="#9a3412"/>
  <circle cx="56" cy="56" r="47" fill="none" stroke="#fed7aa" stroke-width="2"/>
  <text x="56" y="67" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="700" fill="#fff7ed">DB</text>
</svg>
`;
await writeFile(path.join(imagesDir, "demo-bistro-logo.svg"), logo);

const dishes = [
  { id: "chocolate-cake", build: chocolateCake, plateCm: 20, height: 0.035 },
  { id: "burrata", build: burrata, plateCm: 23, height: 0.025 },
  { id: "shrimp-risotto", build: shrimpRisotto, plateCm: 27, height: 0.025 },
  // Built from a real photo (scripts/demo/photos). The real photo has a price
  // tag in it, so the menu shows a render of the model instead.
  { id: "pudim", build: pudim, plateCm: 30, height: 0.04 },
  { id: "pudim-slice", build: pudimSlice, plateCm: 18, height: 0.04, azimuth: -50 },
];

const only = process.argv[2];

for (const dish of dishes) {
  if (only && dish.id !== only) continue;
  const started = Date.now();
  const parts = await dish.build();
  const atlas = bake(parts);
  const bytes = await writeGlb(path.join(modelsDir, `${dish.id}.glb`), dish.id, parts, atlas);

  const photoFile = path.join(imagesDir, `${dish.id}.jpg`);
  if (dish.menuPhoto) await dish.menuPhoto(photoFile);

  const plate = dish.plateCm / 100;
  const distance = plate * 2.05;
  const elevation = (40 * Math.PI) / 180;
  // Camera angle around the dish (degrees); the slice is shot from the side to show the cut.
  const azimuth = ((dish.azimuth ?? 11) * Math.PI) / 180;
  await renderPhoto(parts, atlas, {
    file: dish.menuPhoto ? path.join(root, "scripts", "demo", "previews", `${dish.id}.jpg`) : photoFile,
    eye: [
      distance * Math.cos(elevation) * Math.sin(azimuth),
      distance * Math.sin(elevation),
      distance * Math.cos(elevation) * Math.cos(azimuth),
    ],
    target: [0, dish.height, 0],
    extent: plate * 1.1,
  });

  const vertices = parts.reduce((s, p) => s + p.world.length / 3, 0);
  console.log(
    `${dish.id}: ${(bytes / 1024 / 1024).toFixed(2)} MB, ${vertices} vertices, atlas ${atlas.width}x${atlas.height}, ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

if (!(await checkModels())) process.exit(1);
