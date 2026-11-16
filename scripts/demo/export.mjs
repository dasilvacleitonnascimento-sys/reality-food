// Bakes every part's color function into one texture atlas and writes a .glb.
// Textures (not vertex colors) are used because iOS AR Quick Look ignores
// vertex colors when model-viewer converts the model to USDZ.
//
// Optional PBR maps (used by the chocolate cake). A part may define:
//   bump(p, u, v)  micro-relief in meters, positive = away from part.inside
//                  (a local point inside the object) -> tangent-space normal map
//   rough(p, u, v) roughness 0..1 -> metallic-roughness map (G channel)
//   ao(p, u, v)    ambient occlusion 0..1 -> occlusion map (R channel)
// When no part defines them, the .glb is exactly as before (color only).

import sharp from "sharp";
import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, KHRMaterialsClearcoat } from "@gltf-transform/extensions";
import { draco } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";

/** NodeIO that reads/writes every standard glTF extension, including Draco. */
export async function createIO() {
  return new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    "draco3d.encoder": await draco3d.createEncoderModule(),
    "draco3d.decoder": await draco3d.createDecoderModule(),
  });
}

export const MATERIALS = {
  ceramic: 0.16,
  gloss: 0.1,
  satin: 0.42,
  glaze: 0.28, // moist custard
  sauce: 0.08, // sauces pooled on the plate (not counted as the portion)
  matte: 0.78,
  metal: 0.35, // cast iron, cutlery
  clear: 0.04, // glass and clear plastic cups (see TRANSPARENT)
  ice: 0.12,
  ganache: 0.2, // tempered chocolate under a clear, glossy coat (see CLEARCOAT)
  crumb: 0.72, // cake crumb on a fresh cut
  berry: 0.3, // wet fruit
};

/** Materials with a glossy clear coat on top (KHR_materials_clearcoat), with its roughness. */
export const CLEARCOAT = { ganache: 0.05 };

/** Materials that are see-through, with their opacity. */
export const TRANSPARENT = { clear: 0.18, ice: 0.42 };

const PAD = 2;

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);

/** Tangent-space normal (x along +u, y along +v, z along the surface normal) from a part's bump. */
function bumpNormal(part, gu, gv) {
  const e = 0.5 / part.k;
  const u0 = Math.max(gu - e, 0);
  const u1 = Math.min(gu + e, part.nu);
  const v0 = Math.max(gv - e, 0);
  const v1 = Math.min(gv + e, part.nv);
  const Pu0 = part.localAt(u0, gv);
  const Pu1 = part.localAt(u1, gv);
  const Pv0 = part.localAt(gu, v0);
  const Pv1 = part.localAt(gu, v1);
  const T = sub(Pu1, Pu0);
  const B = sub(Pv1, Pv0);
  const lt = len(T);
  const lb = len(B);
  if (lt < 1e-9 || lb < 1e-9) return [0, 0, 1];
  // Which way is "out": the grid's normal (T x B) or its opposite.
  const s = part.flipped ? -1 : 1; // the vertex normal follows the triangle winding
  const N = [s * (T[1] * B[2] - T[2] * B[1]), s * (T[2] * B[0] - T[0] * B[2]), s * (T[0] * B[1] - T[1] * B[0])];
  const p = part.localAt(gu, gv);
  const inward = part.inside && N[0] * (p[0] - part.inside[0]) + N[1] * (p[1] - part.inside[1]) + N[2] * (p[2] - part.inside[2]) < 0;
  const sign = inward ? -1 : 1;
  const h = (q, uu, vv) => part.bump(q, uu / part.nu, vv / part.nv);
  const dhu = (h(Pu1, u1, gv) - h(Pu0, u0, gv)) / lt;
  const dhv = (h(Pv1, gu, v1) - h(Pv0, gu, v0)) / lb;
  const x = -sign * dhu;
  const y = -sign * dhv;
  const l = Math.hypot(x, y, 1);
  return [x / l, y / l, 1 / l];
}

/**
 * iPhone AR (USDZ) draws only the front of each triangle. Parts that know a point
 * inside the object (part.inside) get their winding flipped when most of their
 * triangles face inward, so the front side always faces out.
 */
function orient(part) {
  if (!part.inside) return;
  const L = part.local;
  const idx = part.indices();
  let vote = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const [a, b, c] = [idx[t] * 3, idx[t + 1] * 3, idx[t + 2] * 3];
    const e1 = [L[b] - L[a], L[b + 1] - L[a + 1], L[b + 2] - L[a + 2]];
    const e2 = [L[c] - L[a], L[c + 1] - L[a + 1], L[c + 2] - L[a + 2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
    const m = [(L[a] + L[b] + L[c]) / 3 - part.inside[0], (L[a + 1] + L[b + 1] + L[c + 1]) / 3 - part.inside[1], (L[a + 2] + L[b + 2] + L[c + 2]) / 3 - part.inside[2]];
    vote += n[0] * m[0] + n[1] * m[1] + n[2] * m[2];
  }
  if (vote < 0) part.flipped = !part.flipped;
}

/** Packs parts into an atlas and fills it. Adds `uv` to each part. */
export function bake(parts, maxSize = 2048) {
  for (const part of parts) orient(part);
  const pbr = parts.some((p) => p.bump || p.rough || p.ao);
  const withAo = parts.some((p) => p.ao);
  const regions = parts.map((part) => ({
    part,
    w: part.nu * part.k + 1 + PAD * 2,
    h: part.nv * part.k + 1 + PAD * 2,
  }));
  const order = [...regions].sort((a, b) => b.h - a.h || b.w - a.w);

  let width = 256;
  const area = regions.reduce((s, r) => s + r.w * r.h, 0);
  while (width * width < area * 1.25 && width < maxSize) width *= 2;
  if (order.some((r) => r.w > width)) width = maxSize;

  let x = 0;
  let y = 0;
  let rowH = 0;
  for (const r of order) {
    if (x + r.w > width) {
      x = 0;
      y += rowH;
      rowH = 0;
    }
    r.x = x;
    r.y = y;
    x += r.w;
    rowH = Math.max(rowH, r.h);
  }
  const used = y + rowH;
  let height = 256;
  while (height < used) height *= 2;
  if (height > maxSize || width > maxSize) {
    throw new Error(`Atlas too big: ${width}x${used}. Lower some part's k.`);
  }

  const srgb = new Uint8Array(width * height * 3);
  const linear = new Float32Array(width * height * 3);
  // PBR maps: glTF-encoded bytes for the .glb, floats for the photo renderer.
  const normalBytes = pbr ? new Uint8Array(width * height * 3) : null;
  const ormBytes = pbr ? new Uint8Array(width * height * 3) : null;
  const tangentNormal = pbr ? new Float32Array(width * height * 3) : null;
  const roughness = pbr ? new Float32Array(width * height) : null;
  const occlusion = pbr ? new Float32Array(width * height).fill(1) : null;
  if (pbr) {
    for (let i = 0; i < width * height; i++) {
      normalBytes.set([128, 128, 255], i * 3);
      tangentNormal[i * 3 + 2] = 1;
      roughness[i] = 0.5;
      ormBytes.set([255, 128, 0], i * 3);
    }
  }

  for (const r of regions) {
    const { part } = r;
    for (let b = 0; b < r.h; b++) {
      const gv = Math.min(Math.max((b - PAD) / part.k, 0), part.nv);
      for (let a = 0; a < r.w; a++) {
        const gu = Math.min(Math.max((a - PAD) / part.k, 0), part.nu);
        const p = part.localAt(gu, gv);
        const c = part.color(p, gu / part.nu, gv / part.nv);
        const o = ((r.y + b) * width + r.x + a) * 3;
        for (let ch = 0; ch < 3; ch++) {
          const v = Math.min(1, Math.max(0, c[ch]));
          srgb[o + ch] = Math.round(v * 255);
          linear[o + ch] = toLinear(v);
        }
        if (pbr) {
          const t = o / 3;
          const n = part.bump ? bumpNormal(part, gu, gv) : [0, 0, 1];
          tangentNormal.set(n, o);
          // glTF normal maps: +X = +u, +Y = up in the image (-v), +Z = out.
          normalBytes[o] = Math.round((n[0] * 0.5 + 0.5) * 255);
          normalBytes[o + 1] = Math.round((-n[1] * 0.5 + 0.5) * 255);
          normalBytes[o + 2] = Math.round((n[2] * 0.5 + 0.5) * 255);
          const fallback = MATERIALS[part.material] ?? 0.5;
          const rough = Math.min(1, Math.max(0.03, part.rough ? part.rough(p, gu / part.nu, gv / part.nv) : fallback));
          const ao = Math.min(1, Math.max(0, part.ao ? part.ao(p, gu / part.nu, gv / part.nv) : 1));
          roughness[t] = rough;
          occlusion[t] = ao;
          ormBytes[o] = Math.round(ao * 255);
          ormBytes[o + 1] = Math.round(rough * 255);
          ormBytes[o + 2] = 0;
        }
      }
    }
    const uv = new Float32Array((part.nu + 1) * (part.nv + 1) * 2);
    for (let j = 0; j <= part.nv; j++) {
      for (let i = 0; i <= part.nu; i++) {
        const o = (j * (part.nu + 1) + i) * 2;
        uv[o] = (r.x + PAD + i * part.k + 0.5) / width;
        uv[o + 1] = (r.y + PAD + j * part.k + 0.5) / height;
      }
    }
    part.uv = uv;
  }

  return { width, height, srgb, linear, pbr, withAo, normalBytes, ormBytes, tangentNormal, roughness, occlusion };
}

/** Writes parts (already baked) to a .glb. Returns the file size in bytes. */
export async function writeGlb(file, name, parts, atlas) {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene(name);

  const jpeg = await sharp(Buffer.from(atlas.srgb), {
    raw: { width: atlas.width, height: atlas.height, channels: 3 },
  })
    .jpeg({ quality: 90, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer();
  const texture = doc.createTexture("albedo").setImage(new Uint8Array(jpeg)).setMimeType("image/jpeg");

  // Optional PBR maps (see bake). Linear data, so no chroma subsampling.
  const rawJpeg = (bytes, quality) =>
    sharp(Buffer.from(bytes), { raw: { width: atlas.width, height: atlas.height, channels: 3 } })
      .jpeg({ quality, chromaSubsampling: "4:4:4", mozjpeg: true })
      .toBuffer();
  const normalTex = atlas.pbr
    ? doc.createTexture("normal").setImage(new Uint8Array(await rawJpeg(atlas.normalBytes, 90))).setMimeType("image/jpeg")
    : null;
  const ormTex = atlas.pbr
    ? doc.createTexture("occlusion-roughness").setImage(new Uint8Array(await rawJpeg(atlas.ormBytes, 88))).setMimeType("image/jpeg")
    : null;
  const usesClearcoat = atlas.pbr && parts.some((p) => CLEARCOAT[p.material] !== undefined);
  const clearcoatExt = usesClearcoat ? doc.createExtension(KHRMaterialsClearcoat) : null;

  const groups = new Map();
  for (const part of parts) {
    if (!groups.has(part.material)) groups.set(part.material, []);
    groups.get(part.material).push(part);
  }

  for (const [matName, group] of groups) {
    const material = doc
      .createMaterial(matName)
      .setBaseColorTexture(texture)
      .setRoughnessFactor(MATERIALS[matName])
      .setAlphaMode(TRANSPARENT[matName] ? "BLEND" : "OPAQUE")
      .setBaseColorFactor([1, 1, 1, TRANSPARENT[matName] ?? 1])
      .setMetallicFactor(0)
      // PBR models are single-sided, like iPhone AR: what you test is what diners see.
      .setDoubleSided(!atlas.pbr);
    // No mipmaps: keeps neighboring atlas regions from bleeding into each other.
    material.getBaseColorTextureInfo().setMinFilter(9729).setMagFilter(9729);
    if (atlas.pbr) {
      material.setRoughnessFactor(1).setNormalTexture(normalTex).setMetallicRoughnessTexture(ormTex);
      material.getNormalTextureInfo().setMinFilter(9729).setMagFilter(9729);
      material.getMetallicRoughnessTextureInfo().setMinFilter(9729).setMagFilter(9729);
      if (atlas.withAo) {
        material.setOcclusionTexture(ormTex);
        material.getOcclusionTextureInfo().setMinFilter(9729).setMagFilter(9729);
      }
      if (clearcoatExt && CLEARCOAT[matName] !== undefined) {
        material.setExtension(
          "KHR_materials_clearcoat",
          clearcoatExt.createClearcoat().setClearcoatFactor(1).setClearcoatRoughnessFactor(CLEARCOAT[matName]),
        );
      }
    }

    // Thin, open parts (part.twoSided) get a back copy when materials are single-sided.
    const emits = group.flatMap((part) => (atlas.pbr && part.twoSided ? [[part, false], [part, true]] : [[part, false]]));
    const vertexCount = emits.reduce((s, [p]) => s + p.world.length / 3, 0);
    const pos = new Float32Array(vertexCount * 3);
    const nrm = new Float32Array(vertexCount * 3);
    const uv = new Float32Array(vertexCount * 2);
    const idx = [];
    let base = 0;
    for (const [part, back] of emits) {
      pos.set(part.world, base * 3);
      const normals = part.normals();
      if (back) for (let i = 0; i < normals.length; i++) normals[i] = -normals[i];
      nrm.set(normals, base * 3);
      uv.set(part.uv, base * 2);
      const tri = part.indices();
      for (let t = 0; t < tri.length; t += 3) {
        if (back) idx.push(tri[t] + base, tri[t + 2] + base, tri[t + 1] + base);
        else idx.push(tri[t] + base, tri[t + 1] + base, tri[t + 2] + base);
      }
      base += part.world.length / 3;
    }
    const indices = vertexCount > 65535 ? new Uint32Array(idx) : new Uint16Array(idx);
    const prim = doc
      .createPrimitive()
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(pos).setBuffer(buffer))
      .setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(nrm).setBuffer(buffer))
      .setAttribute("TEXCOORD_0", doc.createAccessor().setType("VEC2").setArray(uv).setBuffer(buffer))
      .setIndices(doc.createAccessor().setType("SCALAR").setArray(indices).setBuffer(buffer))
      .setMaterial(material);
    scene.addChild(doc.createNode(matName).setMesh(doc.createMesh(matName).addPrimitive(prim)));
  }

  // Draco shrinks geometry ~5-10x. 16-bit positions = 0.005 mm steps on a
  // 31 cm plate, far below anything the eye (or AR tracking) can see.
  await doc.transform(draco({ method: "edgebreaker", quantizePosition: 16, quantizeNormal: 10, quantizeTexcoord: 14 }));
  const bytes = await (await createIO()).writeBinary(doc);
  const { writeFile } = await import("node:fs/promises");
  await writeFile(file, bytes);
  return bytes.byteLength;
}
