// Generates the placeholder assets for the Demo Bistro prototype:
//   public/images/*.jpg           4:3 illustrated dish photos (also used as 3D posters)
//   public/images/demo-bistro-logo.svg
//   public/models/*.glb           simple true-to-scale dish models (1 unit = 1 meter)
//
// Run: node scripts/generate-demo-assets.mjs
// These are stand-ins until real photogrammetry models arrive in Prompt 4.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { Document, NodeIO } from "@gltf-transform/core";

const root = path.resolve(import.meta.dirname, "..");
const imagesDir = path.join(root, "public", "images");
const modelsDir = path.join(root, "public", "models");
await mkdir(imagesDir, { recursive: true });
await mkdir(modelsDir, { recursive: true });

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------

const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" role="img" aria-label="Demo Bistro">
  <circle cx="56" cy="56" r="56" fill="#9a3412"/>
  <circle cx="56" cy="56" r="47" fill="none" stroke="#fed7aa" stroke-width="2"/>
  <text x="56" y="67" text-anchor="middle" font-family="Georgia, serif" font-size="34" font-weight="700" fill="#fff7ed">DB</text>
</svg>
`;
await writeFile(path.join(imagesDir, "demo-bistro-logo.svg"), logo);

// ---------------------------------------------------------------------------
// Photos: top-down illustrations on a wooden table, 1200x900
// ---------------------------------------------------------------------------

const W = 1200;
const H = 900;
const cx = W / 2;
const cy = H / 2;

function photoSvg(food, { plateR = 330, plate = "#fafaf9" } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a16207"/><stop offset="1" stop-color="#713f12"/>
    </linearGradient>
    <radialGradient id="plate" cx="0.45" cy="0.4" r="0.7">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e7e5e4"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#000" flood-opacity="0.35"/>
    </filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#wood)"/>
  ${Array.from({ length: 9 }, (_, i) => `<rect y="${i * 100 + 40}" width="${W}" height="3" fill="#000" opacity="0.08"/>`).join("")}
  <circle cx="${cx}" cy="${cy}" r="${plateR}" fill="${plate === "#fafaf9" ? "url(#plate)" : plate}" filter="url(#shadow)"/>
  <circle cx="${cx}" cy="${cy}" r="${plateR * 0.78}" fill="none" stroke="#d6d3d1" stroke-width="3"/>
  <g filter="url(#soft)">${food}</g>
</svg>`;
}

const ring = (n, r, fn) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return fn(cx + Math.cos(a) * r, cy + Math.sin(a) * r, a, i);
  }).join("");

const photos = {
  burrata: photoSvg(
    ring(8, 170, (x, y, _a, i) => {
      const colors = ["#dc2626", "#f59e0b", "#b91c1c", "#65a30d"];
      return `<circle cx="${x}" cy="${y}" r="70" fill="${colors[i % 4]}"/><circle cx="${x}" cy="${y}" r="42" fill="none" stroke="#fef3c7" stroke-width="5" opacity="0.6"/>`;
    }) +
      `<circle cx="${cx}" cy="${cy}" r="110" fill="#fafaf9"/><ellipse cx="${cx - 25}" cy="${cy - 30}" rx="45" ry="30" fill="#ffffff"/>` +
      ring(5, 95, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="28" ry="14" fill="#15803d"/>`),
  ),
  "spicy-wings": photoSvg(
    ring(7, 175, (x, y, a) => {
      const deg = (a * 180) / Math.PI + 90;
      return `<ellipse cx="${x}" cy="${y}" rx="48" ry="90" transform="rotate(${deg} ${x} ${y})" fill="#c2410c"/><ellipse cx="${x}" cy="${y}" rx="26" ry="55" transform="rotate(${deg} ${x} ${y})" fill="#ea580c"/>`;
    }) +
      `<circle cx="${cx}" cy="${cy}" r="80" fill="#f5f5f4"/><circle cx="${cx}" cy="${cy}" r="62" fill="#fefce8"/>` +
      ring(12, 140, (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#b91c1c"/>`),
  ),
  "smash-burger": photoSvg(
    `<circle cx="${cx - 40}" cy="${cy}" r="190" fill="#b45309"/>` +
      `<circle cx="${cx - 40}" cy="${cy}" r="172" fill="#d97706"/>` +
      Array.from({ length: 16 }, (_, i) => {
        const a = i * 2.4;
        const r = 30 + (i % 4) * 32;
        return `<ellipse cx="${cx - 40 + Math.cos(a) * r}" cy="${cy + Math.sin(a) * r}" rx="9" ry="5" fill="#fef3c7" transform="rotate(${i * 37} ${cx - 40 + Math.cos(a) * r} ${cy + Math.sin(a) * r})"/>`;
      }).join("") +
      Array.from({ length: 9 }, (_, i) => {
        const x = cx + 180 + (i % 3) * 22;
        const y = cy - 150 + i * 34;
        return `<rect x="${x}" y="${y}" width="22" height="120" rx="6" fill="#facc15" transform="rotate(${-20 + i * 6} ${x} ${y})"/>`;
      }).join(""),
  ),
  "green-curry": photoSvg(
    `<circle cx="${cx}" cy="${cy}" r="250" fill="#4d7c0f"/>` +
      `<circle cx="${cx}" cy="${cy}" r="238" fill="#84cc16" opacity="0.55"/>` +
      `<ellipse cx="${cx + 60}" cy="${cy - 20}" rx="110" ry="90" fill="#fafaf9"/>` +
      ring(6, 150, (x, y, _a, i) =>
        i % 2
          ? `<rect x="${x - 26}" y="${y - 26}" width="52" height="52" rx="8" fill="#fef9c3"/>`
          : `<circle cx="${x}" cy="${y}" r="26" fill="#dc2626"/>`,
      ) +
      ring(4, 90, (x, y) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="11" fill="#166534"/>`),
    { plateR: 300, plate: "#1c1917" },
  ),
  tiramisu: photoSvg(
    `<rect x="${cx - 150}" y="${cy - 150}" width="300" height="300" rx="14" fill="#78350f"/>` +
      `<rect x="${cx - 140}" y="${cy - 140}" width="280" height="280" rx="10" fill="#92400e"/>` +
      Array.from({ length: 40 }, (_, i) => `<circle cx="${cx - 120 + ((i * 53) % 240)}" cy="${cy - 120 + ((i * 97) % 240)}" r="4" fill="#451a03" opacity="0.6"/>`).join("") +
      `<ellipse cx="${cx + 170}" cy="${cy + 170}" rx="30" ry="16" fill="#16a34a" transform="rotate(-35 ${cx + 170} ${cy + 170})"/>`,
    { plateR: 290 },
  ),
  "lemon-sorbet": photoSvg(
    `<circle cx="${cx}" cy="${cy}" r="200" fill="#e7e5e4"/>` +
      `<circle cx="${cx - 70}" cy="${cy + 10}" r="105" fill="#fef08a"/><circle cx="${cx - 95}" cy="${cy - 20}" r="40" fill="#fefce8" opacity="0.7"/>` +
      `<circle cx="${cx + 80}" cy="${cy - 10}" r="100" fill="#fde047"/><circle cx="${cx + 55}" cy="${cy - 40}" r="38" fill="#fefce8" opacity="0.7"/>` +
      `<path d="M ${cx + 40} ${cy + 120} a 70 70 0 0 1 140 0 z" fill="#facc15" stroke="#fef9c3" stroke-width="8"/>` +
      `<ellipse cx="${cx - 10}" cy="${cy - 120}" rx="30" ry="14" fill="#16a34a" transform="rotate(20 ${cx - 10} ${cy - 120})"/>`,
    { plateR: 280 },
  ),
};

for (const [name, svg] of Object.entries(photos)) {
  await sharp(Buffer.from(svg))
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(imagesDir, `${name}.jpg`));
}

// ---------------------------------------------------------------------------
// 3D models
// ---------------------------------------------------------------------------

const cm = (v) => v / 100;

/** sRGB hex -> linear RGBA, which is what glTF baseColorFactor expects. */
function linear(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return [ch((n >> 16) & 255), ch((n >> 8) & 255), ch(n & 255), 1];
}

/** Closed cylinder standing on y = 0. */
function cylinder(radius, height, segments = 48) {
  const p = [];
  const nrm = [];
  const idx = [];
  const add = (x, y, z, nx, ny, nz) => {
    p.push(x, y, z);
    nrm.push(nx, ny, nz);
    return p.length / 3 - 1;
  };
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2;
    const a1 = ((i + 1) / segments) * Math.PI * 2;
    const [c0, s0, c1, s1] = [Math.cos(a0), Math.sin(a0), Math.cos(a1), Math.sin(a1)];
    const b0 = add(radius * c0, 0, radius * s0, c0, 0, s0);
    const b1 = add(radius * c1, 0, radius * s1, c1, 0, s1);
    const t0 = add(radius * c0, height, radius * s0, c0, 0, s0);
    const t1 = add(radius * c1, height, radius * s1, c1, 0, s1);
    idx.push(b0, t0, b1, b1, t0, t1);
    const tc = add(0, height, 0, 0, 1, 0);
    const ta = add(radius * c0, height, radius * s0, 0, 1, 0);
    const tb = add(radius * c1, height, radius * s1, 0, 1, 0);
    idx.push(tc, tb, ta);
    const bc = add(0, 0, 0, 0, -1, 0);
    const ba = add(radius * c0, 0, radius * s0, 0, -1, 0);
    const bb = add(radius * c1, 0, radius * s1, 0, -1, 0);
    idx.push(bc, ba, bb);
  }
  return { p, nrm, idx };
}

/** Ellipsoid centered at the origin with radii rx, ry, rz. */
function ellipsoid(rx, ry, rz, seg = 32, rings = 16) {
  const p = [];
  const nrm = [];
  const idx = [];
  for (let r = 0; r <= rings; r++) {
    const v = (r / rings) * Math.PI;
    for (let s = 0; s <= seg; s++) {
      const u = (s / seg) * Math.PI * 2;
      const x = Math.sin(v) * Math.cos(u);
      const y = Math.cos(v);
      const z = Math.sin(v) * Math.sin(u);
      p.push(x * rx, y * ry, z * rz);
      const nx = x / rx;
      const ny = y / ry;
      const nz = z / rz;
      const len = Math.hypot(nx, ny, nz) || 1;
      nrm.push(nx / len, ny / len, nz / len);
    }
  }
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < seg; s++) {
      const a = r * (seg + 1) + s;
      const b = a + seg + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  return { p, nrm, idx };
}

/** Box standing on y = 0. */
function box(w, h, d) {
  const p = [];
  const nrm = [];
  const idx = [];
  const [x, z] = [w / 2, d / 2];
  const faces = [
    [[0, 1, 0], [[-x, h, -z], [x, h, -z], [x, h, z], [-x, h, z]]],
    [[0, -1, 0], [[-x, 0, -z], [-x, 0, z], [x, 0, z], [x, 0, -z]]],
    [[1, 0, 0], [[x, 0, -z], [x, 0, z], [x, h, z], [x, h, -z]]],
    [[-1, 0, 0], [[-x, 0, -z], [-x, h, -z], [-x, h, z], [-x, 0, z]]],
    [[0, 0, 1], [[-x, 0, z], [-x, h, z], [x, h, z], [x, 0, z]]],
    [[0, 0, -1], [[-x, 0, -z], [x, 0, -z], [x, h, -z], [-x, h, -z]]],
  ];
  for (const [n, verts] of faces) {
    const base = p.length / 3;
    for (const v of verts) {
      p.push(...v);
      nrm.push(...n);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { p, nrm, idx };
}

function createModel() {
  const doc = new Document();
  const buffer = doc.createBuffer();
  const scene = doc.createScene("Dish");
  const materials = new Map();

  const material = (hex, roughness) => {
    const key = `${hex}-${roughness}`;
    if (!materials.has(key)) {
      materials.set(
        key,
        doc
          .createMaterial(key)
          .setBaseColorFactor(linear(hex))
          .setRoughnessFactor(roughness)
          .setMetallicFactor(0)
          .setDoubleSided(true),
      );
    }
    return materials.get(key);
  };

  /**
   * Adds a mesh. Positions are in meters. `rotY` is in degrees.
   */
  const add = (geo, hex, { at = [0, 0, 0], rotY = 0, rotX = 0, roughness = 0.6 } = {}) => {
    const prim = doc
      .createPrimitive()
      .setAttribute(
        "POSITION",
        doc.createAccessor().setType("VEC3").setArray(new Float32Array(geo.p)).setBuffer(buffer),
      )
      .setAttribute(
        "NORMAL",
        doc.createAccessor().setType("VEC3").setArray(new Float32Array(geo.nrm)).setBuffer(buffer),
      )
      .setIndices(
        doc.createAccessor().setType("SCALAR").setArray(new Uint16Array(geo.idx)).setBuffer(buffer),
      )
      .setMaterial(material(hex, roughness));
    const halfY = (rotY * Math.PI) / 360;
    const halfX = (rotX * Math.PI) / 360;
    // Quaternion for rotY then rotX.
    const qy = [0, Math.sin(halfY), 0, Math.cos(halfY)];
    const qx = [Math.sin(halfX), 0, 0, Math.cos(halfX)];
    const q = [
      qy[3] * qx[0] + qy[0] * qx[3] + qy[1] * qx[2] - qy[2] * qx[1],
      qy[3] * qx[1] - qy[0] * qx[2] + qy[1] * qx[3] + qy[2] * qx[0],
      qy[3] * qx[2] + qy[0] * qx[1] - qy[1] * qx[0] + qy[2] * qx[3],
      qy[3] * qx[3] - qy[0] * qx[0] - qy[1] * qx[1] - qy[2] * qx[2],
    ];
    scene.addChild(
      doc.createNode().setMesh(doc.createMesh().addPrimitive(prim)).setTranslation(at).setRotation(q),
    );
  };

  /** White plate with a raised rim; returns the height of the eating surface. */
  const plate = (diameterCm) => {
    const r = cm(diameterCm / 2);
    add(cylinder(r * 0.62, cm(0.9)), "#f5f5f4", { roughness: 0.25 });
    add(cylinder(r, cm(0.6)), "#fafaf9", { at: [0, cm(0.9), 0], roughness: 0.25 });
    add(cylinder(r * 0.74, cm(0.15)), "#ffffff", { at: [0, cm(1.5), 0], roughness: 0.2 });
    return cm(1.65);
  };

  return { doc, add, plate };
}

const io = new NodeIO();

async function writeModel(name, build) {
  const model = createModel();
  build(model);
  const file = path.join(modelsDir, `${name}.glb`);
  await io.write(file, model.doc);
  return file;
}

// Burrata & heirloom tomatoes on a 23 cm plate.
await writeModel("burrata", ({ add, plate }) => {
  const top = plate(23);
  const colors = ["#dc2626", "#f59e0b", "#b91c1c", "#65a30d"];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    add(cylinder(cm(2.8), cm(0.8)), colors[i % 4], {
      at: [Math.cos(a) * cm(6), top + (i % 2) * cm(0.3), Math.sin(a) * cm(6)],
      rotX: (i % 2 ? 1 : -1) * 8,
      roughness: 0.35,
    });
  }
  add(ellipsoid(cm(4.3), cm(3.2), cm(4.3)), "#fafaf9", { at: [0, top + cm(2.6), 0], roughness: 0.5 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    add(ellipsoid(cm(1.4), cm(0.15), cm(0.7)), "#15803d", {
      at: [Math.cos(a) * cm(3.6), top + cm(3.6), Math.sin(a) * cm(3.6)],
      rotY: (-a * 180) / Math.PI,
      roughness: 0.45,
    });
  }
});

// Classic smash burger with fries on a 27 cm plate.
await writeModel("smash-burger", ({ add, plate }) => {
  const top = plate(27);
  const bx = -cm(2.5);
  let y = top;
  add(cylinder(cm(5.4), cm(1.8)), "#d97706", { at: [bx, y, 0] });
  y += cm(1.8);
  add(cylinder(cm(5.9), cm(1.1)), "#57290f", { at: [bx, y, 0], roughness: 0.8 });
  y += cm(1.1);
  add(box(cm(10), cm(0.25), cm(10)), "#facc15", { at: [bx, y, 0], rotY: 45, roughness: 0.4 });
  y += cm(0.25);
  add(cylinder(cm(5.9), cm(1.1)), "#57290f", { at: [bx, y, 0], roughness: 0.8 });
  y += cm(1.1);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    add(cylinder(cm(1.4), cm(0.3)), "#4d7c0f", {
      at: [bx + Math.cos(a) * cm(2.8), y, Math.sin(a) * cm(2.8)],
      roughness: 0.4,
    });
  }
  y += cm(0.3);
  add(ellipsoid(cm(5.6), cm(3.8), cm(5.6)), "#c2410c", { at: [bx, y, 0], roughness: 0.5 });
  for (let i = 0; i < 18; i++) {
    const a = i * 2.4;
    const r = cm(1 + (i % 4) * 1.1);
    const h = Math.sqrt(Math.max(0, 1 - (r / cm(5.6)) ** 2)) * cm(3.8);
    add(ellipsoid(cm(0.35), cm(0.12), cm(0.18)), "#fef3c7", {
      at: [bx + Math.cos(a) * r, y + h, Math.sin(a) * r],
      rotY: i * 37,
    });
  }
  for (let i = 0; i < 9; i++) {
    add(box(cm(0.9), cm(0.9), cm(7)), "#eab308", {
      at: [cm(7.5) + (i % 3) * cm(1.2), top + Math.floor(i / 3) * cm(0.9), cm(-2) + (i % 4) * cm(0.8)],
      rotY: -15 + i * 9,
      roughness: 0.7,
    });
  }
});

// Tiramisu slice on a 20 cm dessert plate.
await writeModel("tiramisu", ({ add, plate }) => {
  const top = plate(20);
  let y = top;
  const layers = [
    ["#b45309", cm(1.4), 0.6],
    ["#fef3c7", cm(1.3), 0.5],
    ["#92400e", cm(1.4), 0.6],
    ["#fef3c7", cm(1.3), 0.5],
    ["#451a03", cm(0.2), 0.95],
  ];
  for (const [hex, h, roughness] of layers) {
    add(box(cm(8), h, cm(8)), hex, { at: [0, y, 0], rotY: 20, roughness });
    y += h;
  }
  add(ellipsoid(cm(1.2), cm(0.12), cm(0.6)), "#16a34a", {
    at: [cm(5.5), top + cm(0.15), cm(4)],
    rotY: -35,
    roughness: 0.45,
  });
});

console.log("Demo assets written to public/images and public/models.");
