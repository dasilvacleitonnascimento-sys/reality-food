// Keeps only the FOOD from a phone scan and puts it on a clean, exact plate.
// For dishes served on paper, in baskets or trays, and for scans without a
// real-world scale (RealityScan "standard" mode), where crop-scan can't use
// the plate as a reference.
//
//   node scripts/food-only.mjs <scan.obj|.glb> <out.glb> --food-cm 12 --plate-cm 25
//
// --food-cm   the widest size of the food itself, measured with a ruler
//             (for a burger: across the bun or patty, whichever is wider)
// --plate-cm  the plate it will be shown on
//
// How: (1) the table is the most common height; (2) white, unsaturated
// surfaces (paper, napkins, the old plate) and anything at table height are
// dropped; (3) the biggest connected piece is the food (QR stands, cups and
// crumbs around it are separate pieces and get dropped); (4) the food is
// scaled so its widest size is --food-cm and set on a new plate.

import { parseArgs } from "node:util";
import sharp from "sharp";

import { compactPrimitive, prune } from "@gltf-transform/functions";
import { MATERIALS, bake, createIO } from "./demo/export.mjs";
import { plate as makePlate } from "./demo/ironside.mjs";
import { readObj } from "./demo/obj.mjs";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { "food-cm": { type: "string" }, "plate-cm": { type: "string" } },
});
const [input, output] = positionals;
const foodCm = Number(values["food-cm"]);
const plateCm = Number(values["plate-cm"]);
if (!input || !output || !(foodCm > 0) || !(plateCm > foodCm)) {
  console.error("Usage: node scripts/food-only.mjs <scan.obj|.glb> <out.glb> --food-cm <cm> --plate-cm <cm>  (plate bigger than food)");
  process.exit(1);
}

const io = await createIO();
const doc = input.toLowerCase().endsWith(".obj") ? await readObj(input) : await io.read(input);
const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
const prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());

// --- 1. Table height (the scan's units are arbitrary, so bins are relative) --
let minY = Infinity;
let maxY = -Infinity;
for (const prim of prims) {
  const pos = prim.getAttribute("POSITION").getArray();
  for (let i = 1; i < pos.length; i += 3) {
    minY = Math.min(minY, pos[i]);
    maxY = Math.max(maxY, pos[i]);
  }
}
const extent = maxY - minY;
const bin = extent / 2000;
const hist = new Map();
for (const prim of prims) {
  const pos = prim.getAttribute("POSITION").getArray();
  for (let i = 1; i < pos.length; i += 3) {
    const k = Math.round(pos[i] / bin);
    hist.set(k, (hist.get(k) ?? 0) + 1);
  }
}
const tableY = [...hist.entries()].sort((a, c) => c[1] - a[1])[0][0] * bin;
const aboveTable = tableY + extent * 0.006;

// --- 2. Drop white/unsaturated texels (paper, napkins, plate) and the table --
let kept = 0;
for (const prim of prims) {
  const tex = prim.getMaterial()?.getBaseColorTexture();
  const uv = prim.getAttribute("TEXCOORD_0")?.getArray();
  const pos = prim.getAttribute("POSITION").getArray();
  let white = null;
  if (tex && uv) {
    const { data, info } = await sharp(Buffer.from(tex.getImage())).resize(1024, 1024, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    white = new Uint8Array(pos.length / 3);
    for (let i = 0; i < white.length; i++) {
      const px = Math.min(info.width - 1, Math.max(0, Math.floor(uv[i * 2] * info.width)));
      const py = Math.min(info.height - 1, Math.max(0, Math.floor(uv[i * 2 + 1] * info.height)));
      const o = (py * info.width + px) * 3;
      const max = Math.max(data[o], data[o + 1], data[o + 2]);
      const min = Math.min(data[o], data[o + 1], data[o + 2]);
      white[i] = max > 160 && max - min < 45 ? 1 : 0;
    }
  }
  const food = (v) => pos[v * 3 + 1] > aboveTable && !(white && white[v]);
  const idxAcc = prim.getIndices();
  const idx = idxAcc.getArray();
  const keep = [];
  for (let t = 0; t < idx.length; t += 3) {
    if (food(idx[t]) && food(idx[t + 1]) && food(idx[t + 2])) keep.push(idx[t], idx[t + 1], idx[t + 2]);
  }
  idxAcc.setArray(new Uint32Array(keep));
  compactPrimitive(prim);
}

// --- 3. Keep the biggest connected piece (plus pieces sitting on it) ---------
const weld = extent / 20000;
const pieces = []; // { prim, tris: number[], bbox }
for (const prim of prims) {
  const pos = prim.getAttribute("POSITION").getArray();
  const idx = prim.getIndices().getArray();
  const canon = new Int32Array(pos.length / 3);
  const seen = new Map();
  for (let i = 0; i < canon.length; i++) {
    const key = `${Math.round(pos[i * 3] / weld)},${Math.round(pos[i * 3 + 1] / weld)},${Math.round(pos[i * 3 + 2] / weld)}`;
    if (!seen.has(key)) seen.set(key, i);
    canon[i] = seen.get(key);
  }
  const parent = Int32Array.from(canon.keys());
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  for (let t = 0; t < idx.length; t += 3) {
    const a = find(canon[idx[t]]);
    parent[find(canon[idx[t + 1]])] = a;
    parent[find(canon[idx[t + 2]])] = a;
  }
  const groups = new Map();
  for (let t = 0; t < idx.length; t += 3) {
    const r = find(canon[idx[t]]);
    if (!groups.has(r)) groups.set(r, { prim, tris: [], bbox: [Infinity, Infinity, -Infinity, -Infinity] });
    const g = groups.get(r);
    g.tris.push(t);
    for (let k = 0; k < 3; k++) {
      const v = idx[t + k];
      g.bbox[0] = Math.min(g.bbox[0], pos[v * 3]);
      g.bbox[1] = Math.min(g.bbox[1], pos[v * 3 + 2]);
      g.bbox[2] = Math.max(g.bbox[2], pos[v * 3]);
      g.bbox[3] = Math.max(g.bbox[3], pos[v * 3 + 2]);
    }
  }
  pieces.push(...groups.values());
}
pieces.sort((a, b) => b.tris.length - a.tris.length);
const main = pieces[0];
if (!main || main.tris.length < 500) {
  console.error("Couldn't find the food in the scan.");
  process.exit(2);
}
const [x0, z0, x1, z1] = main.bbox;
const pad = Math.max(x1 - x0, z1 - z0) * 0.05;
const onMain = (p) => {
  const cx = (p.bbox[0] + p.bbox[2]) / 2;
  const cz = (p.bbox[1] + p.bbox[3]) / 2;
  return cx > x0 - pad && cx < x1 + pad && cz > z0 - pad && cz < z1 + pad && p.tris.length >= 40;
};
const keepPieces = pieces.filter((p) => p === main || onMain(p));
for (const prim of prims) {
  const idxAcc = prim.getIndices();
  const idx = idxAcc.getArray();
  const keep = [];
  for (const p of keepPieces.filter((q) => q.prim === prim)) for (const t of p.tris) keep.push(idx[t], idx[t + 1], idx[t + 2]);
  idxAcc.setArray(new Uint32Array(keep));
  compactPrimitive(prim);
  kept += keep.length / 3;
}
console.log(`Food: ${keepPieces.length} piece(s), ${kept} triangles (dropped ${pieces.length - keepPieces.length} other pieces).`);

// --- 4. Real size: widest food size = --food-cm, centered on a new plate -----
let b = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
for (const prim of prims) {
  const pos = prim.getAttribute("POSITION").getArray();
  for (let i = 0; i < pos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      b[k] = Math.min(b[k], pos[i + k]);
      b[k + 3] = Math.max(b[k + 3], pos[i + k]);
    }
  }
}
const widest = Math.max(b[3] - b[0], b[5] - b[2]);
const s = foodCm / 100 / widest;
const base = 0.006; // the plate's well height (see ironside.mjs plate())
const [cx, cz] = [(b[0] + b[3]) / 2, (b[2] + b[5]) / 2];
for (const prim of prims) {
  const acc = prim.getAttribute("POSITION");
  const pos = acc.getArray().slice();
  for (let i = 0; i < pos.length; i += 3) {
    pos[i] = (pos[i] - cx) * s;
    pos[i + 1] = (pos[i + 1] - b[1]) * s + base;
    pos[i + 2] = (pos[i + 2] - cz) * s;
  }
  acc.setArray(pos);
}
// Scene nodes may carry a transform from the scanning app; the food is now metric.
for (const node of doc.getRoot().listNodes()) node.setMatrix([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
const heightCm = (b[4] - b[1]) * s * 100;
console.log(`Food: ${foodCm} cm wide (as measured), ${heightCm.toFixed(1)} cm tall.`);

const { part } = makePlate(plateCm, base);
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

await doc.transform(prune());
await io.write(output, doc);
console.log(`On a clean ${plateCm} cm plate. Saved ${output}`);
