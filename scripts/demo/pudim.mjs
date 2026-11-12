// Brazilian pudim (condensed-milk flan) built from ONE real photo.
//
// The shape is a ring flan (surface of revolution) measured from the photo.
// Every texel is colored by projecting the 3D point back into the photo with
// the camera angle estimated from the photo itself. The back of the pudim,
// which the photo can't see, mirrors the front.
//
// Source photo: scripts/demo/photos/pudim-cc0.jpg (CC0, see CREDITS.md).

import path from "node:path";
import { cm, disc, fbm, hex, lathe, mix, shade, smoothstep } from "./geometry.mjs";
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
  const body = lathe(
    [
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
      [cm(8), BASE],
      [cm(4.1), BASE],
    ],
    {
      nu: 128,
      nv: 90,
      material: "satin",
      k: 8,
      color: (p) => {
        const [x, y, z] = p;
        const r = Math.hypot(x, z);
        const top = y > BASE + H - 0.0015 && r > cm(4.4) && r < cm(10.5);
        if (top) return project(photo.sample, x, y, z);
        // Hole wall: the photo shows its back half. Outer wall: its front half.
        const hole = r < cm(4.6);
        const visibleZ = hole ? -Math.abs(z) : Math.abs(z);
        return project(photo.sample, x, y, visibleZ);
      },
    },
  );
  // Slightly uneven sides, like a real unmolded flan.
  deform(body, (x, y, z) => {
    const r = Math.hypot(x, z);
    if (r < cm(9.5)) return [x, y, z];
    const th = Math.atan2(z, x);
    const k = 1 + 0.008 * (fbm([Math.cos(th) * 3, y * 20, Math.sin(th) * 3], 1, 2) - 0.5);
    return [x * k, y, z * k];
  });
  parts.push(body);

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
