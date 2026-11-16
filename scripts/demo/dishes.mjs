// Demo Bistro dishes and shared tableware, modeled at real-world size (meters).
// The chocolate cake lives in chocolate-cake.mjs.

import {
  Part,
  TAU,
  clamp01,
  cm,
  disc,
  ellipsoid,
  fbm,
  hex,
  lathe,
  leaf,
  mix,
  noise,
  rng,
  shade,
  smoothstep,
  tube,
} from "./geometry.mjs";

const each = (list, fn) => {
  for (const p of list) fn(p);
  return list;
};

// ---------------------------------------------------------------------------
// Tableware
// ---------------------------------------------------------------------------

/** Height of a lathe's top surface at radius r (top points listed center -> rim). */
function surfaceOf(top) {
  return (x, z) => {
    const r = Math.hypot(x, z);
    for (let i = 1; i < top.length; i++) {
      if (r <= top[i][0]) {
        const [r0, y0] = top[i - 1];
        const [r1, y1] = top[i];
        return y0 + ((y1 - y0) * (r - r0)) / (r1 - r0 || 1);
      }
    }
    return top[top.length - 1][1];
  };
}

/** Flat dinner plate. Food in the well sits at y = 0.008; use plate.surface(x, z) elsewhere. */
export function dinnerPlate(diameterCm, color, k = 2) {
  const R = cm(diameterCm / 2);
  const profile = [
    [0, 0.008],
    [0.55 * R, 0.008],
    [0.68 * R, 0.011],
    [0.9 * R, 0.018],
    [0.985 * R, 0.02],
    [R, 0.0188],
    [0.985 * R, 0.0172],
    [0.9 * R, 0.0155],
    [0.68 * R, 0.0062],
    [0.6 * R, 0.004],
    [0.58 * R, 0],
    [0.5 * R, 0],
    [0.48 * R, 0.003],
    [0, 0.003],
  ];
  const part = lathe(profile, { nu: 96, nv: 64, material: "ceramic", color, k });
  part.surface = surfaceOf(profile.slice(0, 5));
  return part;
}

/** Wide pasta bowl. Food sits at y = 0.012. */
function pastaBowl(diameterCm, color, k = 2) {
  const R = cm(diameterCm / 2);
  const profile = [
    [0, 0.012],
    [0.42 * R, 0.012],
    [0.5 * R, 0.016],
    [0.56 * R, 0.026],
    [0.6 * R, 0.033],
    [0.66 * R, 0.036],
    [0.95 * R, 0.043],
    [R, 0.042],
    [0.995 * R, 0.039],
    [0.95 * R, 0.0385],
    [0.66 * R, 0.031],
    [0.58 * R, 0.024],
    [0.5 * R, 0.007],
    [0.45 * R, 0],
    [0.38 * R, 0],
    [0.36 * R, 0.004],
    [0, 0.004],
  ];
  return lathe(profile, { nu: 112, nv: 72, material: "ceramic", color, k });
}

// ---------------------------------------------------------------------------
// Shared garnishes
// ---------------------------------------------------------------------------

function basilLeaf(length, width, { cup = 0.25, arch = 0.05, small = false } = {}) {
  const base = hex(small ? "#3f8f35" : "#2f7a2c");
  const vein = hex("#6fae55");
  return leaf(length, width, {
    cup,
    arch,
    material: "satin",
    k: 4,
    color: (p, u, v) => {
      const s = Math.abs(v * 2 - 1);
      let c = mix(base, shade(base, 0.75), fbm(p, 300, 3) * 0.7);
      if (s < 0.06) c = mix(vein, c, s / 0.06);
      const lateral = Math.abs(((u * 7 - s * 1.6) % 1) - 0.5);
      if (lateral < 0.04 && s < 0.85) c = mix(c, vein, 0.45);
      return mix(c, shade(c, 0.7), smoothstep(0.85, 1, s) * 0.5);
    },
  });
}

function speck(rand, size, colorHex, material = "matte") {
  const c = hex(colorHex);
  return ellipsoid(size * rand.range(0.7, 1.3), size * 0.35, size * rand.range(0.6, 1.1), {
    nu: 6,
    nv: 4,
    material,
    color: () => c,
  })
    .rotY(rand() * TAU)
    .rotX(rand.range(-0.4, 0.4));
}

// ---------------------------------------------------------------------------
// 2. Burrata & heirloom tomatoes — 23 cm stoneware plate
// ---------------------------------------------------------------------------

function tomatoSlice(R0, h, colors, seed) {
  const skin = hex(colors.skin);
  const flesh = hex(colors.flesh);
  const gel = hex(colors.gel);
  const seedC = hex("#f1dd9c");
  const wob = (th) => R0 * (1 + 0.04 * Math.sin(3 * th + seed) + 0.025 * Math.sin(7 * th + seed * 2) + 0.02 * Math.sin(2 * th));
  return new Part(
    64,
    30,
    (u, v) => {
      const th = u * TAU;
      const R = wob(th);
      if (v <= 0.45) {
        const rr = (v / 0.45) * R;
        return [rr * Math.cos(th), h, rr * Math.sin(th)];
      }
      if (v <= 0.55) {
        return [R * Math.cos(th), h * (1 - (v - 0.45) / 0.1), R * Math.sin(th)];
      }
      const rr = (1 - (v - 0.55) / 0.45) * R;
      return [rr * Math.cos(th), 0, rr * Math.sin(th)];
    },
    {
      material: "satin",
      k: 4,
      weld: false,
      color: (p, u, v) => {
        const grain = fbm(p, 500, 2);
        if (v > 0.451) {
          let c = mix(skin, shade(skin, 0.8), grain);
          if (colors.stripes) c = mix(c, hex(colors.stripes), smoothstep(0.55, 0.7, noise(p[0] * 120, p[1] * 900, p[2] * 120)));
          return c;
        }
        const th = Math.atan2(p[2], p[0]);
        const rho = Math.hypot(p[0], p[2]) / wob(th);
        const jitter = (fbm([Math.cos(th), Math.sin(th), seed], 2.5, 3) - 0.5) * 0.35;
        const r2 = rho + jitter * 0.4;
        if (r2 > 0.9) return mix(flesh, skin, smoothstep(0.9, 1.0, r2));
        const fleshC = mix(flesh, shade(flesh, 1.1), grain);
        if (r2 > 0.76 || r2 < 0.24) return fleshC;
        const sector = ((th + seed + jitter * 2 + TAU * 4) / (TAU / 6)) % 1;
        const septum = Math.min(sector, 1 - sector) * (TAU / 6) * rho * R0;
        const edge = smoothstep(cm(0.18), cm(0.4), septum) * smoothstep(0.24, 0.32, r2) * (1 - smoothstep(0.68, 0.76, r2));
        let c = mix(fleshC, mix(gel, shade(gel, 1.12), grain), edge);
        const seeds = noise(p[0] * 2200, p[1] * 50, p[2] * 2200);
        if (edge > 0.6 && seeds > 0.79) c = mix(c, seedC, 0.85);
        return c;
      },
    },
  );
}

function cherryHalf(r, colors) {
  const skin = hex(colors.skin);
  const flesh = hex(colors.flesh);
  const gel = hex(colors.gel);
  const dome = ellipsoid(r, r * 0.95, r, {
    nu: 28,
    nv: 10,
    phi0: Math.PI / 2,
    phi1: Math.PI,
    material: "satin",
    k: 2,
    color: (p) => mix(skin, shade(skin, 0.82), fbm(p, 400, 2)),
  });
  const cut = disc(r, {
    nu: 40,
    nv: 12,
    material: "satin",
    k: 3,
    color: (p) => {
      const rho = Math.hypot(p[0], p[2]) / r;
      if (rho > 0.88) return mix(flesh, skin, smoothstep(0.88, 1, rho));
      if (rho < 0.22 || rho > 0.7) return flesh;
      const th = Math.atan2(p[2], p[0]);
      const sector = ((th + TAU * 4) / (TAU / 2)) % 1;
      if (Math.min(sector, 1 - sector) < 0.08) return flesh;
      return noise(p[0] * 2500, 0, p[2] * 2500) > 0.8 ? hex("#f2df9f") : gel;
    },
  });
  return [dome, cut];
}

export function burrata() {
  const rand = rng(23);
  const parts = [];
  const base = 0.008;

  parts.push(
    dinnerPlate(
      23,
      (p) => {
        const rho = Math.hypot(p[0], p[2]) / cm(11.5);
        let c = mix(hex("#3d4146"), hex("#4a4f55"), fbm(p, 30, 3));
        const sp = noise(p[0] * 1100, p[1] * 1100, p[2] * 1100);
        if (sp > 0.86) c = hex("#6f6a62");
        if (sp < 0.06) c = hex("#23262a");
        if (rho > 0.965) c = mix(c, hex("#8a7f70"), 0.6);
        return c;
      },
      4,
    ),
  );

  // Burrata ball with a twisted knot on top.
  const bx = cm(-0.4);
  const bz = cm(-1.2);
  const rx = cm(4.2);
  const ry = cm(3.3);
  const by = base + ry * 0.86;
  const cream = (p) => mix(hex("#f6f0e1"), hex("#ddd0b4"), fbm(p, 110, 3));
  parts.push(
    ellipsoid(rx, ry, rx, {
      nu: 56,
      nv: 32,
      material: "satin",
      k: 3,
      disp: (d) => (fbm(d, 2.2, 4) - 0.5) * 0.13,
      color: cream,
    }).move(bx, by, bz),
  );
  parts.push(
    ellipsoid(cm(0.9), cm(0.6), cm(0.9), {
      nu: 24,
      nv: 12,
      material: "satin",
      k: 2,
      disp: (d, u, v) => 0.12 * Math.cos(5 * u * TAU + v * 6),
      color: cream,
    }).move(bx, by + ry * 0.94, bz),
  );
  const burrataTop = (x, z) => {
    const q = 1 - ((x - bx) / rx) ** 2 - ((z - bz) / rx) ** 2;
    return by + ry * Math.sqrt(Math.max(q, 0));
  };

  // Stracciatella spilling out toward the front.
  parts.push(
    // Upper half only: the cream sits on the plate instead of sinking through it.
    ellipsoid(cm(3.4), cm(1.3), cm(2.6), {
      nu: 40,
      nv: 12,
      phi1: Math.PI / 2,
      material: "satin",
      k: 2,
      disp: (d) => (fbm(d, 5, 4) - 0.5) * 0.5,
      color: (p) => mix(hex("#fbf5e6"), hex("#e2d4b6"), fbm(p, 260, 3)),
    })
      .rotY(-0.5)
      .move(bx + cm(2.2), base + 0.0003, bz + cm(3.0)),
  );

  // Heirloom slices.
  const RED = { skin: "#b51f16", flesh: "#cc2f22", gel: "#dc5440" };
  const YELLOW = { skin: "#e3a21c", flesh: "#f0b938", gel: "#f3c766" };
  const PURPLE = { skin: "#6e2622", flesh: "#9a3a30", gel: "#b5584a" };
  const ORANGE = { skin: "#d8541a", flesh: "#e86d2c", gel: "#ef8d58" };
  parts.push(tomatoSlice(cm(3.5), cm(0.55), RED, 1.3).rotZ(0.05).move(cm(-6.0), base, cm(1.2)));
  parts.push(tomatoSlice(cm(3.1), cm(0.5), ORANGE, 2.1).rotX(-0.1).rotZ(0.08).move(cm(-3.9), base + cm(0.4), cm(4.6)));
  parts.push(tomatoSlice(cm(3.3), cm(0.55), PURPLE, 0.4).rotX(0.06).move(cm(5.6), base, cm(-3.4)));
  parts.push(tomatoSlice(cm(2.9), cm(0.5), RED, 3.3).rotZ(-0.07).move(cm(6.6), base + cm(0.2), cm(1.4)));

  // Cherry tomato halves (cut side up) and one whole cherry tomato.
  const halves = [
    [cm(3.6), cm(5.6), RED],
    [cm(1.4), cm(6.9), YELLOW],
    [cm(-6.6), cm(-3.6), YELLOW],
    [cm(-1.6), cm(-6.6), ORANGE],
  ];
  for (const [x, z, colors] of halves) {
    const r = cm(1.25);
    const [tx, tz] = [rand.range(-0.25, 0.25), rand.range(-0.25, 0.25)];
    parts.push(...each(cherryHalf(r, colors), (p) => p.rotX(tx).rotZ(tz).move(x, base + r * 0.9, z)));
  }
  const cr = cm(1.3);
  parts.push(
    ellipsoid(cr, cr * 0.92, cr, {
      nu: 28,
      nv: 16,
      material: "gloss",
      k: 2,
      color: (p) => mix(hex("#c4231a"), hex("#8f150f"), fbm(p, 300, 2)),
    }).move(cm(-3.8), base + cr * 0.9, cm(-6.0)),
  );
  for (let i = 0; i < 5; i++) {
    parts.push(
      leaf(cm(0.7), cm(0.25), { cup: 0.2, arch: 0.3, material: "satin", color: () => hex("#3d6b22") })
        .rotY((i / 5) * TAU)
        .move(cm(-3.8), base + cr * 1.78, cm(-6.0)),
    );
  }

  // Basil: one leaf draped over the burrata, others around the plate.
  const topY = burrataTop(bx, bz);
  parts.push(
    basilLeaf(cm(4.6), cm(2.4), { cup: -0.12, arch: 0.12 })
      .move(-cm(2.3), topY - cm(4.6) * 0.12 + 0.0012, 0)
      .rotY(0.6)
      .move(bx + cm(0.3), 0, bz + cm(0.2)),
  );
  parts.push(basilLeaf(cm(3.8), cm(2.0)).rotY(2.4).move(cm(-1.5), base + cm(0.5), cm(-5.0)));
  parts.push(basilLeaf(cm(3.4), cm(1.8)).rotY(-0.9).move(cm(-7.5), base + cm(0.95), cm(-0.5)));
  parts.push(basilLeaf(cm(3.2), cm(1.7), { small: true }).rotY(0.5).move(cm(1.8), base + cm(0.15), cm(8.2)));

  // Olive oil and basil oil on the plate.
  for (let i = 0; i < 7; i++) {
    const th = rand() * TAU;
    const rr = cm(rand.range(5, 8.2));
    const s = cm(rand.range(0.8, 1.8));
    parts.push(
      ellipsoid(s, 0.0004, s * rand.range(0.5, 0.9), { nu: 20, nv: 6, material: "gloss", color: () => hex("#8c7c1f") })
        .rotY(rand() * TAU)
        .move(Math.cos(th) * rr, base + 0.0002, Math.sin(th) * rr),
    );
  }
  for (let i = 0; i < 9; i++) {
    const th = rand() * TAU;
    const rr = cm(rand.range(5.5, 8.5));
    const s = cm(rand.range(0.25, 0.5));
    parts.push(
      ellipsoid(s, 0.0006, s, { nu: 12, nv: 5, material: "gloss", color: () => hex("#2d6a1a") }).move(
        Math.cos(th) * rr,
        base + 0.0004,
        Math.sin(th) * rr,
      ),
    );
  }

  // Flaky salt and cracked pepper on the burrata.
  for (let i = 0; i < 26; i++) {
    const th = rand() * TAU;
    const rr = rx * 0.7 * Math.sqrt(rand());
    const x = bx + Math.cos(th) * rr;
    const z = bz + Math.sin(th) * rr;
    parts.push(speck(rand, cm(0.13), "#fbfaf6", "satin").move(x, burrataTop(x, z), z));
  }
  for (let i = 0; i < 40; i++) {
    const th = rand() * TAU;
    const rr = rx * 0.75 * Math.sqrt(rand());
    const x = bx + Math.cos(th) * rr;
    const z = bz + Math.sin(th) * rr;
    parts.push(speck(rand, cm(0.06), "#1d1611").move(x, burrataTop(x, z), z));
  }

  return parts;
}

// ---------------------------------------------------------------------------
// 3. Shrimp risotto — 27 cm pasta bowl
// ---------------------------------------------------------------------------

function shrimp(rand, scale = 1) {
  const parts = [];
  const rc = cm(1.45) * scale;
  const rMax = cm(0.78) * scale;
  const amax = 1.38 * Math.PI;
  const radius = (u) => {
    let r = rMax * (1 - 0.66 * u);
    if (u < 0.06) r *= Math.sqrt(Math.max(0, 1 - ((0.06 - u) / 0.06) ** 2));
    if (u > 0.96) r *= Math.sqrt(Math.max(0, 1 - ((u - 0.96) / 0.04) ** 2));
    r *= 1 + 0.06 * Math.max(0, Math.cos(TAU * u * 6.5));
    return Math.max(r, 1e-5);
  };
  const back = hex("#e5502b");
  const side = hex("#f29470");
  const belly = hex("#f8d9c7");
  const stripe = hex("#c2321c");
  parts.push(
    tube(
      (u) => {
        const a = u * amax;
        return { c: [rc * Math.cos(a), 0, rc * Math.sin(a)], n1: [Math.cos(a), 0, Math.sin(a)], n2: [0, 1, 0] };
      },
      (u) => {
        const r = radius(u);
        return [r, r * 0.86];
      },
      {
        nu: 84,
        nv: 18,
        material: "satin",
        k: 2,
        color: (p, u, v) => {
          const ct = Math.cos(v * TAU);
          let c = ct > 0 ? mix(side, back, smoothstep(0.2, 0.95, ct)) : mix(side, belly, smoothstep(0, 0.8, -ct));
          const s = (u * 6.5) % 1;
          const band = clamp01(Math.max(1 - s / 0.12, (s - 0.86) / 0.14));
          c = mix(c, stripe, band * 0.55 * (0.3 + 0.7 * Math.max(ct, 0)));
          if (u < 0.05) c = mix(hex("#f7d3c0"), c, u / 0.05);
          return mix(c, shade(c, 0.86), fbm(p, 600, 2) * 0.6);
        },
      },
    ),
  );
  const E = [rc * Math.cos(amax), 0, rc * Math.sin(amax)];
  const T = [-Math.sin(amax), 0, Math.cos(amax)];
  const yaw = Math.atan2(-T[2], T[0]);
  for (const spread of [-0.45, 0, 0.45]) {
    const len = cm(0.85) * scale * (spread === 0 ? 0.9 : 1);
    parts.push(
      ellipsoid(len, cm(0.07) * scale, cm(spread === 0 ? 0.25 : 0.38) * scale, {
        nu: 16,
        nv: 8,
        material: "satin",
        k: 2,
        color: (p) => mix(hex("#ee6738"), hex("#8c2313"), smoothstep(0.3, 0.9, p[0] / len)),
      })
        .move(cm(0.7) * scale, 0, 0)
        .rotY(yaw + spread)
        .move(E[0], E[1], E[2]),
    );
  }
  const turn = rand() * TAU;
  return each(parts, (p) => p.rotY(turn));
}

export function shrimpRisotto() {
  const rand = rng(5);
  const parts = [];
  const base = 0.012;
  const D = 27;

  parts.push(
    pastaBowl(D, (p) => {
      const rho = Math.hypot(p[0], p[2]) / cm(D / 2);
      let c = mix(hex("#f1ece3"), hex("#e3dccf"), fbm(p, 35, 3) * 0.7);
      if (noise(p[0] * 900, p[1] * 900, p[2] * 900) > 0.88) c = shade(c, 0.8);
      if (rho > 0.972) c = mix(c, hex("#6b4a2e"), smoothstep(0.972, 0.99, rho));
      return c;
    }),
  );

  // Creamy risotto mound.
  const Rm = cm(7.4);
  const height = (x, z) => {
    const r = Math.hypot(x, z);
    const dome = 0.024 * Math.pow(Math.max(0, 1 - (r / Rm) ** 2), 0.55);
    return base + dome + (fbm([x, 0, z], 150, 3) - 0.5) * 0.004;
  };
  parts.push(
    disc(Rm, {
      nu: 80,
      nv: 32,
      height,
      material: "satin",
      k: 3,
      color: (p) => {
        let c = mix(hex("#d6a95e"), hex("#ecd096"), fbm(p, 220, 3));
        if (noise(p[0] * 700, 0, p[2] * 700) > 0.82) c = mix(c, hex("#d39a5a"), 0.5);
        return c;
      },
    }),
  );

  // Arborio grains peeking out of the sauce.
  for (let i = 0; i < 520; i++) {
    const th = rand() * TAU;
    const r = Rm * 0.93 * Math.sqrt(rand());
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    parts.push(
      ellipsoid(cm(0.33), cm(0.14), cm(0.16), {
        nu: 8,
        nv: 5,
        material: "satin",
        color: (p) => mix(hex("#f0dca8"), hex("#dcbd7c"), fbm(p, 900, 2)),
      })
        .rotZ(rand.range(-0.35, 0.35))
        .rotX(rand.range(-0.35, 0.35))
        .rotY(rand() * TAU)
        .move(x, height(x, z) - 0.0006, z),
    );
  }

  // Five shrimp around the center.
  for (let i = 0; i < 5; i++) {
    const th = (i / 5) * TAU + rand.range(-0.2, 0.2);
    const r = cm(rand.range(3.0, 3.6));
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const tilt = rand.range(-0.08, 0.08);
    parts.push(...each(shrimp(rand, rand.range(0.95, 1.08)), (p) => p.rotX(tilt).move(x, height(x, z) + cm(0.3), z)));
  }

  // Parsley, parmesan shavings, black pepper, a little olive oil.
  for (let i = 0; i < 110; i++) {
    const th = rand() * TAU;
    const r = Rm * 0.95 * Math.sqrt(rand());
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    parts.push(speck(rand, cm(0.12), rand() > 0.5 ? "#255f22" : "#36762d", "satin").move(x, height(x, z) + cm(0.1), z));
  }
  for (let i = 0; i < 9; i++) {
    const th = rand() * TAU;
    const r = Rm * 0.8 * Math.sqrt(rand());
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    parts.push(
      ellipsoid(cm(rand.range(0.6, 1.0)), cm(0.05), cm(rand.range(0.35, 0.55)), {
        nu: 14,
        nv: 6,
        material: "satin",
        disp: (d) => (fbm(d, 3, 2) - 0.5) * 0.3,
        color: (p) => mix(hex("#f5e7b8"), hex("#e3cf8e"), fbm(p, 500, 2)),
      })
        .rotX(rand.range(-0.4, 0.4))
        .rotY(rand() * TAU)
        .move(x, height(x, z) + cm(0.45), z),
    );
  }
  for (let i = 0; i < 70; i++) {
    const th = rand() * TAU;
    const r = Rm * 0.95 * Math.sqrt(rand());
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    parts.push(speck(rand, cm(0.06), "#1b1410").move(x, height(x, z) + cm(0.1), z));
  }
  for (let i = 0; i < 5; i++) {
    const th = rand() * TAU;
    const r = Rm * 0.7 * Math.sqrt(rand());
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const s = cm(rand.range(0.5, 0.9));
    parts.push(
      ellipsoid(s, 0.0004, s * 0.7, { nu: 14, nv: 5, material: "gloss", color: () => hex("#c79a2e") })
        .rotY(rand() * TAU)
        .move(x, height(x, z) + 0.0004, z),
    );
  }
  // A little parsley on the rim, like a chef's finish.
  for (let i = 0; i < 14; i++) {
    const th = rand.range(-0.6, 0.6) - Math.PI / 2;
    const r = cm(rand.range(10.2, 12.2));
    parts.push(speck(rand, cm(0.12), "#255f22", "satin").move(Math.cos(th) * r, 0.036 + (r - cm(8.91)) * 0.18 + 0.0004, Math.sin(th) * r));
  }

  return parts;
}
