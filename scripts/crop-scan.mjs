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
import { fbm, hex, mix } from "./demo/geometry.mjs";
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
// The table is the LOWEST strong peak, not the biggest: with a plate on a small
// cloth or board, the plate (and the food on it) can have more points than the table.
const bins = [...hist.entries()].sort((a, c) => a[0] - c[0]);
const peak = Math.max(...bins.map(([, n]) => n));
let first = bins.findIndex(([, n]) => n >= peak * 0.25);
while (first + 1 < bins.length && bins[first + 1][0] === bins[first][0] + 1 && bins[first + 1][1] > bins[first][1]) first++;
const tableY = bins[first][0] * bin;

// --- 2. Plate: bright, unsaturated texels a little above the table ---------
const samples = [];
const wellHeights = [];
const whiteOf = new Map(); // prim -> Uint8Array (1 = plate-white texel)
// Stricter: bright AND colorless. Glazed china is neutral white; pale food (a bun's
// underside, fries' edges) is warm, so inside the food's footprint only this counts as plate.
const neutralOf = new Map();
for (const prim of prims) {
  const tex = prim.getMaterial()?.getBaseColorTexture();
  const uv = prim.getAttribute("TEXCOORD_0")?.getArray();
  if (!tex || !uv) continue;
  const { data, info } = await sharp(Buffer.from(tex.getImage())).resize(1024, 1024, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const pos = prim.getAttribute("POSITION").getArray();
  const white = new Uint8Array(pos.length / 3);
  const neutral = new Uint8Array(pos.length / 3);
  for (let i = 0; i < pos.length / 3; i++) {
    const px = Math.min(info.width - 1, Math.max(0, Math.floor(uv[i * 2] * info.width)));
    const py = Math.min(info.height - 1, Math.max(0, Math.floor(uv[i * 2 + 1] * info.height)));
    const o = (py * info.width + px) * 3;
    const [r, g, bl] = [data[o], data[o + 1], data[o + 2]];
    const max = Math.max(r, g, bl);
    const min = Math.min(r, g, bl);
    white[i] = max > 165 && max - min < 50 ? 1 : 0;
    neutral[i] = max > 185 && (max - min) / max < 0.12 ? 1 : 0;
    const y = pos[i * 3 + 1] - tableY;
    if (y < 0.004 || y > 0.035) continue; // plate rim height band
    if (max > 175 && max - min < 45) {
      samples.push([pos[i * 3], pos[i * 3 + 2]]);
      wellHeights.push(y);
    }
  }
  whiteOf.set(prim, white);
  neutralOf.set(prim, neutral);
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
// With --replace-plate: food is cut flat this far above the plate, then a "skirt"
// takes its bottom edge down onto the new plate (see addSkirt).
const FLOOR = 0.005;
// The cut is flat, so most of the rim sits at FLOOR; skirting up to 8 mm above it
// also closes the notches that were bitten higher into the food.
const SKIRT_BAND = 0.008;

// The food's footprint on the plate (3 mm cells, grown by 6 mm): pale parts of the
// food itself (the underside of a bun, a fry's edge) sit inside it and are kept;
// white outside it is the old plate. Without this the white filter bites notches
// into pale food and the rim comes out torn.
const FOOT_CELL = 0.003;
const footN = Math.ceil((radius * 2) / FOOT_CELL) + 1;
const footprint = new Uint8Array(footN * footN);
if (replacePlate) {
  for (const prim of prims) {
    const pos = prim.getAttribute("POSITION").getArray();
    const white = whiteOf.get(prim);
    if (!white) continue;
    for (let v = 0; v < pos.length / 3; v++) {
      if (white[v] || pos[v * 3 + 1] < wellY + 0.009) continue;
      const gx = Math.floor((pos[v * 3] - cx + radius) / FOOT_CELL);
      const gz = Math.floor((pos[v * 3 + 2] - cz + radius) / FOOT_CELL);
      if (gx < 0 || gz < 0 || gx >= footN || gz >= footN) continue;
      for (let dz = -2; dz <= 2; dz++)
        for (let dx = -2; dx <= 2; dx++) {
          const x = gx + dx;
          const z = gz + dz;
          if (x >= 0 && z >= 0 && x < footN && z < footN) footprint[z * footN + x] = 1;
        }
    }
  }
}
const inFootprint = (x, z) => {
  const gx = Math.floor((x - cx + radius) / FOOT_CELL);
  const gz = Math.floor((z - cz + radius) / FOOT_CELL);
  return gx >= 0 && gz >= 0 && gx < footN && gz < footN && footprint[gz * footN + gx] === 1;
};
let kept = 0;
let removed = 0;
for (const prim of prims) {
  const pos = prim.getAttribute("POSITION").getArray();
  const idxAcc = prim.getIndices();
  const idx = idxAcc.getArray();
  const keep = [];
  const white = whiteOf.get(prim);
  const neutral = neutralOf.get(prim);
  const inside = (v) => Math.hypot(pos[v * 3] - cx, pos[v * 3 + 2] - cz) <= keepR && pos[v * 3 + 1] >= tableY - 0.0015;
  // Food = colored, or standing clearly above the plate surface.
  // (white food like rice or cream must rise clearly above the plate's rim).
  // With the plate replaced, food sits ON it: anything below the well is the old plate underside.
  const food = (v) =>
    ((white && !white[v]) || pos[v * 3 + 1] > wellY + 0.018 || (replacePlate && !(neutral && neutral[v]) && inFootprint(pos[v * 3], pos[v * 3 + 2]))) &&
    (!replacePlate || pos[v * 3 + 1] >= wellY + FLOOR);
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

/**
 * Takes the food's open bottom edge (where it was cut flat) straight down onto the
 * plate, reusing the edge's own texture. Without it the food floats over the plate
 * with a torn, see-through rim. Edges are found by position, so texture seams
 * (duplicated vertices) don't count as holes.
 */
function addSkirt(prim, top, plateY) {
  const posAcc = prim.getAttribute("POSITION");
  const pos = posAcc.getArray();
  const idx = prim.getIndices().getArray();
  const key = (v) => `${Math.round(pos[v * 3] * 1e5)},${Math.round(pos[v * 3 + 1] * 1e5)},${Math.round(pos[v * 3 + 2] * 1e5)}`;
  const edges = new Map();
  for (let t = 0; t < idx.length; t += 3) {
    for (const [u, v] of [
      [idx[t], idx[t + 1]],
      [idx[t + 1], idx[t + 2]],
      [idx[t + 2], idx[t]],
    ]) {
      const ku = key(u);
      const kv = key(v);
      const k = ku < kv ? ku + "|" + kv : kv + "|" + ku;
      const e = edges.get(k);
      if (e) e.n++;
      else edges.set(k, { n: 1, u, v });
    }
  }
  const rim = [...edges.values()].filter((e) => e.n === 1 && pos[e.u * 3 + 1] < top && pos[e.v * 3 + 1] < top);
  if (!rim.length) return 0;
  const count = posAcc.getCount();
  for (const semantic of prim.listSemantics()) {
    const acc = prim.getAttribute(semantic);
    const arr = acc.getArray();
    const size = acc.getElementSize();
    const out = new arr.constructor((count + rim.length * 2) * size);
    out.set(arr);
    rim.forEach((e, i) => {
      for (const [src, dst] of [
        [e.u, count + i * 2],
        [e.v, count + i * 2 + 1],
      ]) {
        for (let c = 0; c < size; c++) out[dst * size + c] = arr[src * size + c];
        if (semantic === "POSITION") out[dst * size + 1] = plateY;
      }
    });
    acc.setArray(out);
  }
  // Same winding as the neighbouring surface (the edge runs u->v in its triangle).
  const out = new Uint32Array(idx.length + rim.length * 6);
  out.set(idx);
  rim.forEach((e, i) => {
    const u2 = count + i * 2;
    const v2 = count + i * 2 + 1;
    out.set([e.v, e.u, u2, e.v, u2, v2], idx.length + i * 6);
  });
  prim.getIndices().setArray(out);
  return rim.length;
}
if (replacePlate) {
  let skirted = 0;
  for (const prim of doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives())) {
    if (prim.getIndices()?.getCount()) skirted += addSkirt(prim, wellY + FLOOR + SKIRT_BAND, wellY - 0.0005);
  }
  if (skirted) console.log(`Closed the food's bottom edge onto the plate (${skirted} edges).`);
}

if (replacePlate) {
  const diameterCm = Number(values["plate-cm"]) || Math.round(radius * 200 * 2) / 2;
  // Contact shadow: where the food rests on the plate, the glaze is a little darker
  // (soft, about 1 cm wide). Without it the food looks pasted onto a perfect plate.
  const CELL = 0.003;
  const N = Math.ceil((radius * 2) / CELL) + 1;
  const occ = new Float32Array(N * N);
  for (const prim of prims) {
    const pos = prim.getAttribute("POSITION")?.getArray();
    if (!pos) continue;
    for (let i = 0; i < pos.length; i += 3) {
      const h = pos[i + 1] - wellY;
      const w = h < 0.012 ? 1 : h < 0.03 ? 1 - (h - 0.012) / 0.018 : 0;
      if (w <= 0) continue;
      const gx = Math.floor((pos[i] - cx + radius) / CELL);
      const gz = Math.floor((pos[i + 2] - cz + radius) / CELL);
      if (gx >= 0 && gz >= 0 && gx < N && gz < N) occ[gz * N + gx] += w;
    }
  }
  // Two box-blur passes (radius 4 cells = 1.2 cm) give a soft falloff.
  const blur = (src) => {
    const tmp = new Float32Array(N * N);
    const out = new Float32Array(N * N);
    const R = 4;
    for (let z = 0; z < N; z++)
      for (let x = 0; x < N; x++) {
        let sum = 0;
        for (let d = -R; d <= R; d++) sum += src[z * N + Math.min(N - 1, Math.max(0, x + d))];
        tmp[z * N + x] = sum / (2 * R + 1);
      }
    for (let z = 0; z < N; z++)
      for (let x = 0; x < N; x++) {
        let sum = 0;
        for (let d = -R; d <= R; d++) sum += tmp[Math.min(N - 1, Math.max(0, z + d)) * N + x];
        out[z * N + x] = sum / (2 * R + 1);
      }
    return out;
  };
  const shadow = blur(blur(occ));
  const peak = Math.max(...shadow) || 1;
  const shadowAt = (x, z) => {
    const gx = Math.floor((x + radius) / CELL);
    const gz = Math.floor((z + radius) / CELL);
    if (gx < 0 || gz < 0 || gx >= N || gz >= N) return 0;
    return Math.min(1, (shadow[gz * N + gx] / peak) * 2.2);
  };
  const glaze = (q) => {
    const base = mix(hex("#fbfaf7"), hex("#eeebe5"), fbm(q, 18, 2) * 0.45);
    const k = 1 - 0.42 * shadowAt(q[0], q[2]);
    return [base[0] * k, base[1] * k, base[2] * k];
  };
  const { part } = makePlate(diameterCm, Math.max(0.004, wellY - tableY), glaze);
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
