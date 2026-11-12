// Brazilian pudim (condensed-milk flan) built from ONE real photo.
//
// Photo: "Flan or Pudim" by Under the same moon... (Flickr), CC BY 2.0 — a
// pudim in a Brazilian bakery display. See photos/CREDITS.md.
//
// The shape is a ring flan measured from the photo. Every texel is colored by
// projecting its 3D point back into the photo with the camera angle estimated
// from the top ellipse. Parts the photo can't see mirror the parts it can.
// Top (caramel glaze), sides (moist custard with real pores in the geometry)
// and the hole are separate parts so each gets its own finish in AR.

import path from "node:path";
import { Part, TAU, cm, disc, fbm, hex, lathe, mix, noise, shade, smoothstep } from "./geometry.mjs";
import { loadPhoto } from "./photo.mjs";

export const PUDIM_PHOTO = path.join(import.meta.dirname, "photos", "pudim-bakery-ccby.jpg");

// Measured on a 1200 x 914 copy of the photo.
const REF_WIDTH = 1200;
const CAM = {
  cx: 558, // image x of the pudim's axis
  cy: 418, // image y of the center of the top face
  pxPerCm: 34.6, // top face is 727 px wide for a 21 cm pudim
  sinE: 0.2245, // top ellipse 163/727 -> camera ~13 degrees above the table
  cosE: 0.974,
};

const RT = 0.105; // top radius (21 cm pudim)
const RB = 0.103; // bottom radius (the base curls in slightly)
const RH = 0.025; // center hole
const H = 0.085; // height
const BASE = 0.006; // plate surface

/** Changes positions before any transform (local and world stay equal). */
function deform(part, fn) {
  for (let o = 0; o < part.local.length; o += 3) {
    const p = fn(part.local[o], part.local[o + 1], part.local[o + 2]);
    part.local.set(p, o);
    part.world.set(p, o);
  }
  return part;
}

/** Photo color for a 3D point (meters, pudim standing on y = BASE). */
function project(sample, X, Y, Z) {
  const s = CAM.pxPerCm;
  const x = X * 100;
  const y = (Y - BASE) * 100;
  const z = Z * 100;
  return sample(CAM.cx + x * s, CAM.cy + z * s * CAM.sinE + (H * 100 - y) * s * CAM.cosE);
}

// --- Shape (radius, y) ------------------------------------------------------

const TOP = [
  [RH + 0.004, BASE + H],
  [RT - 0.006, BASE + H],
  [RT - 0.0025, BASE + H - 0.0008],
  [RT - 0.0006, BASE + H - 0.003],
  [RT, BASE + H - 0.006],
];
const SIDE = [
  [RT, BASE + H - 0.006],
  [RT - 0.0008, BASE + H * 0.55],
  [RT - 0.0018, BASE + H * 0.3],
  [RB + 0.0005, BASE + 0.012],
  [RB - 0.002, BASE + 0.004],
  [RB - 0.006, BASE + 0.0006],
  [RB - 0.01, BASE],
];
const HOLE = [
  [RH, BASE],
  [RH, BASE + H - 0.004],
  [RH + 0.0015, BASE + H - 0.0008],
  [RH + 0.004, BASE + H],
];
// Walls as radius-by-height polylines (bottom -> top), used for the cut faces.
const OUTER_WALL = [...SIDE].reverse();
const INNER_WALL = HOLE;

function radiusAt(wall, y) {
  if (y <= wall[0][1]) return wall[0][0];
  for (let i = 1; i < wall.length; i++) {
    if (y <= wall[i][1]) {
      const [r0, y0] = wall[i - 1];
      const [r1, y1] = wall[i];
      return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0 || 1);
    }
  }
  return wall[wall.length - 1][0];
}

/** Tiny pores on the custard sides (geometry, so they catch real light in AR). */
function pores(x, y, z) {
  const r = Math.hypot(x, z);
  if (r < RT - 0.012 || y > BASE + H - 0.004) return [x, y, z];
  const pit = smoothstep(0.8, 0.93, noise(x * 1400, y * 1400, z * 1400));
  const k = 1 - (0.00025 * pit) / r;
  return [x * k, y, z * k];
}

async function photoColors() {
  const photo = await loadPhoto(PUDIM_PHOTO, REF_WIDTH);
  const avg = (x0, y0, x1, y1) => {
    const sum = [0, 0, 0];
    let n = 0;
    for (let x = x0; x <= x1; x += 4) {
      for (let y = y0; y <= y1; y += 4) {
        const c = photo.sample(x, y);
        for (let i = 0; i < 3; i++) sum[i] += c[i];
        n++;
      }
    }
    return sum.map((v) => v / n);
  };
  return {
    photo,
    custard: avg(300, 560, 500, 680), // the side, away from the caramel
    caramel: avg(250, 380, 450, 440), // the glazed top
    pool: avg(430, 815, 690, 850), // caramel pooled in front, where it's deep amber
  };
}

/** The outside, straight from the photo. */
function skin({ photo }, kind) {
  return (p) => {
    const [x, y, z] = p;
    if (kind === "top") {
      // Front-left quarter only: the price tag and its stick hide the rest.
      return project(photo.sample, -Math.abs(x), y, Math.abs(z));
    }
    // Sides: the photo sees the front half; the back mirrors it.
    return project(photo.sample, x, y, Math.abs(z));
  };
}

function holeColor(colors) {
  const dark = shade(colors.caramel, 0.55);
  return (p) => mix(dark, colors.caramel, smoothstep(0.75, 1, (p[1] - BASE) / H) * 0.6 + fbm(p, 300, 2) * 0.2);
}

/** Inside of the flan (cut faces): smooth custard, caramel-soaked top, a few bubbles. */
function insideColor(colors) {
  // The photo's side is in soft shade; a fresh cut is brighter and creamier.
  const light = mix(colors.custard, [1, 0.95, 0.72], 0.45);
  const base = mix(colors.custard, [1, 0.95, 0.72], 0.25);
  return (p) => {
    const rel = (p[1] - BASE) / H;
    let c = mix(light, base, fbm(p, 160, 3));
    if (noise(p[0] * 1600, p[1] * 1600, p[2] * 1600) > (rel < 0.35 ? 0.8 : 0.86)) c = shade(c, 0.86);
    c = mix(c, colors.caramel, smoothstep(0.93, 0.975, rel));
    return mix(c, shade(colors.caramel, 0.8), smoothstep(0.975, 1, rel));
  };
}

/** The pudim's surfaces over an angle range (full circle or a slice). */
function body(colors, { theta0 = 0, thetaLength = TAU, resolution = 1 } = {}) {
  const nu = (n) => Math.max(8, Math.round(n * resolution * (thetaLength / TAU)));
  const range = { theta0, thetaLength };
  return [
    lathe(TOP, { ...range, nu: nu(160), nv: 40, material: "gloss", k: 4, color: skin(colors, "top") }),
    deform(lathe(SIDE, { ...range, nu: nu(400), nv: 90, material: "glaze", k: 2, color: skin(colors, "side") }), pores),
    lathe(HOLE, { ...range, nu: nu(64), nv: 12, material: "glaze", k: 2, color: holeColor(colors) }),
  ];
}

// --- Plates and caramel -----------------------------------------------------

function whitePlate(diameterCm, plateBase) {
  const R = cm(diameterCm / 2);
  const plate = lathe(
    [
      [0, plateBase],
      [0.74 * R, plateBase],
      [0.82 * R, plateBase + 0.003],
      [0.95 * R, plateBase + 0.009],
      [R, plateBase + 0.0105],
      [R, plateBase + 0.0085],
      [0.95 * R, plateBase + 0.0072],
      [0.82 * R, 0.005],
      [0.74 * R, 0.0025],
      [0.6 * R, 0],
      [0.5 * R, 0],
      [0.48 * R, 0.0025],
      [0, 0.0025],
    ],
    {
      nu: 160,
      nv: 52,
      material: "ceramic",
      k: 2,
      color: (p) => {
        const r = Math.hypot(p[0], p[2]);
        let c = mix(hex("#fbfaf7"), hex("#eeebe5"), fbm(p, 18, 2) * 0.45);
        if (r > 0.985 * R) c = mix(c, hex("#c9c4bb"), 0.6);
        return c;
      },
    },
  );
  const top = (r) =>
    r <= 0.74 * R ? plateBase : r <= 0.82 * R ? plateBase + ((r - 0.74 * R) / (0.08 * R)) * 0.003 : plateBase + 0.003;
  return { plate, top, R };
}

function caramelPool(colors, radius, plateTop) {
  // Caramel reads darker than the photo's thin edges once it's glossy in 3D.
  const deep = shade(colors.caramel, 0.55);
  const edge = mix(shade(colors.pool, 0.8), colors.caramel, 0.4);
  return disc(radius, {
    nu: 120,
    nv: 16,
    height: (x, z, v) => plateTop(Math.hypot(x, z)) + 0.0003 + 0.0012 * (1 - v ** 5),
    material: "sauce",
    k: 2,
    color: (p, u, v) => mix(deep, edge, smoothstep(0.75, 1, v) + fbm(p, 60, 2) * 0.12),
  });
}

// --- Whole pudim (30 cm plate) -------------------------------------------------

export async function pudim() {
  const colors = await photoColors();
  const { plate, top } = whitePlate(30, BASE);
  const pool = caramelPool(
    colors,
    (th) => Math.min(cm(12.6), cm(11) + cm(2.4) * fbm([Math.cos(th), Math.sin(th), 3], 1.5, 3)),
    top,
  );
  return [plate, pool, ...body(colors)];
}

// --- One slice (1/8) on an 18 cm dessert plate ------------------------------------

export const SLICE_ANGLE = Math.PI / 4;

export async function pudimSlice() {
  const colors = await photoColors();
  const PLATE_BASE = 0.0055;
  const theta0 = Math.PI / 2 - SLICE_ANGLE / 2; // cut from the front: best seen in the photo
  const slice = body(colors, { theta0, thetaLength: SLICE_ANGLE, resolution: 1.4 });

  for (const th of [theta0, theta0 + SLICE_ANGLE]) {
    slice.push(
      new Part(
        48,
        40,
        (u, v) => {
          const y = BASE + v * H;
          const r = radiusAt(INNER_WALL, y) + u * (radiusAt(OUTER_WALL, y) - radiusAt(INNER_WALL, y));
          return [r * Math.cos(th), y, r * Math.sin(th)];
        },
        { material: "glaze", k: 6, weld: false, color: insideColor(colors) },
      ),
    );
  }

  // Center it (rounded side toward the diner, +Z) and set it on the plate.
  const half = SLICE_ANGLE / 2;
  const centroid = (((2 / 3) * (RT ** 3 - RH ** 3)) / (RT ** 2 - RH ** 2)) * (Math.sin(half) / half);
  for (const p of slice) p.move(0, PLATE_BASE - BASE, -centroid);

  const { plate, top, R } = whitePlate(18, PLATE_BASE);
  const pool = caramelPool(
    colors,
    (th) => Math.min(0.74 * R, cm(4.8) + cm(1.6) * fbm([Math.cos(th), Math.sin(th), 7], 1.8, 3)),
    top,
  );
  return [plate, pool, ...slice];
}
