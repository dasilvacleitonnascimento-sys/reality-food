// Cuts a dish served in a BOWL out of a phone scan, and swaps the scanned bowl
// for a clean ceramic one of the same shape. (crop-scan.mjs is for flat plates:
// on a deep bowl it cuts the walls away and leaves the food floating.)
//
//   node scripts/crop-bowl.mjs <scan.glb|.obj> <out.glb> [--bowl-cm 19]
//
// How: (1) the table is the most common height; (2) the bowl is the bright,
// unsaturated (white/cream) surface above the table: its center, rim radius and
// rim height come from those points; (3) the inside of the bowl is measured
// ring by ring (radius -> height), smoothed, and turned into a clean lathe with a
// rounded lip, outer wall and foot, so the scanned food sits exactly on it;
// (4) only the food is kept: colored surfaces, or anything clearly above the
// measured inside of the bowl (white food like rice or cream must rise above it).
//
// --bowl-cm  rim diameter measured with a ruler. The whole dish is scaled so the
//            rim matches it (phone scans are rarely exact). Without it, the scan's
//            own scale is kept and the printed size is an estimate.
//
// Then: npm run import-model -- <out.glb> --plate <bowl cm> --out <restaurant>/<dish-id>

import { parseArgs } from "node:util";
import sharp from "sharp";
import { compactPrimitive, prune } from "@gltf-transform/functions";
import { MATERIALS, bake, createIO } from "./demo/export.mjs";
import { fbm, hex, lathe, mix } from "./demo/geometry.mjs";
import { readObj } from "./demo/obj.mjs";
import { removeIslands } from "./demo/scan-cleanup.mjs";

const { values, positionals } = parseArgs({ allowPositionals: true, options: { "bowl-cm": { type: "string" } } });
const [input, output] = positionals;
if (!input || !output) {
  console.error("Usage: node scripts/crop-bowl.mjs <scan.glb|.obj> <out.glb> [--bowl-cm 19]");
  process.exit(1);
}

const io = await createIO();
const doc = input.toLowerCase().endsWith(".obj") ? await readObj(input) : await io.read(input);
const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
const prims = doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives());
const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const quantile = (arr, q) => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(s.length * q))];
};

// --- 1. Table height: the mode of vertex heights (2 mm bins) ------------------
const bin = 0.002;
const hist = new Map();
for (const prim of prims) {
  const pos = prim.getAttribute("POSITION").getArray();
  for (let i = 1; i < pos.length; i += 3) {
    const k = Math.round(pos[i] / bin);
    hist.set(k, (hist.get(k) ?? 0) + 1);
  }
}
// In a bowl, the flat white bottom (with the food on it) can outnumber the table,
// so the table is the LOWEST strong peak, not the biggest one.
const bins = [...hist.entries()].sort((a, b) => a[0] - b[0]);
const peak = Math.max(...bins.map(([, c]) => c));
let first = bins.findIndex(([, c]) => c >= peak * 0.25);
while (first + 1 < bins.length && bins[first + 1][0] === bins[first][0] + 1 && bins[first + 1][1] > bins[first][1]) first++;
const tableY = bins[first][0] * bin;

// --- 2. White (bowl) vertices --------------------------------------------------
const whiteOf = new Map();
const whitePts = []; // [x, y above table, z]
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
    const max = Math.max(data[o], data[o + 1], data[o + 2]);
    const min = Math.min(data[o], data[o + 1], data[o + 2]);
    white[i] = max > 165 && max - min < 50 ? 1 : 0;
    const y = pos[i * 3 + 1] - tableY;
    if (white[i] && y > 0.004 && y < 0.15) whitePts.push([pos[i * 3], y, pos[i * 3 + 2]]);
  }
  whiteOf.set(prim, white);
}
if (whitePts.length < 200) {
  console.error("Couldn't find a white bowl in the scan.");
  process.exit(2);
}

// Center: the rim is a ring, so the box of the outer white points is centered on it.
let cx = median(whitePts.map((p) => p[0]));
let cz = median(whitePts.map((p) => p[2]));
for (let pass = 0; pass < 3; pass++) {
  const d = whitePts.map(([x, , z]) => Math.hypot(x - cx, z - cz));
  const r95 = quantile(d, 0.95);
  const inner = whitePts.filter((_, i) => d[i] <= r95);
  const xs = inner.map((p) => p[0]);
  const zs = inner.map((p) => p[2]);
  cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  cz = (Math.min(...zs) + Math.max(...zs)) / 2;
}
const radial = whitePts.map(([x, y, z]) => [Math.hypot(x - cx, z - cz), y]);
const R = quantile(
  radial.map((p) => p[0]),
  0.985,
);
// Rim height: the top of the white points near the rim.
const rimH = quantile(
  radial.filter(([r]) => r > R * 0.85).map((p) => p[1]),
  0.9,
);

// --- 3. Inside profile: radius -> height of the bowl's inner surface ----------
const RINGS = 40;
const ring = Array.from({ length: RINGS }, () => []);
for (const [r, y] of radial) {
  if (r >= R * 0.97) continue;
  ring[Math.min(RINGS - 1, Math.floor((r / R) * RINGS))].push(y);
}
// The inner surface is the upper white layer at each radius (the outer wall is below it).
let prof = ring.map((ys) => (ys.length >= 12 ? quantile(ys, 0.8) : null));
// Food hides the middle: fill from the first ring the bowl shows, down to a flat bottom.
const firstSeen = prof.findIndex((v) => v !== null);
const lowest = Math.min(...prof.filter((v) => v !== null));
prof = prof.map((v, i) => (v === null ? (i < firstSeen ? lowest : null) : v));
for (let i = 1; i < RINGS; i++) if (prof[i] === null) prof[i] = prof[i - 1];
// Smooth (the scanned glaze is lumpy).
for (let pass = 0; pass < 4; pass++) prof = prof.map((v, i) => (prof[Math.max(0, i - 1)] + 2 * v + prof[Math.min(RINGS - 1, i + 1)]) / 4);
// The food rests ON the bowl: the inside can never be higher than the food's lowest
// points in that ring (croutons and sauce sit on the bottom).
const foodRing = Array.from({ length: RINGS }, () => []);
for (const prim of prims) {
  const pos = prim.getAttribute("POSITION").getArray();
  const white = whiteOf.get(prim);
  if (!white) continue;
  for (let i = 0; i < pos.length / 3; i++) {
    if (white[i]) continue;
    const r = Math.hypot(pos[i * 3] - cx, pos[i * 3 + 2] - cz);
    const y = pos[i * 3 + 1] - tableY;
    if (r >= R * 0.97 || y < 0.003) continue;
    foodRing[Math.min(RINGS - 1, Math.floor((r / R) * RINGS))].push(y);
  }
}
prof = prof.map((v, i) => (foodRing[i].length >= 20 ? Math.min(v, quantile(foodRing[i], 0.05) - 0.001) : v));
// Rise steadily toward the rim, only ever lowering (never lifting) the bowl under the food.
for (let i = RINGS - 2; i >= 0; i--) prof[i] = Math.min(prof[i], prof[i + 1]);

const T = 0.005; // wall thickness
const FOOT = 0.006; // foot ring height
const bottomIn = Math.max(prof[0], FOOT + T);
const inner = prof.map((y, i) => [((i + 0.5) / RINGS) * (R * 0.97), Math.min(Math.max(y, bottomIn), rimH)]);
inner.unshift([0, inner[0][1]]);
inner.push([R - T / 2, rimH]);
const insideAt = (r) => {
  for (let i = 1; i < inner.length; i++) {
    if (r <= inner[i][0]) {
      const [r0, y0] = inner[i - 1];
      const [r1, y1] = inner[i];
      return y0 + ((y1 - y0) * (r - r0)) / (r1 - r0 || 1);
    }
  }
  return rimH;
};
console.log(
  `Table at y=${tableY.toFixed(3)}; bowl at (${cx.toFixed(3)}, ${cz.toFixed(3)}), rim ${(R * 200).toFixed(1)} cm wide and ${(rimH * 100).toFixed(1)} cm tall (as scanned)`,
);

// --- 4. Keep only the food ----------------------------------------------------------
let kept = 0;
let removed = 0;
for (const prim of prims) {
  const pos = prim.getAttribute("POSITION").getArray();
  const idxAcc = prim.getIndices();
  const idx = idxAcc.getArray();
  const white = whiteOf.get(prim);
  const keep = [];
  const food = (v) => {
    const r = Math.hypot(pos[v * 3] - cx, pos[v * 3 + 2] - cz);
    const y = pos[v * 3 + 1] - tableY;
    if (r > R * 0.97 || y < 0) return false;
    // Colored, or clearly above the inside of the bowl (white food, leaf highlights).
    return (white && !white[v] && y > insideAt(r) - 0.004) || y > insideAt(r) + 0.012;
  };
  for (let t = 0; t < idx.length; t += 3) {
    if (food(idx[t]) && food(idx[t + 1]) && food(idx[t + 2])) keep.push(idx[t], idx[t + 1], idx[t + 2]);
  }
  kept += keep.length / 3;
  removed += (idx.length - keep.length) / 3;
  idxAcc.setArray(new Uint32Array(keep));
  compactPrimitive(prim);
}
const crumbs = removeIslands(doc);
if (crumbs) console.log(`Removed ${crumbs} triangles of loose pieces.`);

// --- 5. Clean ceramic bowl of the same shape -------------------------------------------
// Inner surface (center -> rim), rounded lip, outer wall (rim -> foot), foot, underside.
const profile = [...inner];
for (let i = 1; i <= 6; i++) {
  const a = (i / 6) * Math.PI;
  profile.push([R - T / 2 + (T / 2) * Math.sin(a), rimH + (T / 2) * Math.sin(a) * 0.6 - (1 - Math.cos(a)) * 0.0004]);
}
// Outer wall: the inner profile pushed out and down by the wall thickness.
for (let i = inner.length - 2; i >= 1; i--) {
  const [r0, y0] = inner[i - 1];
  const [r1, y1] = inner[i + 1];
  const len = Math.hypot(r1 - r0, y1 - y0) || 1;
  const [nr, ny] = [(y1 - y0) / len, -(r1 - r0) / len]; // outward-down normal of the inside
  const r = inner[i][0] + nr * T;
  const y = inner[i][1] + ny * T;
  if (y <= FOOT || r <= R * 0.42) break;
  profile.push([r, y]);
}
const footR = Math.max(R * 0.42, 0.03);
profile.push([footR + 0.003, FOOT], [footR, 0], [footR - 0.006, 0], [footR - 0.008, FOOT * 0.6], [0, FOOT * 0.6]);

const glaze = hex("#f6f3ee");
const bowl = lathe(profile, {
  nu: 128,
  nv: Math.min(160, profile.length * 2),
  material: "ceramic",
  k: 2,
  color: (p) => mix(glaze, hex("#e6e1d8"), fbm(p, 30, 2) * 0.5),
});
bowl.move(cx, tableY, cz);
const atlas = bake([bowl], 512);
const jpeg = await sharp(Buffer.from(atlas.srgb), { raw: { width: atlas.width, height: atlas.height, channels: 3 } }).jpeg({ quality: 90 }).toBuffer();
const buffer = doc.getRoot().listBuffers()[0] ?? doc.createBuffer();
const material = doc
  .createMaterial("ceramic")
  .setBaseColorTexture(doc.createTexture("bowl").setImage(new Uint8Array(jpeg)).setMimeType("image/jpeg"))
  .setRoughnessFactor(MATERIALS.ceramic)
  .setMetallicFactor(0)
  .setDoubleSided(true);
const prim = doc
  .createPrimitive()
  .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(bowl.world)).setBuffer(buffer))
  .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(bowl.normals()).setBuffer(buffer))
  .setAttribute("TEXCOORD_0", doc.createAccessor().setType("VEC2").setArray(bowl.uv).setBuffer(buffer))
  .setIndices(doc.createAccessor().setType("SCALAR").setArray(new Uint32Array(bowl.indices())).setBuffer(buffer))
  .setMaterial(material);
scene.addChild(doc.createNode("bowl").setMesh(doc.createMesh("bowl").addPrimitive(prim)));

// --- 6. True size from the measured rim ---------------------------------------------------
const measured = Number(values["bowl-cm"]);
if (measured) {
  const k = measured / 100 / (2 * R);
  // Scale the vertices themselves around the bowl's base center (no node transforms to keep in sync).
  for (const p of doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives())) {
    const acc = p.getAttribute("POSITION");
    const a = acc.getArray().slice();
    for (let i = 0; i < a.length; i += 3) {
      a[i] = (a[i] - cx) * k;
      a[i + 1] = (a[i + 1] - tableY) * k;
      a[i + 2] = (a[i + 2] - cz) * k;
    }
    acc.setArray(a);
  }
  console.log(`Scaled by ${((k - 1) * 100).toFixed(1)}% so the rim is ${measured} cm (you measured it).`);
} else {
  console.log("No --bowl-cm given: kept the scan's own scale. Measure the bowl's rim with a ruler for true size.");
}

await doc.transform(prune());
await io.write(output, doc);
console.log(`Kept ${kept} food triangles, removed ${removed} (bowl, table, background). Saved ${output}`);
