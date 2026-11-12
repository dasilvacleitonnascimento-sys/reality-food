// A small software rasterizer that renders the baked dish on a wooden table.
// Used for the menu photo / 3D poster so they match the AR model exactly.

import sharp from "sharp";
import { fbm } from "./geometry.mjs";
import { MATERIALS } from "./export.mjs";

const norm = (v) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

const LIGHT = norm([-0.55, 1, 0.45]);
const LIGHT_COLOR = [2.3, 2.18, 1.98];
const SKY = [0.5, 0.53, 0.58];
const GROUND = [0.22, 0.17, 0.13];

function aces(x) {
  return Math.min(1, Math.max(0, (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14)));
}

/** Rasterizes one triangle; calls `frag(px, py, b0, b1, b2, depth)` for covered pixels. */
function raster(W, H, s0, s1, s2, frag) {
  const area = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s1[1] - s0[1]) * (s2[0] - s0[0]);
  if (Math.abs(area) < 1e-12) return;
  const minX = Math.max(0, Math.floor(Math.min(s0[0], s1[0], s2[0])));
  const maxX = Math.min(W - 1, Math.ceil(Math.max(s0[0], s1[0], s2[0])));
  const minY = Math.max(0, Math.floor(Math.min(s0[1], s1[1], s2[1])));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(s0[1], s1[1], s2[1])));
  for (let py = minY; py <= maxY; py++) {
    const y = py + 0.5;
    for (let px = minX; px <= maxX; px++) {
      const x = px + 0.5;
      const w0 = ((s1[0] - x) * (s2[1] - y) - (s1[1] - y) * (s2[0] - x)) / area;
      const w1 = ((s2[0] - x) * (s0[1] - y) - (s2[1] - y) * (s0[0] - x)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      frag(px, py, w0, w1, w2);
    }
  }
}

export async function renderPhoto(parts, atlas, { file, width = 1200, height = 900, ss = 2, eye, target, fov = 36, extent }) {
  const W = width * ss;
  const H = height * ss;

  // --- Shadow map (orthographic, from the light) --------------------------
  const SM = 2048;
  const lz = [-LIGHT[0], -LIGHT[1], -LIGHT[2]];
  const lx = norm(cross([0, 0, 1], lz));
  const ly = cross(lz, lx);
  const toShadow = (p) => [
    (dot(p, lx) / extent * 0.5 + 0.5) * SM,
    (0.5 - dot(p, ly) / extent * 0.5) * SM,
    dot(p, lz),
  ];
  const shadowDepth = new Float32Array(SM * SM).fill(Infinity);

  const meshes = parts.map((part) => ({
    part,
    P: part.world,
    N: part.normals(),
    UV: part.uv,
    idx: part.indices(),
    rough: MATERIALS[part.material],
  }));

  for (const { P, idx } of meshes) {
    const proj = [];
    for (let i = 0; i < P.length; i += 3) proj.push(toShadow([P[i], P[i + 1], P[i + 2]]));
    for (let t = 0; t < idx.length; t += 3) {
      const a = proj[idx[t]];
      const b = proj[idx[t + 1]];
      const c = proj[idx[t + 2]];
      raster(SM, SM, a, b, c, (px, py, w0, w1, w2) => {
        const d = w0 * a[2] + w1 * b[2] + w2 * c[2];
        const o = py * SM + px;
        if (d < shadowDepth[o]) shadowDepth[o] = d;
      });
    }
  }

  const shadowAt = (p) => {
    const [sx, sy, d] = toShadow(p);
    let lit = 0;
    let n = 0;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const x = Math.floor(sx) + dx * 2;
        const y = Math.floor(sy) + dy * 2;
        n++;
        if (x < 0 || y < 0 || x >= SM || y >= SM) {
          lit++;
          continue;
        }
        if (d <= shadowDepth[y * SM + x] + 0.0012) lit++;
      }
    }
    return lit / n;
  };

  // --- Camera ---------------------------------------------------------------
  const f = norm([target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]]);
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const focal = (H / 2) / Math.tan((fov * Math.PI) / 360);
  const toView = (p) => {
    const v = [p[0] - eye[0], p[1] - eye[1], p[2] - eye[2]];
    return [dot(v, r), dot(v, u), dot(v, f)];
  };

  const depth = new Float32Array(W * H).fill(Infinity);
  const color = new Float32Array(W * H * 3);

  const sampleAtlas = (s, t) => {
    const x = Math.min(Math.max(s * atlas.width - 0.5, 0), atlas.width - 1.001);
    const y = Math.min(Math.max(t * atlas.height - 0.5, 0), atlas.height - 1.001);
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const out = [0, 0, 0];
    const L = atlas.linear;
    for (let c = 0; c < 3; c++) {
      const a = L[(y0 * atlas.width + x0) * 3 + c];
      const b = L[(y0 * atlas.width + x0 + 1) * 3 + c];
      const d = L[((y0 + 1) * atlas.width + x0) * 3 + c];
      const e = L[((y0 + 1) * atlas.width + x0 + 1) * 3 + c];
      out[c] = (a + (b - a) * fx) * (1 - fy) + (d + (e - d) * fx) * fy;
    }
    return out;
  };

  const shade = (p, n, albedo, rough) => {
    const V = norm([eye[0] - p[0], eye[1] - p[1], eye[2] - p[2]]);
    if (dot(n, V) < 0) n = [-n[0], -n[1], -n[2]];
    const sh = shadowAt(p);
    const ndl = Math.max(dot(n, LIGHT), 0) * sh;
    const hemiT = n[1] * 0.5 + 0.5;
    const Hv = norm([LIGHT[0] + V[0], LIGHT[1] + V[1], LIGHT[2] + V[2]]);
    const shin = Math.min(3000, 2 / (rough * rough * rough * rough + 1e-4));
    const fres = 0.04 + 0.96 * Math.pow(1 - Math.max(dot(Hv, V), 0), 5);
    const spec = fres * ((shin + 8) / (8 * Math.PI)) * Math.pow(Math.max(dot(n, Hv), 0), shin) * ndl;
    // Soft sky reflection for glossy surfaces.
    const nv = Math.max(dot(n, V), 0);
    const refl = [2 * nv * n[0] - V[0], 2 * nv * n[1] - V[1], 2 * nv * n[2] - V[2]];
    const envF = (0.04 + 0.96 * Math.pow(1 - nv, 5)) * (1 - rough) ** 2;
    const env = refl[1] > 0 ? 0.55 + 0.35 * refl[1] : 0.12;
    const out = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      const hemi = GROUND[c] + (SKY[c] - GROUND[c]) * hemiT;
      out[c] = albedo[c] * (hemi * (0.55 + 0.45 * sh) + LIGHT_COLOR[c] * ndl) + LIGHT_COLOR[c] * spec + env * envF;
    }
    return out;
  };

  // --- Dish -------------------------------------------------------------------
  for (const { P, N, UV, idx, rough } of meshes) {
    const view = [];
    for (let i = 0; i < P.length; i += 3) {
      const v = toView([P[i], P[i + 1], P[i + 2]]);
      view.push([W / 2 + (v[0] / v[2]) * focal, H / 2 - (v[1] / v[2]) * focal, v[2]]);
    }
    for (let t = 0; t < idx.length; t += 3) {
      const ia = idx[t];
      const ib = idx[t + 1];
      const ic = idx[t + 2];
      const a = view[ia];
      const b = view[ib];
      const c = view[ic];
      if (a[2] < 0.01 || b[2] < 0.01 || c[2] < 0.01) continue;
      raster(W, H, a, b, c, (px, py, w0, w1, w2) => {
        const q0 = w0 / a[2];
        const q1 = w1 / b[2];
        const q2 = w2 / c[2];
        const iz = q0 + q1 + q2;
        const z = 1 / iz;
        const o = py * W + px;
        if (z >= depth[o]) return;
        depth[o] = z;
        const k0 = q0 / iz;
        const k1 = q1 / iz;
        const k2 = q2 / iz;
        const lerp3 = (A, stride, comp) => A[ia * stride + comp] * k0 + A[ib * stride + comp] * k1 + A[ic * stride + comp] * k2;
        const p = [lerp3(P, 3, 0), lerp3(P, 3, 1), lerp3(P, 3, 2)];
        const n = norm([lerp3(N, 3, 0), lerp3(N, 3, 1), lerp3(N, 3, 2)]);
        const albedo = sampleAtlas(lerp3(UV, 2, 0), lerp3(UV, 2, 1));
        color.set(shade(p, n, albedo, rough), o * 3);
      });
    }
  }

  // --- Wooden table under everything else -------------------------------------
  const wood = (x, z) => {
    const plank = Math.floor(z / 0.16 + 100);
    const zz = z + plank * 0.37;
    const warp = fbm([x * 1.5, 0, zz * 1.5], 4, 3) * 0.06;
    const grain = fbm([x * 2 + plank * 7, 0, (zz + warp) * 60], 1, 4);
    const fine = fbm([x * 40, plank, z * 400], 1, 2);
    const t = Math.min(1, Math.max(0, grain * 1.6 - 0.35 + fine * 0.15));
    const tone = 0.85 + (plank % 3) * 0.08;
    const dark = [0.085, 0.045, 0.024];
    const light = [0.26, 0.15, 0.085];
    let c = [0, 1, 2].map((i) => (dark[i] + (light[i] - dark[i]) * t) * tone);
    const seam = Math.abs(((z / 0.16 + 100) % 1) - 0.5) > 0.494;
    if (seam) c = c.map((v) => v * 0.35);
    return c;
  };

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const o = py * W + px;
      if (depth[o] !== Infinity) continue;
      const vx = (px + 0.5 - W / 2) / focal;
      const vy = -(py + 0.5 - H / 2) / focal;
      const dir = norm([r[0] * vx + u[0] * vy + f[0], r[1] * vx + u[1] * vy + f[1], r[2] * vx + u[2] * vy + f[2]]);
      if (dir[1] >= 0) {
        color.set([0.05, 0.04, 0.03], o * 3);
        continue;
      }
      const t = -eye[1] / dir[1];
      const p = [eye[0] + dir[0] * t, 0, eye[2] + dir[2] * t];
      color.set(shade(p, [0, 1, 0], wood(p[0], p[2]), 0.55), o * 3);
    }
  }

  // --- Tone map, vignette, write ----------------------------------------------
  const out = new Uint8Array(W * H * 3);
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const dx = (px / W - 0.5) * 1.6;
      const dy = (py / H - 0.5) * 1.6;
      const vig = 1 - 0.28 * (dx * dx + dy * dy);
      const o = (py * W + px) * 3;
      for (let c = 0; c < 3; c++) {
        const v = aces(color[o + c] * 0.9 * vig);
        out[o + c] = Math.round(Math.pow(v, 1 / 2.2) * 255);
      }
    }
  }
  await sharp(Buffer.from(out), { raw: { width: W, height: H, channels: 3 } })
    .resize(width, height, { kernel: "lanczos3" })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(file);
}
