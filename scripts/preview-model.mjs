// Renders preview images of any .glb (e.g. a phone scan) so it can be checked
// without a phone: a top view and a 3/4 view on a wooden table.
//
//   node scripts/preview-model.mjs <model.glb> <out-prefix>
//
// Writes <out-prefix>-top.jpg and <out-prefix>-34.jpg.

import path from "node:path";
import sharp from "sharp";
import { getBounds } from "@gltf-transform/core";
import { createIO } from "./demo/export.mjs";
import { renderPhoto } from "./demo/render.mjs";

const [input, outPrefix] = process.argv.slice(2);
if (!input || !outPrefix) {
  console.error("Usage: node scripts/preview-model.mjs <model.glb> <out-prefix>");
  process.exit(1);
}

const io = await createIO();
const doc = await io.read(input);
const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
const bounds = getBounds(scene);

// Collect world-space triangles from every mesh node. Each primitive's texture
// becomes one 1024px slot in a vertically stacked atlas.
const parts = [];
const slots = [];
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const m = node.getWorldMatrix();
  for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute("POSITION");
    const uvAttr = prim.getAttribute("TEXCOORD_0");
    const count = pos.getCount();
    const world = new Float64Array(count * 3);
    const p = [0, 0, 0];
    for (let i = 0; i < count; i++) {
      pos.getElement(i, p);
      world[i * 3] = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
      world[i * 3 + 1] = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
      world[i * 3 + 2] = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14];
    }
    const idx = prim.getIndices() ? Array.from(prim.getIndices().getArray()) : [...Array(count).keys()];
    const uv = new Float32Array(count * 2);
    if (uvAttr) {
      const t = [0, 0];
      for (let i = 0; i < count; i++) {
        uvAttr.getElement(i, t);
        uv[i * 2] = t[0];
        uv[i * 2 + 1] = t[1];
      }
    }
    // Flat-ish normals from the triangles (scans' own normals may be missing).
    const nrm = new Float32Array(count * 3);
    for (let t = 0; t < idx.length; t += 3) {
      const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
      const e1 = [world[b * 3] - world[a * 3], world[b * 3 + 1] - world[a * 3 + 1], world[b * 3 + 2] - world[a * 3 + 2]];
      const e2 = [world[c * 3] - world[a * 3], world[c * 3 + 1] - world[a * 3 + 1], world[c * 3 + 2] - world[a * 3 + 2]];
      const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      for (const v of [a, b, c]) for (let k = 0; k < 3; k++) nrm[v * 3 + k] += n[k];
    }
    for (let i = 0; i < count; i++) {
      const l = Math.hypot(nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]) || 1;
      for (let k = 0; k < 3; k++) nrm[i * 3 + k] /= l;
    }
    const tex = prim.getMaterial()?.getBaseColorTexture();
    const slot = slots.length;
    slots.push(tex ? Buffer.from(tex.getImage()) : null);
    parts.push({ world, uv, slot, material: prim.getMaterial()?.getName() === "ceramic" ? "ceramic" : "satin", indices: () => idx, normals: () => nrm });
  }
}
const SLOT = 1024;
const stacked = new Float32Array(SLOT * SLOT * slots.length * 3);
for (const [i, image] of slots.entries()) {
  const data = image
    ? (await sharp(image).resize(SLOT, SLOT, { fit: "fill" }).removeAlpha().raw().toBuffer())
    : Buffer.alloc(SLOT * SLOT * 3, 205);
  for (let k = 0; k < data.length; k++) {
    const c = data[k] / 255;
    stacked[i * SLOT * SLOT * 3 + k] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }
}
const atlas = { width: SLOT, height: SLOT * slots.length, linear: stacked };
for (const part of parts) {
  for (let i = 1; i < part.uv.length; i += 2) part.uv[i] = (Math.min(Math.max(part.uv[i], 0), 1) + part.slot) / slots.length;
}

const center = [(bounds.max[0] + bounds.min[0]) / 2, bounds.min[1], (bounds.max[2] + bounds.min[2]) / 2];
const size = Math.max(bounds.max[0] - bounds.min[0], bounds.max[2] - bounds.min[2]);
const height = bounds.max[1] - bounds.min[1];
// Lift everything so the lowest point sits on the rendered table (y = 0).
for (const part of parts) for (let i = 0; i < part.world.length; i += 3) part.world[i + 1] -= bounds.min[1];

const views = {
  top: { eye: [center[0] + 0.0001, size * 1.9, center[2] + size * 0.02], fov: 34 },
  34: { eye: [center[0] + size * 0.35, size * 1.05, center[2] + size * 1.45], fov: 34 },
};
for (const [name, v] of Object.entries(views)) {
  await renderPhoto(parts, atlas, {
    file: `${outPrefix}-${name}.jpg`,
    eye: v.eye,
    target: [center[0], height * 0.3, center[2]],
    fov: v.fov,
    extent: size * 0.75,
    width: 900,
    height: 675,
  });
}
console.log(`${path.basename(input)}: ${(size * 100).toFixed(1)} cm wide, ${(height * 100).toFixed(1)} cm tall -> ${outPrefix}-top.jpg, ${outPrefix}-34.jpg`);
