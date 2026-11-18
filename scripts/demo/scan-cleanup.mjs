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
 *  - saturation nudged toward natural: scans that came out over-saturated (fries,
 *    buns under warm light) are toned down, flat ones get +4%;
 *  - a light sharpen, to win back detail that photo blending softens.
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
    let satSum = 0;
    let satCount = 0;
    const lum = [];
    for (let i = 0; i < data.length; i += 3) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      lum.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
      // Only colored texels (the food), not the grey cloth or white plate around it.
      if (max > 40 && (max - min) / max > 0.2) {
        satSum += (max - min) / max;
        satCount++;
      }
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
    // Average saturation of the food: above ~0.5 reads as "cartoon orange".
    const avgSat = satCount ? satSum / satCount : 0;
    const saturation = avgSat > 0.5 ? Math.max(0.86, 1 - (avgSat - 0.5) * 0.7) : 1.04;

    const out = await sharp(input)
      .removeAlpha()
      .recomb([
        [gains[0], 0, 0],
        [0, gains[1], 0],
        [0, 0, gains[2]],
      ])
      .linear(scale, offset)
      .modulate({ saturation })
      .sharpen({ sigma: 0.8, m1: 0.6, m2: 1.2 })
      .jpeg({ quality: 92 })
      .toBuffer();
    texture.setImage(new Uint8Array(out)).setMimeType("image/jpeg");
    notes.push(`white balance ${gains.map((g) => g.toFixed(2)).join("/")}, contrast x${scale.toFixed(2)}, saturation x${saturation.toFixed(2)} (was ${avgSat.toFixed(2)}), sharpened`);
  }
  return notes;
}

/**
 * Food is not one material: wet greens, onion and tomato shine, meat is satin,
 * bread and fries are matte. Builds a roughness map from each scanned texture's
 * colors (G channel of a metallic-roughness texture) so each part reflects light
 * the way it should. The plate (material "ceramic") keeps its own finish.
 */
export async function addFoodRoughness(doc) {
  const notes = [];
  for (const material of doc.getRoot().listMaterials()) {
    const color = material.getBaseColorTexture();
    if (!color || material.getName() === "ceramic") continue;
    const SIZE = 1024;
    const { data } = await sharp(Buffer.from(color.getImage())).removeAlpha().resize(SIZE, SIZE, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
    const out = Buffer.alloc(SIZE * SIZE * 3);
    const counts = { wet: 0, meat: 0, matte: 0 };
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max ? (max - min) / max : 0;
      let hue = 0;
      if (max !== min) {
        if (max === r) hue = (60 * ((g - b) / (max - min)) + 360) % 360;
        else if (max === g) hue = 60 * ((b - r) / (max - min)) + 120;
        else hue = 60 * ((r - g) / (max - min)) + 240;
      }
      let rough = 0.68; // bread, fries, crust
      const greenOrPurple = (hue > 70 && hue < 170) || (hue > 275 && hue < 345);
      const red = (hue < 12 || hue > 345) && sat > 0.45 && max > 0.3;
      if ((greenOrPurple && sat > 0.22) || red) {
        rough = 0.36; // lettuce, herbs, red onion, tomato: wet
        counts.wet++;
      } else if (max < 0.32) {
        rough = 0.5; // cooked meat, dark sauces: satin
        counts.meat++;
      } else if (sat < 0.12 && max > 0.75) {
        rough = 0.42; // white sauces, cream, mayo
      } else counts.matte++;
      out[i] = 255; // occlusion: none
      out[i + 1] = Math.round(rough * 255);
      out[i + 2] = 0; // not metal
    }
    // Soften the edges between regions so highlights don't sparkle.
    const jpeg = await sharp(out, { raw: { width: SIZE, height: SIZE, channels: 3 } }).blur(1.2).jpeg({ quality: 85 }).toBuffer();
    const tex = doc.createTexture(material.getName() + "-roughness").setImage(new Uint8Array(jpeg)).setMimeType("image/jpeg");
    material.setMetallicRoughnessTexture(tex).setRoughnessFactor(1).setMetallicFactor(0);
    const total = counts.wet + counts.meat + counts.matte || 1;
    notes.push("roughness map: " + Math.round((counts.wet / total) * 100) + "% wet, " + Math.round((counts.meat / total) * 100) + "% satin, rest matte");
  }
  return notes;
}
