// Cuts a plated dish out of a phone scan that also captured the table and
// things around it (napkin holders, bottles, QR stands...).
//
//   node scripts/crop-scan.mjs <scan.glb|.obj> <out.glb> [--plate-cm 26] [--replace-plate]
//
// How: (1) the table is the most common height in the scan; (2) the plate is
// the ring of bright, low-saturation (white/cream) surface just above the
// table; its center and radius come from those points; (3) everything outside
// that circle, and anything below the table, is removed.
// If --plate-cm is given it's only used to sanity-check the detected size.
//
// --replace-plate keeps only the scanned FOOD and puts it on a clean, exact
// plate. White glazed plates are the hardest thing to scan (no texture,
// reflections), so they come out lumpy; food scans well. The new plate has
// the measured diameter (or the detected one) and sits where the old one was.

import { parseArgs } from "node:util";
import sharp from "sharp";

import { compactPrimitive, prune } from "@gltf-transform/functions";
import { MATERIALS, bake, createIO } from "./demo/export.mjs";
import { plate as makePlate } from "./demo/ironside.mjs";
import { readObj } from "./demo/obj.mjs";
import { removeIslands } from "./demo/scan-cleanup.mjs";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { "plate-cm": { type: "string" }, "replace-plate": { type: "boolean", default: false } },
});
const [input, output] = positionals;
if (!input || !output) {
  console.error("Usage: node scripts/crop-scan.mjs <scan.glb|.obj> <out.glb> [--plate-cm 26]");
  process.exit(1);
}

const io = await createIO();
const doc = input.toLowerCase().endsWith(".obj") ? await readObj(input) : await io.read(input);
const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
const prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());

// --- 1. Table height: the mode of vertex heights (2 mm bins) ---------------

const bin = 0.002;
const hist = new Map();
for (const prim of prims) {
  const pos = prim.getAttribute("POSITION").getArray();
  for (let i = 1; i < pos.length; i += 3) {
    const k = Math.round(pos[i] / bin);
    hist.set(k, (hist.get(k) ?? 0) + 1);
  }
}
const tableY = [...hist.entries()].sort((a, c) => c[1] - a[1])[0][0] * bin;

// --- 2. Plate: bright, unsaturated texels a little above the table ---------
const samples = [];
const wellHeights = [];
const whiteOf = new Map(); // prim -> Uint8Array (1 = plate-white texel)
for (const prim of prims) {
  const tex = prim.getMaterial()?.getBaseColorTexture();
  const uv = prim.getAttribute("TEXCOORD_0")?.getArray();
  if (!tex || !uv) continue;
  const { data, info } = await sharp(Buffer.from(tex.getImage())).resize(1024, 1024, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const pos = prim.getAttribute("POSITION").getArray();
  const white = new Uint8Array(pos.length / 3);
  for (let i = 0; i < pos.length / 3; i++) {
    const px = Math.min(info.width - 1, Math.max(0, Math.floor(uv[i * 2] * info.width)));
    const py = Math.min(info.height - 1, Math.max(0, Math.floor(uv[i * 2 + 1] * info.height)));
    const o = (py * info.width + px) * 3;
    const [r, g, bl] = [data[o], data[o + 1], data[o + 2]];
    const max = Math.max(r, g, bl);
    const min = Math.min(r, g, bl);
    white[i] = max > 165 && max - min < 50 ? 1 : 0;
    const y = pos[i * 3 + 1] - tableY;
    if (y < 0.004 || y > 0.035) continue; // plate rim height band
    if (max > 175 && max - min < 45) {
      samples.push([pos[i * 3], pos[i * 3 + 2]]);
      wellHeights.push(y);
    }
  }
  whiteOf.set(prim, white);
}
if (samples.length < 50) {
  console.error("Couldn't find a white plate in the scan. Crop it in the scanning app instead.");
  process.exit(2);
}
// Robust center: median of the samples, refined once.
const median = (arr) => {
  const s = [...arr].sort((a, c) => a - c);
  return s[Math.floor(s.length / 2)];
};
let cx = median(samples.map((s) => s[0]));
let cz = median(samples.map((s) => s[1]));
for (let pass = 0; pass < 3; pass++) {
  const d = samples.map(([x, z]) => Math.hypot(x - cx, z - cz));
  const r95 = [...d].sort((a, c) => a - c)[Math.floor(d.length * 0.95)];
  const inner = samples.filter((_, i) => d[i] <= r95);
  // The rim is a ring: its bounding box center is the plate center.
  const xs = inner.map((s) => s[0]);
  const zs = inner.map((s) => s[1]);
  cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  cz = (Math.min(...zs) + Math.max(...zs)) / 2;
}
const dist = samples.map(([x, z]) => Math.hypot(x - cx, z - cz)).sort((a, c) => a - c);
const radius = dist[Math.floor(dist.length * 0.985)];
console.log(`Table at y=${tableY.toFixed(3)}; plate at (${cx.toFixed(3)}, ${cz.toFixed(3)}), diameter ${(radius * 200).toFixed(1)} cm (as scanned)`);
if (values["plate-cm"]) {
  const stated = Number(values["plate-cm"]);
  console.log(`You measured ${stated} cm: the scan's own scale is off by ${(((radius * 200) / stated - 1) * 100).toFixed(1)}% (import-model fixes this).`);
}

// --- 3. Keep only triangles inside the plate circle and above the table ------
const replacePlate = values["replace-plate"];
const wellY = tableY + median(wellHeights.slice().sort((a, c) => a - c).slice(0, Math.ceil(wellHeights.length * 0.4)));
const keepR = replacePlate ? radius * 0.97 : radius * 1.03;
let kept = 0;
let removed = 0;
for (const prim of prims) {
  const pos = prim.getAttribute("POSITION").getArray();
  const idxAcc = prim.getIndices();
  const idx = idxAcc.getArray();
  const keep = [];
  const white = whiteOf.get(prim);
  const inside = (v) => Math.hypot(pos[v * 3] - cx, pos[v * 3 + 2] - cz) <= keepR && pos[v * 3 + 1] >= tableY - 0.0015;
  // Food = colored, or standing clearly above the plate surface.
  // (white food like rice or cream must rise clearly above the plate's rim).
  const food = (v) => (white && !white[v]) || pos[v * 3 + 1] > wellY + 0.018;
  for (let t = 0; t < idx.length; t += 3) {
    const [a, bb, c] = [idx[t], idx[t + 1], idx[t + 2]];
    if (!(inside(a) && inside(bb) && inside(c))) continue;
    if (replacePlate && !(food(a) && food(bb) && food(c))) continue;
    keep.push(a, bb, c);
  }
  kept += keep.length / 3;
  removed += (idx.length - keep.length) / 3;
  idxAcc.setArray(idx instanceof Uint32Array ? new Uint32Array(keep) : new Uint16Array(keep));
  compactPrimitive(prim);
}
const crumbs = removeIslands(doc);
if (crumbs) console.log(`Removed ${crumbs} triangles of loose crumbs (small disconnected pieces).`);

if (replacePlate) {
  const diameterCm = Number(values["plate-cm"]) || Math.round(radius * 200 * 2) / 2;
  const { part } = makePlate(diameterCm, Math.max(0.004, wellY - tableY));
  part.move(cx, tableY, cz);
  const atlas = bake([part], 512);
  const jpeg = await sharp(Buffer.from(atlas.srgb), { raw: { width: atlas.width, height: atlas.height, channels: 3 } }).jpeg({ quality: 90 }).toBuffer();
  const buffer = doc.getRoot().listBuffers()[0] ?? doc.createBuffer();
  const material = doc
    .createMaterial("ceramic")
    .setBaseColorTexture(doc.createTexture("plate").setImage(new Uint8Array(jpeg)).setMimeType("image/jpeg"))
    .setRoughnessFactor(MATERIALS.ceramic)
    .setMetallicFactor(0);
  const prim = doc
    .createPrimitive()
    .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(part.world)).setBuffer(buffer))
    .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(part.normals()).setBuffer(buffer))
    .setAttribute("TEXCOORD_0", doc.createAccessor().setType("VEC2").setArray(part.uv).setBuffer(buffer))
    .setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(part.indices())).setBuffer(buffer))
    .setMaterial(material);
  scene.addChild(doc.createNode("ceramic").setMesh(doc.createMesh("plate").addPrimitive(prim)));
  console.log(`Replaced the scanned plate with a clean ${diameterCm} cm plate.`);
}
await doc.transform(prune());
await io.write(output, doc);
console.log(`Kept ${kept} triangles, removed ${removed} (table, background, under-table). Saved ${output}`);
