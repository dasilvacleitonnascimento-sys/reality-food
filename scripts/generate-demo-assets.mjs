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
import { burrata, shrimpRisotto } from "./demo/dishes.mjs";
import { chocolateCake } from "./demo/chocolate-cake.mjs";
import { bake, writeGlb } from "./demo/export.mjs";
import { pudim, pudimSlice } from "./demo/pudim.mjs";
import { renderPhoto } from "./demo/render.mjs";
import { checkModels } from "./check-models.mjs";
import { IRONSIDE_DISHES } from "./demo/ironside.mjs";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const imagesDir = path.join(root, "public", "images");
const modelsDir = path.join(root, "public", "models");
await mkdir(imagesDir, { recursive: true });
await mkdir(modelsDir, { recursive: true });

const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" role="img" aria-label="Demo Bistro">
  <circle cx="56" cy="56" r="56" fill="#191A1F"/>
  <circle cx="56" cy="56" r="47" fill="none" stroke="#FBB71A" stroke-width="2"/>
  <text x="56" y="67" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="700" fill="#FBB71A">DB</text>
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

// Ironside Cafe (Miami): models built from industry-standard serving sizes.
for (const dish of IRONSIDE_DISHES) {
  dishes.push({ ...dish, dir: "ironside", height: (dish.heightCm / 100) * 0.4 });
}

// Ironside brand mark and the image for items whose 3D model isn't ready yet.
await mkdir(path.join(imagesDir, "ironside"), { recursive: true });
await mkdir(path.join(modelsDir, "ironside"), { recursive: true });
await writeFile(
  path.join(imagesDir, "ironside", "logo.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" role="img" aria-label="Ironside Cafe">
  <circle cx="56" cy="56" r="56" fill="#191A1F"/>
  <circle cx="56" cy="56" r="47" fill="none" stroke="#FBB71A" stroke-width="2"/>
  <text x="56" y="66" text-anchor="middle" font-family="Georgia, serif" font-size="30" font-weight="700" fill="#FBB71A">IC</text>
</svg>
`,
);
await sharp(
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#efe8dc"/><stop offset="1" stop-color="#e2d8c8"/></linearGradient></defs>
  <rect width="1200" height="900" fill="url(#g)"/>
  <circle cx="600" cy="400" r="150" fill="none" stroke="#b9ad98" stroke-width="10"/>
  <circle cx="600" cy="400" r="100" fill="none" stroke="#cfc4b2" stroke-width="6"/>
  <text x="600" y="660" text-anchor="middle" font-family="Arial, sans-serif" font-size="54" fill="#8a7f6c">3D coming soon</text>
</svg>`),
)
  .jpeg({ quality: 80 })
  .toFile(path.join(imagesDir, "ironside", "coming-soon.jpg"));

// Run one dish: npm run demo-assets -- latte   |   one restaurant: -- ironside
const only = process.argv[2];

for (const dish of dishes) {
  if (only && dish.id !== only && dish.dir !== only) continue;
  const started = Date.now();
  const parts = await dish.build();
  const atlas = bake(parts);
  const sub = dish.dir ? `${dish.dir}/` : "";
  const bytes = await writeGlb(path.join(modelsDir, `${sub}${dish.id}.glb`), dish.id, parts, atlas);
  const photoFile = path.join(imagesDir, `${sub}${dish.id}.jpg`);

  // Frame the whole dish: wide plates and tall drinks alike.
  // At least 15 cm in frame so small glasses aren't cropped.
  const size = Math.max(dish.plateCm, (dish.heightCm ?? 0) * 0.85, 15) / 100;
  const distance = size * 2.05;
  const elevation = ((dish.heightCm ?? 0) > 12 ? 30 : 40) * (Math.PI / 180);
  // Camera angle around the dish (degrees); the slice is shot from the side to show the cut.
  const azimuth = ((dish.azimuth ?? 11) * Math.PI) / 180;
  await renderPhoto(parts, atlas, {
    file: photoFile,
    eye: [
      distance * Math.cos(elevation) * Math.sin(azimuth),
      distance * Math.sin(elevation),
      distance * Math.cos(elevation) * Math.cos(azimuth),
    ],
    target: [0, dish.height, 0],
    extent: Math.max(dish.plateCm / 100, 0.2) * 1.1,
  });

  const vertices = parts.reduce((sum, p) => sum + p.world.length / 3, 0);
  console.log(
    `${sub}${dish.id}: ${(bytes / 1024).toFixed(0)} KB, ${vertices} vertices, atlas ${atlas.width}x${atlas.height}, ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

if (!(await checkModels())) process.exit(1);
