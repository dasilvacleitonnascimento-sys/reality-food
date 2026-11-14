// Turns a phone scan (RealityScan, Polycam, Object Capture...) into a
// true-size, AR-ready dish model.
//
//   npm run import-model -- <scan.glb> --plate 28 --out ironside/avocado-toast
//
// Options
//   --plate <cm>     Plate (or bowl/saucer) diameter measured with a ruler. Required.
//   --out <path>     Output under public/models (no extension).
//   --up <y|z|x|auto> Which axis is "up" in the scan. Default auto: a plated dish is
//                    flat, so its shortest side is the height.
//   --flip           The dish came out upside down.
//   --max-tris <n>   Triangle budget (default 150000).
//   --texture <px>   Max texture size (default 2048).
//   --no-enhance     Keep the scan's raw colors (default: white balance from the
//                    plate, gentle contrast and +10% saturation).
//
// What it does
//   1. Levels the model and sets the plate's widest point to exactly --plate cm
//      (the plate is the one thing we can measure precisely, so it calibrates scale).
//   2. Centers it and sets it on the table (lowest point at y = 0).
//   3. Simplifies the mesh, shrinks textures, Draco-compresses (restaurant Wi-Fi).
//   4. Prints the final size so you can double-check it against the real dish.
//
// Tip: crop the table/background away in the scanning app before exporting:
// the widest thing in the file must be the plate.

import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { getBounds } from "@gltf-transform/core";
import { dedup, draco, flatten, join, prune, simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { createIO } from "./demo/export.mjs";
import { enhanceTextures } from "./demo/scan-cleanup.mjs";

const root = path.resolve(import.meta.dirname, "..");
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    plate: { type: "string" },
    out: { type: "string" },
    up: { type: "string", default: "auto" },
    flip: { type: "boolean", default: false },
    "max-tris": { type: "string", default: "150000" },
    texture: { type: "string", default: "2048" },
    "no-enhance": { type: "boolean", default: false },
  },
});

const input = positionals[0];
const plateCm = Number(values.plate);
if (!input || !plateCm || !values.out) {
  console.error("Usage: npm run import-model -- <scan.glb> --plate <cm> --out <restaurant>/<dish-id>");
  process.exit(1);
}

const io = await createIO();

const doc = await io.read(input);
const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
const countTris = () =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute("POSITION").getCount()) / 3, 0);
console.log(`Read ${path.basename(input)}: ${Math.round(countTris())} triangles`);

// Bake every node transform into the meshes so we can re-orient one root.
await doc.transform(flatten(), dedup(), join(), weld());

// Orientation: wrap everything in a root node we control.
const wrapper = doc.createNode("dish");
for (const child of scene.listChildren()) {
  scene.removeChild(child);
  wrapper.addChild(child);
}
scene.addChild(wrapper);
const quat = (axis, angle) => {
  const s = Math.sin(angle / 2);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
};
let up = values.up;
if (up === "auto") {
  const sb = getBounds(scene);
  const ext = [0, 1, 2].map((i) => sb.max[i] - sb.min[i]);
  const shortest = ext.indexOf(Math.min(...ext));
  // Only trust it when the dish is clearly flat (plates); tall things stay Y-up.
  up = Math.min(...ext) / Math.max(...ext) < 0.6 ? ["x", "y", "z"][shortest] : "y";
  console.log(`Up axis: ${up} (auto)`);
}
const toUp = { y: [0, 0, 0, 1], z: quat([1, 0, 0], -Math.PI / 2), x: quat([0, 0, 1], Math.PI / 2) };
let rotation = toUp[up] ?? toUp.y;
if (values.flip) {
  const f = quat([1, 0, 0], Math.PI);
  // flip * rotation (quaternion product)
  const [ax, ay, az, aw] = f;
  const [bx, by, bz, bw] = rotation;
  rotation = [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz];
}
wrapper.setRotation(rotation);

// Scale from the plate: its widest horizontal extent becomes exactly plateCm.
let b = getBounds(scene);
const width = Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]);
const scale = plateCm / 100 / width;
wrapper.setScale([scale, scale, scale]);
b = getBounds(scene);
wrapper.setTranslation([-(b.max[0] + b.min[0]) / 2, -b.min[1], -(b.max[2] + b.min[2]) / 2]);

// Lighter for phones: fewer triangles, smaller textures, Draco geometry.
const maxTris = Number(values["max-tris"]);
const tris = countTris();
if (tris > maxTris) {
  await MeshoptSimplifier.ready;
  await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: maxTris / tris, error: 0.0005 }));
}
if (!values["no-enhance"]) {
  for (const note of await enhanceTextures(doc)) console.log(`Color: ${note}`);
}
const px = Number(values.texture);
await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: "jpeg", resize: [px, px], quality: 85 }),
  prune(),
  draco({ method: "edgebreaker", quantizePosition: 16 }),
);

const outFile = path.join(root, "public", "models", `${values.out}.glb`);
await mkdir(path.dirname(outFile), { recursive: true });
await io.write(outFile, doc);

const fb = getBounds(doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0]);
const cmOf = (i) => ((fb.max[i] - fb.min[i]) * 100).toFixed(1);
const { size } = await stat(outFile);
console.log(`
Saved public/models/${values.out}.glb (${(size / 1024 / 1024).toFixed(2)} MB, ${Math.round(countTris())} triangles)
Size: ${cmOf(0)} x ${cmOf(2)} cm, ${cmOf(1)} cm tall (plate set to ${plateCm} cm)

Check it against the real dish. If it's lying on its side, run again with
--up y or --up z. If it's upside down, add --flip.
Then add the dish to the restaurant data with glbUrl "/models/${values.out}.glb"
and plateDiameterCm: ${plateCm}, and run: npm run check-models`);
if (size > 5 * 1024 * 1024) console.warn("Warning: over 5 MB. Try --max-tris 80000 --texture 1536.");
