// Brazilian pudim (condensed-milk flan) built from ONE real photo.
//
// The shape is a ring flan (surface of revolution) measured from the photo.
// Every texel is colored by projecting the 3D point back into the photo with
// the camera angle estimated from the photo itself. The back of the pudim,
// which the photo can't see, mirrors the front.
//
// Source photo: scripts/demo/photos/pudim-cc0.jpg (CC0, see CREDITS.md).

import path from "node:path";
import { Part, cm, disc, fbm, hex, lathe, mix, noise, shade, smoothstep } from "./geometry.mjs";
import { loadPhoto } from "./photo.mjs";

export const PUDIM_PHOTO = path.join(import.meta.dirname, "photos", "pudim-cc0.jpg");

// Measurements taken on a 960x1280 copy of the photo.
const CAM = {
  cx: 467, // image x of the pudim's axis
  cy: 725, // image y of the center of the top face
  pxPerCm: 29.73, // top face is 654 px wide for a 22 cm pudim
  sinE: 0.856, // top ellipse ratio 280/327 -> camera ~59 degrees above the table
  cosE: 0.517,
};

const H = 0.062; // pudim height (top radius is 11 cm)
const BASE = 0.0065; // plate surface

/** Changes positions before any transform (local and world stay equal). */
function deform(part, fn) {
  for (let o = 0; o < part.local.length; o += 3) {
    const p = fn(part.local[o], part.local[o + 1], part.local[o + 2]);
    part.local.set(p, o);
    part.world.set(p, o);
  }
  return part;
}

function project(sample, X, Y, Z) {
  const s = CAM.pxPerCm;
  const x = X * 100;
  const y = (Y - BASE) * 100;
  const z = Z * 100;
  return sample(CAM.cx + x * s, CAM.cy + z * s * CAM.sinE + (H * 100 - y) * s * CAM.cosE);
}

// Cross-section of the ring flan: hole wall (bottom -> top), top, outer wall (top -> bottom).
const SIDES = [
  [cm(4.1), BASE],
  [cm(4.05), BASE + cm(4.5)],
  [cm(4.02), BASE + cm(5.5)],
  [cm(4.08), BASE + cm(5.92)],
  [cm(4.25), BASE + cm(6.12)],
  [cm(4.5), BASE + H],
  [cm(10.4), BASE + H],
  [cm(10.75), BASE + cm(6.12)],
  [cm(10.95), BASE + cm(5.92)],
  [cm(11.02), BASE + cm(5.6)],
  [cm(11.15), BASE + cm(3)],
  [cm(11.35), BASE + cm(0.8)],
  [cm(11.45), BASE + cm(0.2)],
  [cm(11.45), BASE],
];
const INNER = SIDES.slice(0, 6); // hole wall, bottom -> top
const OUTER = SIDES.slice(6).reverse(); // outer wall, bottom -> top

/** Radius of a wall polyline at height y. */
function radiusAt(wall, y) {
  for (let i = 1; i < wall.length; i++) {
    if (y <= wall[i][1]) {
      const [r0, y0] = wall[i - 1];
      const [r1, y1] = wall[i];
      return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0 || 1);
    }
  }
  return wall[wall.length - 1][0];
}

/** Colors the outside of the pudim straight from the photo. */
function photoSkin(photo) {
  return (p) => {
    const [x, y, z] = p;
    const r = Math.hypot(x, z);
    const top = y > BASE + H - 0.0015 && r > cm(4.4) && r < cm(10.5);
    if (top) return project(photo.sample, x, y, z);
    // Hole wall: the photo shows its back half. Outer wall: its front half.
    const hole = r < cm(4.6);
    const visibleZ = hole ? -Math.abs(z) : Math.abs(z);
    return project(photo.sample, x, y, visibleZ);
  };
}

/** Uneven sides, like a real unmolded flan. */
function wobble(x, y, z) {
  const r = Math.hypot(x, z);
  if (r < cm(9.5)) return [x, y, z];
  const th = Math.atan2(z, x);
  const k = 1 + 0.008 * (fbm([Math.cos(th) * 3, y * 20, Math.sin(th) * 3], 1, 2) - 0.5);
  return [x * k, y, z * k];
}

// Inside colors sampled from the photo: cream body, caramel-soaked top.
const CREAM = hex("#f4d095");
const CREAM_DARK = hex("#e6ba74");
const CARAMEL = hex("#975524");
const CARAMEL_DARK = hex("#773407");

function insideColor(p) {
  const rel = (p[1] - BASE) / H; // 0 bottom -> 1 top
  let c = mix(CREAM, CREAM_DARK, fbm(p, 220, 3) * 0.8);
  // Tiny air bubbles, more of them low in the flan.
  const bubble = noise(p[0] * 1800, p[1] * 1800, p[2] * 1800);
  if (bubble > (rel < 0.4 ? 0.74 : 0.82)) c = shade(c, 0.8);
  c = mix(c, CARAMEL, smoothstep(0.86, 0.95, rel));
  return mix(c, CARAMEL_DARK, smoothstep(0.95, 1, rel));
}

export async function pudim() {
  const photo = await loadPhoto(PUDIM_PHOTO, 960);
  const parts = [];

  // --- Plate: white porcelain with a scalloped, embossed rim (31 cm) -------
  const PR = cm(15.5);
  const plate = lathe(
    [
      [0, BASE],
      [cm(11.8), BASE],
      [cm(13), 0.0095],
      [cm(14.8), 0.015],
      [PR, 0.016],
      [PR, 0.0145],
      [cm(14.8), 0.0135],
      [cm(13), 0.008],
      [cm(11.8), 0.004],
      [cm(10), 0],
      [cm(8), 0],
      [cm(7.8), 0.003],
      [0, 0.003],
    ],
    {
      nu: 160,
      nv: 64,
      material: "ceramic",
      k: 2,
      color: (p) => {
        const r = Math.hypot(p[0], p[2]);
        const th = Math.atan2(p[2], p[0]);
        let c = mix(hex("#f8f6f1"), hex("#ece8e0"), fbm(p, 20, 2) * 0.5);
        const band = smoothstep(cm(12.6), cm(13.2), r) * (1 - smoothstep(cm(15), cm(15.3), r));
        c = shade(c, 1 - band * 0.05 * (0.5 + 0.5 * Math.cos(32 * th + r * 400)));
        if (r > cm(15.3)) c = mix(c, hex("#bdb7ad"), 0.7);
        return c;
      },
    },
  );
  deform(plate, (x, y, z) => {
    const r = Math.hypot(x, z);
    const th = Math.atan2(z, x);
    // Scallops only cut inward, so the widest point stays exactly 31 cm.
    const k = 1 - 0.028 * (0.5 - 0.5 * Math.cos(16 * th)) * smoothstep(cm(12.5), cm(15), r);
    return [x * k, y, z * k];
  });
  parts.push(plate);

  // --- Caramel pooled around the base -------------------------------------
  const plateTop = (r) =>
    r < cm(11.8) ? BASE : r < cm(13) ? BASE + ((r - cm(11.8)) / cm(1.2)) * (0.0095 - BASE) : 0.0095;
  parts.push(
    // Caramel stays inside the plate's rim (max 14 cm radius).
    disc((th) => Math.min(cm(14), cm(12.2) + cm(3.2) * fbm([Math.cos(th), Math.sin(th), 0], 1.6, 3) + cm(1.6) * Math.max(0, Math.sin(th))), {
      nu: 120,
      nv: 18,
      height: (x, z, v) => plateTop(Math.hypot(x, z)) + 0.0003 + 0.0011 * (1 - v ** 6),
      material: "gloss",
      k: 2,
      color: (p, u, v) => mix(hex("#8f4a08"), hex("#d99536"), smoothstep(0.82, 1, v)),
    }),
  );

  // --- The pudim, textured from the photo ----------------------------------
  const body = lathe([...SIDES, [cm(8), BASE], [cm(4.1), BASE]], {
    nu: 128,
    nv: 90,
    material: "satin",
    k: 8,
    color: photoSkin(photo),
  });
  parts.push(deform(body, wobble));

  return parts;
}

// ---------------------------------------------------------------------------
// One slice (1/8 of the 22 cm pudim) on an 18 cm dessert plate
// ---------------------------------------------------------------------------

export const SLICE_ANGLE = Math.PI / 4; // 45 degrees = 1/8

export async function pudimSlice() {
  const photo = await loadPhoto(PUDIM_PHOTO, 960);
  const parts = [];

  // Cut from the front of the photographed pudim (best lit, fully visible).
  const theta0 = Math.PI / 2 - SLICE_ANGLE / 2;
  const slice = [
    deform(
      lathe(SIDES, { nu: 32, nv: 90, theta0, thetaLength: SLICE_ANGLE, material: "satin", k: 8, color: photoSkin(photo) }),
      wobble,
    ),
  ];
  // The two cut faces show the creamy inside.
  for (const th of [theta0, theta0 + SLICE_ANGLE]) {
    const face = new Part(
      44,
      32,
      (u, v) => {
        const y = BASE + v * H;
        const r = radiusAt(INNER, y) + u * (radiusAt(OUTER, y) - radiusAt(INNER, y));
        return [r * Math.cos(th), y, r * Math.sin(th)];
      },
      { material: "satin", k: 6, weld: false, color: insideColor },
    );
    slice.push(deform(face, wobble));
  }

  // Center the slice and set it on the plate. Rounded side faces the diner (+Z),
  // so width x depth x height can be checked against the menu data.
  const r1 = cm(4.1);
  const r2 = cm(11.4);
  const half = SLICE_ANGLE / 2;
  const centroid = (((2 / 3) * (r2 ** 3 - r1 ** 3)) / (r2 ** 2 - r1 ** 2)) * (Math.sin(half) / half);
  const PLATE_BASE = 0.0055;
  for (const p of slice) p.move(0, PLATE_BASE - BASE, -centroid);
  parts.push(...slice);

  // Small white dessert plate, exactly 18 cm.
  const R = cm(9);
  const plate = lathe(
    [
      [0, PLATE_BASE],
      [0.62 * R, PLATE_BASE],
      [0.72 * R, PLATE_BASE + 0.0025],
      [0.92 * R, PLATE_BASE + 0.0075],
      [R, PLATE_BASE + 0.0085],
      [R, PLATE_BASE + 0.007],
      [0.92 * R, PLATE_BASE + 0.0062],
      [0.72 * R, 0.004],
      [0.62 * R, 0.002],
      [0.55 * R, 0],
      [0.45 * R, 0],
      [0.43 * R, 0.002],
      [0, 0.002],
    ],
    {
      nu: 128,
      nv: 48,
      material: "ceramic",
      k: 2,
      color: (p) => {
        const r = Math.hypot(p[0], p[2]);
        let c = mix(hex("#f8f6f1"), hex("#ece8e0"), fbm(p, 20, 2) * 0.5);
        if (r > 0.985 * R) c = mix(c, hex("#bdb7ad"), 0.7);
        return c;
      },
    },
  );
  parts.push(
    deform(plate, (x, y, z) => {
      const r = Math.hypot(x, z);
      // Scallops only cut inward, so the plate stays exactly 18 cm.
      const k = 1 - 0.03 * (0.5 - 0.5 * Math.cos(12 * Math.atan2(z, x))) * smoothstep(0.8 * R, R, r);
      return [x * k, y, z * k];
    }),
  );

  // A little caramel pooled around the slice.
  parts.push(
    disc((th) => Math.min(0.6 * R, cm(4.6) + cm(1.6) * fbm([Math.cos(th), Math.sin(th), 7], 1.8, 3)), {
      nu: 72,
      nv: 12,
      height: (x, z, v) => PLATE_BASE + 0.0003 + 0.0009 * (1 - v ** 6),
      material: "gloss",
      k: 2,
      color: (p, u, v) => mix(CARAMEL_DARK, hex("#c98a3a"), smoothstep(0.8, 1, v)),
    }),
  );

  return parts;
}

/** The menu photo: a 4:3 crop of the real photo. */
export async function pudimMenuPhoto(file) {
  const sharp = (await import("sharp")).default;
  // Crop in 960x1280 space -> 1920x2560 source pixels.
  await sharp(PUDIM_PHOTO)
    .rotate()
    .extract({ left: 0, top: 820, width: 1920, height: 1440 })
    .resize(1200, 900)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(file);
}
