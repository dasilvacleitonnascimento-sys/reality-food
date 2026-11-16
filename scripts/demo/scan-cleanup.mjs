// Post-processing for phone scans: remove loose crumbs and make the food's
// color look right (white balance from the white plate, gentle contrast and
// saturation). Used by crop-scan and import-model.

import sharp from "sharp";
import { compactPrimitive } from "@gltf-transform/functions";

/**
 * Removes small disconnected pieces (scan noise, specks of the old plate).
 * Connectivity is by vertex position, so UV seams don't split real pieces.
 * Returns how many triangles were removed.
 */
export function removeIslands(doc, { minTriangles = 80, minFraction = 0.002 } = {}) {
  let removed = 0;
  for (const prim of doc.getRoot().listMeshes().flatMap((m) => m.listPrimitives())) {
    const idxAcc = prim.getIndices();
    if (!idxAcc) continue;
    const pos = prim.getAttribute("POSITION").getArray();
    const idx = idxAcc.getArray();
    // Weld by position (0.05 mm) for connectivity only.
    const canon = new Int32Array(pos.length / 3);
    const seen = new Map();
    for (let i = 0; i < canon.length; i++) {
      const key = `${Math.round(pos[i * 3] * 20000)},${Math.round(pos[i * 3 + 1] * 20000)},${Math.round(pos[i * 3 + 2] * 20000)}`;
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
      const b = find(canon[idx[t + 1]]);
      const c = find(canon[idx[t + 2]]);
      parent[b] = a;
      parent[find(c)] = a;
    }
    const size = new Map();
    for (let t = 0; t < idx.length; t += 3) {
      const r = find(canon[idx[t]]);
      size.set(r, (size.get(r) ?? 0) + 1);
    }
    const limit = Math.max(minTriangles, (idx.length / 3) * minFraction);
    const keep = [];
    for (let t = 0; t < idx.length; t += 3) {
      if (size.get(find(canon[idx[t]])) >= limit) keep.push(idx[t], idx[t + 1], idx[t + 2]);
    }
    removed += (idx.length - keep.length) / 3;
    if (keep.length !== idx.length) {
      idxAcc.setArray(idx instanceof Uint32Array ? new Uint32Array(keep) : new Uint16Array(keep));
      compactPrimitive(prim);
    }
  }
  return removed;
}

/**
 * Color-corrects every base color texture:
 *  - white balance: bright, low-saturation texels (the plate, rice, cream)
 *    are pulled toward neutral white (half strength, so food keeps its warmth);
 *  - contrast: levels stretched between the 0.5% and 99.5% luminance points;
 *  - +4% saturation (subtle: scans already carry the real color).
 * Returns a short description of what changed.
 */
export async function enhanceTextures(doc) {
  const notes = [];
  for (const texture of doc.getRoot().listTextures()) {
    // Normal/roughness maps are data, not color: only touch base color textures.
    const isColor = doc
      .getRoot()
      .listMaterials()
      .some((m) => m.getBaseColorTexture() === texture);
    if (!isColor) continue;
    const input = Buffer.from(texture.getImage());
    const data = await sharp(input).removeAlpha().resize(512, 512, { fit: "fill" }).raw().toBuffer();

    const whites = [0, 0, 0];
    let whiteCount = 0;
    const lum = [];
    for (let i = 0; i < data.length; i += 3) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      lum.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
      if (max > 170 && max - min < 40) {
        whites[0] += r;
        whites[1] += g;
        whites[2] += b;
        whiteCount++;
      }
    }
    // White balance gains (half strength), only if there's enough white to trust.
    let gains = [1, 1, 1];
    if (whiteCount > data.length / 3 / 100) {
      const avg = whites.map((v) => v / whiteCount);
      const target = (avg[0] + avg[1] + avg[2]) / 3;
      gains = avg.map((v) => 1 + (target / v - 1) * 0.5);
    }
    lum.sort((a, b) => a - b);
    const lo = lum[Math.floor(lum.length * 0.005)];
    const hi = lum[Math.floor(lum.length * 0.995)];
    // Gentle: strong contrast/saturation made buns look orange (burger scan, 16/11).
    const scale = hi > lo ? Math.min(1.08, 245 / (hi - lo)) : 1;
    const offset = -lo * scale + 4;

    const out = await sharp(input)
      .removeAlpha()
      .recomb([
        [gains[0], 0, 0],
        [0, gains[1], 0],
        [0, 0, gains[2]],
      ])
      .linear(scale, offset)
      .modulate({ saturation: 1.04 })
      .jpeg({ quality: 92 })
      .toBuffer();
    texture.setImage(new Uint8Array(out)).setMimeType("image/jpeg");
    notes.push(`white balance ${gains.map((g) => g.toFixed(2)).join("/")}, contrast x${scale.toFixed(2)}, saturation +4%`);
  }
  return notes;
}
