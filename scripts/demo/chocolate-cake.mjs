// Triple chocolate cake slice on a 20 cm dessert plate, modeled at real size.
//
// Built like a film asset, not a drawing:
// - Geometry: wavy knife-cut layer lines, big air pockets, a rounded ganache edge.
// - Normal map: fine crumb pores and grain, knife drag on the filling, spatula
//   marks and tiny air bubbles in the ganache, piping lines in the cream.
//   (Survives the 15k-triangle iPhone AR copy, where small geometry is lost.)
// - Roughness map: dry crumb vs. moist crumb, satin filling, wet raspberries.
// - Occlusion map: inside pores, cream grooves and between raspberry drupelets.
// - Clear coat on the ganache: the sharp reflection of tempered chocolate.

import { Part, TAU, cm, ellipsoid, fbm, hex, lathe, mix, noise, rng, shade, smoothstep } from "./geometry.mjs";
import { dinnerPlate } from "./dishes.mjs";

const BASE = 0.008; // top of the plate's well
const R = cm(10); // cut from a 20 cm cake
const A = (38 * Math.PI) / 180; // slice angle
const EDGE = cm(0.55); // rounded ganache edge on top
const FOOT = cm(0.2); // the bottom edge curls in slightly
const COAT = cm(0.22); // ganache on the outer side, seen on the cut face

// Bottom to top, in cm.
const LAYERS = [
  ["sponge", 1.9],
  ["filling", 0.6],
  ["sponge", 1.9],
  ["filling", 0.6],
  ["sponge", 1.8],
  ["ganache", 0.45],
];
const STARTS = [];
{
  let y = BASE;
  for (const [, h] of LAYERS) {
    STARTS.push(y);
    y += cm(h);
  }
  STARTS.push(y);
}
const TOP = STARTS[STARTS.length - 1];
/** A point inside the slice (local coordinates), so bumps know which way is out. */
const INSIDE = [R * 0.5, BASE + cm(3), 0];

// --- Colors (sRGB) ----------------------------------------------------------
const SPONGE_DARK = hex("#43271a");
const SPONGE = hex("#633b25");
const SPONGE_LIGHT = hex("#84563a");
const PORE = hex("#2a140b");
const FILLING = hex("#1b0b05");
const FILLING_LIGHT = hex("#2d150a");
const GANACHE = hex("#170a05");
const GANACHE_LIGHT = hex("#2a1309");

// --- Noise helpers -------------------------------------------------------------

function hash(x, y, s) {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(s, 0x1b873593);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Cellular holes: 0 = solid, 1 = deepest point of a hole. (a, b) in meters. */
function cells(a, b, seed, size, chance, rMin, rMax, stretch = 1.25) {
  let best = 0;
  const gx = Math.floor(a / size);
  const gy = Math.floor(b / size);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const cx = gx + dx;
      const cy = gy + dy;
      if (hash(cx, cy, seed) > chance) continue;
      const px = (cx + hash(cx, cy, seed + 1)) * size;
      const py = (cy + hash(cx, cy, seed + 2)) * size;
      const rad = size * (rMin + (rMax - rMin) * hash(cx, cy, seed + 3));
      // Holes are a bit wider than tall (the crumb was squeezed while baking).
      const d = Math.hypot((a - px) / stretch, b - py);
      if (d < rad) best = Math.max(best, 1 - (d / rad) ** 2);
    }
  }
  return best;
}

/** Fine crumb pores (normal map) and big air pockets (geometry), on cut face f. */
const finePores = (r, y, f) => Math.max(cells(r, y, 31 * f + 1, 0.0011, 0.6, 0.16, 0.42), 0.6 * cells(r, y, 31 * f + 5, 0.0005, 0.5, 0.15, 0.4));
const airPockets = (r, y, f) => cells(r, y, 31 * f + 9, 0.0042, 0.18, 0.12, 0.3);

/** Outer radius at height y: rounded edge at the top, a small foot at the bottom. */
function outerR(y) {
  const top = TOP - EDGE;
  if (y > top) {
    const d = Math.min(EDGE, y - top);
    return R - EDGE + Math.sqrt(Math.max(0, EDGE * EDGE - d * d));
  }
  if (y < BASE + FOOT) {
    const d = BASE + FOOT - y;
    return R - FOOT + Math.sqrt(Math.max(0, FOOT * FOOT - d * d));
  }
  return R;
}

/** Height of the line between layer k and k+1 on cut face f, at radius r. Wavy, like a real cut. */
function boundary(k, r, f) {
  const nominal = STARTS[k + 1];
  if (k + 1 >= LAYERS.length) return nominal;
  const amp = LAYERS[k + 1][0] === "ganache" ? cm(0.12) : cm(0.3);
  return nominal + (fbm([r, k * 0.031, f * 0.017], 26, 3) - 0.5) * amp * 2 + Math.sin(r * 41 + k * 1.7) * cm(0.04);
}

const at = (r, th, y) => [r * Math.cos(th), y, r * Math.sin(th)];

// --- Cut faces ------------------------------------------------------------------

function cutFaces() {
  const parts = [];
  for (const f of [0, 1]) {
    const th = f === 0 ? -A / 2 : A / 2;
    // Outward normal of this face (in x, z).
    const n = f === 0 ? [Math.sin(th), -Math.cos(th)] : [-Math.sin(th), Math.cos(th)];

    LAYERS.forEach(([kind, hCm], k) => {
      const low = (r) => (k === 0 ? BASE : boundary(k - 1, r, f));
      const high = (r) => (k === LAYERS.length - 1 ? TOP : boundary(k, r, f));
      const sponge = kind === "sponge";
      const nv = Math.max(6, Math.round(hCm / 0.045));
      const coated = (r, y) => kind === "ganache" || r > outerR(y) - COAT * (0.8 + 0.4 * fbm([r, y, f], 300, 2));
      const rOf = (p) => Math.hypot(p[0], p[2]);
      // Distance to the nearest layer line (moist crumb and shadow live there).
      const seamDist = (r, y) => Math.min(y - low(r), high(r) - y);

      const color = (p) => {
        const r = rOf(p);
        const y = p[1];
        if (coated(r, y)) return mix(GANACHE, GANACHE_LIGHT, fbm(p, 160, 2) * 0.6);
        if (!sponge) {
          // Filling: dense and smooth, lighter where the knife smeared it.
          return mix(FILLING, FILLING_LIGHT, smoothstep(0.45, 0.85, fbm([r * 0.3, y * 3, f], 140, 3)) * 0.6);
        }
        const pore = Math.max(finePores(r, y, f), airPockets(r, y, f));
        let c = mix(SPONGE_DARK, SPONGE, fbm([r, y, f], 220, 3));
        c = mix(c, SPONGE_LIGHT, smoothstep(0.5, 0.85, fbm([r, y, f + 3], 900, 2)) * 0.45);
        // Sandy, velvety crumb: fine light/dark grain everywhere, pores only a little darker.
        c = shade(c, 0.82 + 0.36 * fbm([r, y, f + 5], 2500, 2));
        c = mix(c, PORE, smoothstep(0.15, 0.8, pore) * 0.5);
        // Moist, darker crumb next to the filling and at the bottom.
        return shade(c, 0.8 + 0.2 * smoothstep(0, cm(0.25), seamDist(r, y)));
      };

      const bump = (p) => {
        const r = rOf(p);
        const y = p[1];
        if (coated(r, y)) return (fbm(p, 400, 2) - 0.5) * cm(0.008);
        if (!sponge) {
          // Smooth, dense filling: a faint knife drag and a soft ripple.
          return (fbm([r * 0.5, y * 2, f], 700, 2) - 0.5) * cm(0.005) + (fbm([r, y, f], 220, 2) - 0.5) * cm(0.012);
        }
        const grain = (fbm([r, y, f + 7], 2600, 3) - 0.5) * cm(0.03) + (fbm([r, y, f + 13], 800, 2) - 0.5) * cm(0.04);
        return -finePores(r, y, f) * cm(0.07) + grain;
      };

      const rough = (p) => {
        const r = rOf(p);
        const y = p[1];
        if (coated(r, y)) return 0.22;
        if (!sponge) return 0.3 + 0.1 * fbm([r * 0.3, y * 3, f], 140, 2);
        // Dry crumb is matte; moist patches near the filling catch a soft sheen.
        const moist = 1 - smoothstep(0, cm(0.35), seamDist(r, y));
        return 0.84 - 0.28 * moist - 0.12 * smoothstep(0.55, 0.85, fbm([r, y, f + 11], 160, 2)) + 0.08 * finePores(r, y, f);
      };

      const ao = (p) => {
        const r = rOf(p);
        const y = p[1];
        if (coated(r, y)) return 1;
        const seam = 0.8 + 0.2 * smoothstep(0, cm(0.2), seamDist(r, y));
        if (!sponge) return seam;
        const pore = Math.max(finePores(r, y, f), airPockets(r, y, f));
        return seam * (1 - 0.45 * smoothstep(0.05, 0.8, pore));
      };

      const part = new Part(
        140,
        nv,
        (u, v) => {
          const y0 = low(u * R);
          const y1 = high(u * R);
          const y = y0 + v * (y1 - y0);
          const r = u * outerR(y);
          const p = at(r, th, y);
          let d = 0;
          if (sponge && r < outerR(y) - COAT) {
            const seam = smoothstep(0, 0.12, v) * smoothstep(0, 0.12, 1 - v) * smoothstep(0, 0.04, u);
            d = (-airPockets(r, y, f) * cm(0.09) + (fbm([r, y, f], 700, 2) - 0.5) * cm(0.025)) * seam;
          } else if (kind === "filling") {
            // Soft filling bulges a little out of the cut.
            d = Math.sin(Math.PI * v) * cm(0.04);
          }
          return [p[0] + n[0] * d, p[1], p[2] + n[1] * d];
        },
        { material: sponge ? "crumb" : kind === "ganache" ? "ganache" : "satin", color, k: sponge ? 6 : 4, weld: false },
      );
      Object.assign(part, { bump, rough, ao, inside: INSIDE });
      parts.push(part);
    });
  }
  return parts;
}

// --- Ganache top and outer side ---------------------------------------------------

/** Tiny air bubbles set into the ganache: shallow round pits. */
const bubbles = (a, b) => cells(a, b, 77, 0.004, 0.22, 0.04, 0.1, 1);

function ganacheShell() {
  const gloss = (p) => mix(GANACHE, GANACHE_LIGHT, smoothstep(0.35, 0.9, fbm([p[0] * 2.5, p[1], p[2] * 2.5], 70, 3)) * 0.65);

  // Flat top, gently uneven where the spatula went; exact at the edges so it meets the cut faces.
  const top = new Part(
    120,
    48,
    (u, v) => {
      const r = u * (R - EDGE);
      const th = -A / 2 + v * A;
      const p = at(r, th, TOP);
      const fade = smoothstep(0, 0.12, v) * smoothstep(0, 0.12, 1 - v) * smoothstep(0, 0.1, 1 - u) * smoothstep(0, 0.15, u);
      p[1] += (fbm(p, 55, 3) - 0.5) * cm(0.07) * fade;
      return p;
    },
    { material: "ganache", color: gloss, k: 4, weld: false },
  );
  Object.assign(top, {
    inside: INSIDE,
    // Long, shallow spatula sweeps plus a few bubbles.
    bump: (p) => {
      const sweep = Math.sin(Math.atan2(p[2], p[0] - cm(14)) * 40 + fbm(p, 30, 2) * 6) * cm(0.0012);
      return sweep + (fbm(p, 60, 3) - 0.5) * cm(0.006) - bubbles(p[0], p[2]) * cm(0.02);
    },
    // Even gloss: tempered chocolate is uniform (and flat values compress without blocks).
    rough: () => 0.18,
  });

  // Rounded edge, outer side and foot, swept across the slice angle.
  const profile = [];
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    profile.push([R - EDGE + EDGE * Math.sin(a), TOP - EDGE + EDGE * Math.cos(a)]);
  }
  profile.push([R, BASE + FOOT]);
  for (let i = 1; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    profile.push([R - FOOT + FOOT * Math.cos(a), BASE + FOOT - FOOT * Math.sin(a)]);
  }
  const side = lathe(profile, {
    nu: 60,
    nv: 70,
    theta0: -A / 2,
    thetaLength: A,
    material: "ganache",
    k: 4,
    weld: false,
    // Horizontal spatula streaks.
    color: (p) => mix(GANACHE, GANACHE_LIGHT, smoothstep(0.4, 0.95, fbm([p[0] * 0.4, p[1] * 6, p[2] * 0.4], 60, 3)) * 0.6),
  });
  Object.assign(side, {
    inside: INSIDE,
    bump: (p) => (fbm([p[0] * 0.3, p[1] * 8, p[2] * 0.3], 70, 3) - 0.5) * cm(0.012) - bubbles(Math.atan2(p[2], p[0]) * R, p[1]) * cm(0.02),
    rough: () => 0.2,
    // A little darker where the side meets the plate.
    ao: (p) => 0.7 + 0.3 * smoothstep(BASE, BASE + cm(0.6), p[1]),
  });
  return [top, side];
}

// --- Garnish ----------------------------------------------------------------------------

function raspberry(r, rand) {
  const core = ellipsoid(r * 0.8, r * 0.9, r * 0.8, { nu: 20, nv: 12, material: "berry", color: () => hex("#5a0a1a") });
  Object.assign(core, { ao: () => 0.35, rough: () => 0.4 });
  const parts = [core];
  const n = 70;
  for (let i = 0; i < n; i++) {
    const y = 0.97 - ((i + 0.5) / n) * 1.82; // leaves the stem hollow open at the bottom
    const rad = Math.sqrt(1 - y * y);
    const th = i * 2.39996 + rand() * 0.25;
    const d = r * 0.3 * rand.range(0.9, 1.08);
    const out = [Math.cos(th) * rad, y, Math.sin(th) * rad];
    const tone = mix(hex("#6c0b1f"), hex("#8f1529"), rand());
    const seed = rand() * 100;
    const facing = (p) => {
      const l = Math.hypot(p[0], p[1], p[2]) || 1;
      return (p[0] * out[0] + p[1] * out[1] + p[2] * out[2]) / l;
    };
    const drupelet = ellipsoid(d, d * 1.05, d, {
      nu: 10,
      nv: 7,
      material: "berry",
      k: 2,
      // Lighter where it faces out, darker where it presses into its neighbors.
      color: (p) => mix(hex("#55091a"), tone, smoothstep(-0.2, 0.8, facing(p))),
    }).move(out[0] * r * 0.74, out[1] * r * 0.86, out[2] * r * 0.74);
    Object.assign(drupelet, {
      inside: [0, 0, 0],
      bump: (p) => (noise(p[0] * 9000 + seed, p[1] * 9000, p[2] * 9000) - 0.5) * cm(0.004),
      rough: (p) => 0.2 + 0.15 * (1 - smoothstep(0, 0.8, facing(p))),
      ao: (p) => 0.45 + 0.55 * smoothstep(-0.3, 0.6, facing(p)),
    });
    parts.push(drupelet);
  }
  return parts;
}

function creamRosette(x, y) {
  const r0 = cm(1.45);
  const h = cm(1.9);
  const ridges = 9;
  const cream = hex("#f5eee1");
  const groove = (u, v) => 0.5 - 0.5 * Math.cos(ridges * (u * TAU + v * 1.7));
  const part = new Part(
    72,
    26,
    (u, v) => {
      const ang = u * TAU;
      const twist = v * 1.7;
      const rr = r0 * Math.pow(1 - v, 0.75) * (1 + 0.13 * Math.cos(ridges * (ang + twist)));
      // The tip leans and curls over, like piped cream.
      const lean = cm(0.35) * v * v;
      return [x + rr * Math.cos(ang) + lean, y + v * h - 0.0008, rr * Math.sin(ang)];
    },
    {
      material: "satin",
      k: 4,
      color: (p, u, v) => {
        const c = mix(cream, shade(cream, 0.9), (1 - groove(u, v)) * 0.4);
        return shade(c, 0.9 + 0.1 * smoothstep(0, 0.25, v)); // shadow where it sits on the ganache
      },
    },
  );
  Object.assign(part, {
    inside: [x, y + h * 0.3, 0],
    // Fine lines left by the piping tip, following each ridge.
    bump: (p, u, v) => Math.sin((u * TAU + v * 1.7) * ridges * 6) * cm(0.006) + (fbm(p, 900, 2) - 0.5) * cm(0.006),
    rough: (p, u, v) => 0.48 + 0.1 * (1 - groove(u, v)),
    ao: (p, u, v) => (0.72 + 0.28 * groove(u, v)) * (0.8 + 0.2 * smoothstep(0, 0.2, v)),
  });
  return part;
}

/** A thin curled shaving of chocolate. */
function shaving(len, wid, rc, rand) {
  const dark = hex("#3a1b0c");
  const milk = hex("#7a4626");
  const seed = rand() * 100;
  const part = new Part(
    24,
    6,
    (u, v) => {
      const a = (u * len) / rc;
      const w = wid * (0.55 + 0.45 * Math.sin(Math.PI * u)) * (0.85 + 0.3 * fbm([u, seed, 0], 4, 2));
      return [rc * Math.sin(a), rc * (1 - Math.cos(a)), (v - 0.5) * w];
    },
    {
      material: "satin",
      k: 3,
      weld: false,
      color: (p, u, v) => mix(dark, milk, smoothstep(0.25, 0.85, fbm([u * 3, v, seed], 3, 2))),
    },
  );
  // Scraped chocolate: fine ridges along the length.
  Object.assign(part, {
    twoSided: true,
    bump: (p, u, v) => Math.sin(v * 60 + fbm([u, seed, 1], 3, 2) * 4) * cm(0.003),
    rough: () => 0.4,
  });
  return part;
}

function crumb(size, rand) {
  const seed = rand() * 50;
  const part = ellipsoid(size, size * 0.75, size * rand.range(0.7, 1), {
    nu: 10,
    nv: 7,
    material: "crumb",
    k: 2,
    disp: (d) => (fbm([d[0] + seed, d[1], d[2]], 3, 2) - 0.5) * 0.7,
    color: (p) => mix(SPONGE_DARK, SPONGE, fbm([p[0], p[1], p[2] + seed], 600, 2)),
  })
    .rotY(rand() * TAU)
    .rotX(rand.range(-0.5, 0.5));
  Object.assign(part, { inside: [0, 0, 0], bump: (p) => (fbm(p, 3000, 2) - 0.5) * cm(0.01), rough: () => 0.85 });
  return part;
}

const each = (list, fn) => {
  for (const p of list) fn(p);
  return list;
};

// --- The dish -----------------------------------------------------------------------------

export function chocolateCake() {
  const rand = rng(11);
  const parts = [];

  const plate = dinnerPlate(20, (p) => mix(hex("#f7f5f1"), hex("#e9e5de"), fbm(p, 25, 2) * 0.6));
  parts.push(plate);

  const slice = [...cutFaces(), ...ganacheShell()];

  const rosetteX = R * 0.72;
  slice.push(creamRosette(rosetteX, TOP));
  const berryR = cm(0.95);
  slice.push(...each(raspberry(berryR, rand), (p) => p.rotX(Math.PI).rotZ(0.3).move(rosetteX + cm(0.3), TOP + cm(1.75) + berryR * 0.7, 0)));

  // Shavings lying on the ganache, around the rosette.
  for (let i = 0; i < 7; i++) {
    // Gently curved, lying down: the curl angle stays under ~50 degrees.
    const len = cm(rand.range(1.2, 1.9));
    const s = shaving(len, cm(rand.range(0.45, 0.7)), len * rand.range(1.2, 1.6), rand);
    const rr = R * rand.range(0.3, 0.62);
    const th = rand.range(-A * 0.32, A * 0.32);
    s.rotX(rand.range(-0.25, 0.25)).rotY(rand() * TAU).move(rr * Math.cos(th), TOP + cm(0.04), rr * Math.sin(th));
    slice.push(s);
  }

  // Center the slice on the plate and turn it so a cut face looks at the camera.
  const centroid = (2 * R * Math.sin(A / 2)) / (3 * (A / 2));
  each(slice, (p) => p.move(-centroid, 0, 0).rotY((52 * Math.PI) / 180).move(cm(0.5), 0, cm(-0.8)));
  parts.push(...slice);

  // On the plate: one raspberry and a few crumbs that fell off the cut.
  parts.push(...each(raspberry(cm(0.9), rand), (p) => p.rotX(Math.PI).rotZ(0.5).move(cm(-5.6), plate.surface(cm(-5.6), cm(3.6)) + cm(0.78), cm(3.6))));
  for (let i = 0; i < 6; i++) {
    const size = cm(rand.range(0.12, 0.32));
    const x = cm(rand.range(-1.5, 3.5));
    const z = cm(rand.range(3.4, 5.6));
    parts.push(crumb(size, rand).move(x, plate.surface(x, z) + size * 0.5, z));
  }

  return parts;
}
