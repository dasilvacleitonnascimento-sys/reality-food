// Bakes every part's color function into one texture atlas and writes a .glb.
// Textures (not vertex colors) are used because iOS AR Quick Look ignores
// vertex colors when model-viewer converts the model to USDZ.

import sharp from "sharp";
import { Document, NodeIO } from "@gltf-transform/core";
import { KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { draco } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";

/** NodeIO that can read and write Draco-compressed meshes. */
export async function createIO() {
  return new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
    "draco3d.encoder": await draco3d.createEncoderModule(),
    "draco3d.decoder": await draco3d.createDecoderModule(),
  });
}

export const MATERIALS = {
  ceramic: 0.16,
  gloss: 0.1,
  satin: 0.42,
  matte: 0.78,
};

const PAD = 2;

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** Packs parts into an atlas and fills it. Adds `uv` to each part. */
export function bake(parts, maxSize = 2048) {
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

  return { width, height, srgb, linear };
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
      .setMetallicFactor(0)
      .setDoubleSided(true);
    // No mipmaps: keeps neighboring atlas regions from bleeding into each other.
    material.getBaseColorTextureInfo().setMinFilter(9729).setMagFilter(9729);

    const vertexCount = group.reduce((s, p) => s + p.world.length / 3, 0);
    const pos = new Float32Array(vertexCount * 3);
    const nrm = new Float32Array(vertexCount * 3);
    const uv = new Float32Array(vertexCount * 2);
    const idx = [];
    let base = 0;
    for (const part of group) {
      pos.set(part.world, base * 3);
      nrm.set(part.normals(), base * 3);
      uv.set(part.uv, base * 2);
      for (const i of part.indices()) idx.push(i + base);
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
