// Minimal Wavefront OBJ (+ MTL) reader -> glTF Document, for scans exported
// by RealityScan / RealityCapture / Polycam as .obj + .mtl + textures.
// Supports: v, vt, vn, f (triangles, quads, polygons; v, v/vt, v//vn, v/vt/vn),
// one or more materials with map_Kd (color) and map_Bump / norm (normal map).

import { readFile } from "node:fs/promises";
import path from "node:path";
import { Document } from "@gltf-transform/core";

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

async function readMtl(file) {
  const materials = new Map();
  let current = null;
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch {
    return materials;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [key, ...rest] = line.split(/\s+/);
    const value = rest.join(" ");
    if (key === "newmtl") {
      current = { name: value };
      materials.set(value, current);
    } else if (current && key === "map_Kd") current.color = value.split(/\s+/).pop();
    else if (current && (key === "map_Bump" || key === "bump" || key === "norm")) current.normal = value.split(/\s+/).pop();
  }
  return materials;
}

export async function readObj(file) {
  const dir = path.dirname(file);
  const text = await readFile(file, "utf8");
  const v = [];
  const vt = [];
  const vn = [];
  const groups = new Map(); // material -> { keys: Map, pos, uv, nrm, idx }
  let mtlFile = null;
  let currentMat = "default";

  const group = (name) => {
    if (!groups.has(name)) groups.set(name, { keys: new Map(), pos: [], uv: [], nrm: [], idx: [] });
    return groups.get(name);
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line[0] === "#") continue;
    const sp = line.indexOf(" ");
    const key = sp < 0 ? line : line.slice(0, sp);
    const rest = sp < 0 ? "" : line.slice(sp + 1).trim();
    if (key === "v") {
      const [x, y, z] = rest.split(/\s+/).map(Number);
      v.push(x, y, z);
    } else if (key === "vt") {
      const [s, t] = rest.split(/\s+/).map(Number);
      vt.push(s, 1 - t); // OBJ v is bottom-up, glTF is top-down
    } else if (key === "vn") {
      const [x, y, z] = rest.split(/\s+/).map(Number);
      vn.push(x, y, z);
    } else if (key === "usemtl") {
      currentMat = rest;
    } else if (key === "mtllib") {
      mtlFile = path.join(dir, rest);
    } else if (key === "f") {
      const g = group(currentMat);
      const corners = rest.split(/\s+/).map((c) => {
        let k = g.keys.get(c);
        if (k === undefined) {
          const [pi, ti, ni] = c.split("/").map((s) => (s ? Number(s) : 0));
          const p = (pi < 0 ? v.length / 3 + pi : pi - 1) * 3;
          g.pos.push(v[p], v[p + 1], v[p + 2]);
          if (ti) {
            const t = (ti < 0 ? vt.length / 2 + ti : ti - 1) * 2;
            g.uv.push(vt[t], vt[t + 1]);
          } else g.uv.push(0, 0);
          if (ni) {
            const n = (ni < 0 ? vn.length / 3 + ni : ni - 1) * 3;
            g.nrm.push(vn[n], vn[n + 1], vn[n + 2]);
          }
          k = g.pos.length / 3 - 1;
          g.keys.set(c, k);
        }
        return k;
      });
      for (let i = 1; i + 1 < corners.length; i++) g.idx.push(corners[0], corners[i], corners[i + 1]);
    }
  }

  const materials = mtlFile ? await readMtl(mtlFile) : new Map();
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene("scan");
  const textures = new Map();
  const texture = async (name) => {
    if (!name) return null;
    if (!textures.has(name)) {
      const image = await readFile(path.join(dir, name));
      textures.set(
        name,
        doc.createTexture(name).setImage(new Uint8Array(image)).setMimeType(MIME[path.extname(name).toLowerCase()] ?? "image/jpeg"),
      );
    }
    return textures.get(name);
  };

  for (const [name, g] of groups) {
    if (!g.idx.length) continue;
    const info = materials.get(name) ?? {};
    const material = doc.createMaterial(name).setRoughnessFactor(0.7).setMetallicFactor(0);
    const color = await texture(info.color);
    if (color) material.setBaseColorTexture(color);
    const normal = await texture(info.normal);
    if (normal) material.setNormalTexture(normal);
    const count = g.pos.length / 3;
    const prim = doc
      .createPrimitive()
      .setAttribute("POSITION", doc.createAccessor().setType("VEC3").setArray(new Float32Array(g.pos)).setBuffer(buffer))
      .setAttribute("TEXCOORD_0", doc.createAccessor().setType("VEC2").setArray(new Float32Array(g.uv)).setBuffer(buffer))
      .setIndices(
        doc
          .createAccessor()
          .setType("SCALAR")
          .setArray(count > 65535 ? new Uint32Array(g.idx) : new Uint16Array(g.idx))
          .setBuffer(buffer),
      )
      .setMaterial(material);
    if (g.nrm.length === g.pos.length) {
      prim.setAttribute("NORMAL", doc.createAccessor().setType("VEC3").setArray(new Float32Array(g.nrm)).setBuffer(buffer));
    }
    scene.addChild(doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)));
  }
  return doc;
}
