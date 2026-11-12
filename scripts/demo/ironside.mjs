// Ironside Cafe (Miami) demo dishes.
//
// Built from industry-standard serving sizes, NOT measured at Ironside: when
// the restaurant signs up, its real plate/cup sizes and photos replace these.
// Sizes used (all true to scale, meters):
//   espresso demitasse 3 oz (6.2 cm rim) on a 12 cm saucer
//   cappuccino cup 6 oz (9 cm rim) on a 15 cm saucer
//   latte / americano / chocolate / chai / matcha / tea cup 12 oz (9.6 cm rim) on a 16 cm saucer
//   Gibraltar glass 4.5 oz (7.3 cm rim, 8.9 cm tall): cortado, overturned
//   rocks glass 8 oz (8.5 cm rim): iced cortado, shakerato
//   clear PET cup 16 oz (9.8 cm rim, 13.4 cm tall): iced drinks, juices, smoothies
//   pao de queijo 4.8 cm wide; classic croissant 15 x 8.5 x 5.5 cm
//   two multigrain toasts 12 x 10 cm; tapioca crepe from a 22 cm disc
//   acai bowl 16 cm; shakshuka pan 18 cm

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

/** Changes positions before any transform (local and world stay equal). */
function deform(part, fn) {
  for (let o = 0; o < part.local.length; o += 3) {
    const p = fn(part.local[o], part.local[o + 1], part.local[o + 2]);
    part.local.set(p, o);
    part.world.set(p, o);
  }
  return part;
}

/** Rounded box (superellipsoid) standing on y = 0. e: 0.1 = sharp, 1 = ellipsoid. */
function roundedBox(w, h, d, { e = 0.3, nu = 32, nv = 16, ...rest } = {}) {
  const pw = (t, k) => Math.sign(t) * Math.abs(t) ** k;
  return new Part(
    nu,
    nv,
    (u, v) => {
      const th = u * TAU;
      const ph = v * Math.PI;
      const s = pw(Math.sin(ph), e);
      return [(w / 2) * s * pw(Math.cos(th), e), (h / 2) * (1 + pw(Math.cos(ph), e)), (d / 2) * s * pw(Math.sin(th), e)];
    },
    rest,
  );
}

// ---------------------------------------------------------------------------
// Tableware
// ---------------------------------------------------------------------------

const WHITE = (p) => mix(hex("#fbfaf7"), hex("#eeebe5"), fbm(p, 18, 2) * 0.45);

/** Flat white plate; food sits at `base`. Returns the plate and its surface height function. */
function plate(diameterCm, base = 0.006, color = WHITE) {
  const R = cm(diameterCm / 2);
  const part = lathe(
    [
      [0, base],
      [0.74 * R, base],
      [0.82 * R, base + 0.003],
      [0.95 * R, base + 0.009],
      [R, base + 0.0105],
      [R, base + 0.0085],
      [0.95 * R, base + 0.0072],
      [0.82 * R, 0.005],
      [0.74 * R, 0.0025],
      [0.6 * R, 0],
      [0.5 * R, 0],
      [0.48 * R, 0.0025],
      [0, 0.0025],
    ],
    { nu: 128, nv: 48, material: "ceramic", k: 2, color },
  );
  return { part, base, R };
}

/** Saucer with a ring where the cup sits. */
function saucer(diameterCm) {
  const R = cm(diameterCm / 2);
  return lathe(
    [
      [0, 0.004],
      [0.36 * R, 0.004],
      [0.42 * R, 0.0065],
      [0.88 * R, 0.0125],
      [R, 0.0155],
      [R, 0.0135],
      [0.88 * R, 0.0105],
      [0.42 * R, 0.0045],
      [0.38 * R, 0],
      [0.3 * R, 0],
      [0.28 * R, 0.002],
      [0, 0.002],
    ],
    { nu: 112, nv: 40, material: "ceramic", k: 2, color: WHITE },
  );
}

/** Straight-sided container: returns inner radius at a height. */
function innerRadius(botR, topR, h, wall, y) {
  return botR - wall + ((topR - botR) * y) / h;
}

/** Ceramic cup with handle, standing at y0. Returns parts + liquid info. */
function ceramicCup({ topR, botR, h, wall = 0.0035, y0 = 0.004, color = WHITE }) {
  const floor = 0.007;
  const cup = lathe(
    [
      [botR * 0.82, 0],
      [botR, 0.004],
      [topR, h],
      [topR - wall / 2, h + 0.0012],
      [topR - wall, h],
      [botR - wall, floor + 0.004],
      [botR - wall - 0.004, floor],
      [0, floor],
    ],
    { nu: 96, nv: 40, material: "ceramic", k: 2, color },
  ).move(0, y0, 0);
  // C-shaped handle on the +x side.
  const hc = [topR + 0.012, y0 + h * 0.52];
  const handle = tube(
    (u) => {
      const a = -1.75 + u * 3.5;
      return {
        c: [hc[0] + Math.cos(a) * 0.014 - 0.006, hc[1] + Math.sin(a) * 0.019, 0],
        n1: [Math.cos(a), Math.sin(a), 0],
        n2: [0, 0, 1],
      };
    },
    () => [0.0032, 0.0024],
    { nu: 32, nv: 10, material: "ceramic", k: 1, color },
  );
  return { parts: [cup, handle], inner: (y) => innerRadius(botR, topR, h, wall, y - y0), y0, h };
}

/** Clear glass or plastic cup (see-through). */
function clearCup({ topR, botR, h, base = 0.006, wall = 0.0012 }) {
  const glass = lathe(
    [
      [0, 0],
      [botR, 0],
      [topR, h],
      [topR + 0.0008, h + 0.0008],
      [topR - wall, h],
      [botR - wall, base],
      [0, base],
    ],
    { nu: 96, nv: 36, material: "clear", k: 1, color: () => [0.96, 0.98, 1] },
  );
  return { part: glass, inner: (y) => botR - wall + ((topR - botR) * y) / h - 0.0004, base, h };
}

/** Liquid filling a container from `bottom` to `level`, colored by height (0..1) and position. */
function liquid(inner, bottom, level, color, { material = "satin", surface } = {}) {
  const sideRows = 16;
  const parts = [];
  // Side of the liquid column (visible through glass).
  parts.push(
    new Part(
      72,
      sideRows,
      (u, v) => {
        const y = bottom + v * (level - bottom);
        const r = inner(y);
        return [r * Math.cos(u * TAU), y, r * Math.sin(u * TAU)];
      },
      { material, k: 1, color: (p) => color(p, (p[1] - bottom) / (level - bottom)) },
    ),
  );
  // Top surface.
  parts.push(
    disc(inner(level), {
      nu: 72,
      nv: 20,
      y: level,
      material,
      k: 3,
      color: surface ?? ((p) => color(p, 1)),
    }),
  );
  return parts;
}

/** Latte art heart on milk foam; u,w in [-1, 1] across the cup. */
function latteArt(coffee, foam) {
  return (p, R) => {
    const u = p[0] / R;
    const w = p[2] / R;
    const r = Math.hypot(u, w);
    // Heart: x^2 + (y - sqrt|x|)^2 <= 1, scaled into the cup.
    const X = u * 1.9;
    const Y = -w * 1.9 + 0.35;
    const d = X * X + (Y - Math.sqrt(Math.abs(X)) * 0.85) ** 2;
    let c = mix(foam, coffee, smoothstep(0.82, 1.0, d));
    c = mix(c, shade(coffee, 0.75), smoothstep(0.86, 1, r));
    return mix(c, shade(c, 0.94), fbm(p, 400, 2) * 0.5);
  };
}

function straw(height, lean = 0.12, color = hex("#f4f1ea")) {
  const len = height;
  return tube(
    (u) => ({ c: [-0.012 + Math.sin(lean) * len * u, 0.008 + Math.cos(lean) * len * u, 0.006], n1: [1, 0, 0], n2: [0, 0, 1] }),
    () => [0.0034, 0.0034],
    {
      nu: 24,
      nv: 12,
      material: "satin",
      k: 1,
      color: (p, u) => (Math.floor(u * 40) % 2 === 0 ? color : shade(color, 0.93)),
    },
  );
}

function iceCubes(rand, inner, top, count = 5) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const s = cm(rand.range(2.0, 2.5));
    const y = top - s * rand.range(0.5, 1.1);
    const a = rand() * TAU;
    const r = Math.max(0, inner(y) - s * 0.75) * rand.range(0.3, 1);
    parts.push(
      roundedBox(s, s, s, { e: 0.25, nu: 16, nv: 8, material: "ice", color: () => [0.93, 0.97, 1] })
        .move(0, -s / 2, 0)
        .rotX(rand.range(-0.5, 0.5))
        .rotY(rand() * TAU)
        .move(Math.cos(a) * r, y, Math.sin(a) * r),
    );
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Drinks
// ---------------------------------------------------------------------------

const CUPS = {
  demitasse: { topR: cm(3.1), botR: cm(2.3), h: cm(5.4), saucerCm: 12 },
  cappuccino: { topR: cm(4.5), botR: cm(2.7), h: cm(6.3), saucerCm: 15 },
  mug12: { topR: cm(4.8), botR: cm(3.1), h: cm(8.0), saucerCm: 16 },
};

/**
 * Hot drink in a ceramic cup on a saucer.
 * top: "crema" | "art" | "foam" | "dust" | "tea" | "dollop"
 */
function hotDrink(cupName, { coffee, foam = hex("#f6efe2"), top = "art", fill = 0.9, dust }) {
  const spec = CUPS[cupName];
  const parts = [saucer(spec.saucerCm)];
  const cup = ceramicCup({ ...spec });
  parts.push(...cup.parts);
  const level = cup.y0 + spec.h * fill;
  const R = cup.inner(level);
  const art = latteArt(coffee, foam);
  const surface = (p) => {
    const r = Math.hypot(p[0], p[2]) / R;
    if (top === "art") return art(p, R);
    if (top === "crema") {
      const c = mix(hex("#c98a4b"), hex("#7a4519"), smoothstep(0.3, 1, r) + (fbm(p, 500, 3) - 0.5) * 0.5);
      return c;
    }
    if (top === "tea") return mix(coffee, shade(coffee, 0.7), r * 0.6);
    if (top === "dollop") return mix(foam, mix(hex("#c98a4b"), hex("#7a4519"), r), smoothstep(0.35, 0.55, r));
    let c = mix(foam, shade(foam, 0.93), fbm(p, 300, 3));
    if (top === "dust" && dust) c = mix(c, dust, smoothstep(0.55, 0.8, fbm(p, 900, 2)) * (1 - smoothstep(0.5, 0.9, r)));
    return mix(c, shade(coffee, 0.9), smoothstep(0.9, 1, r));
  };
  parts.push(
    ...liquid(cup.inner, cup.y0 + 0.008, level, () => coffee, { material: top === "tea" ? "gloss" : "satin", surface }),
  );
  return parts;
}

/** Drink in a see-through glass or cup. */
function coldDrink(kind, { color, fill = 0.82, ice = 0, foam, strawColor, garnish, seed = 1 }) {
  const rand = rng(seed);
  const specs = {
    pet16: { topR: cm(4.9) - 0.0008, botR: cm(3.0), h: cm(13.4) },
    gibraltar: { topR: cm(3.65) - 0.0008, botR: cm(3.3), h: cm(8.9), base: 0.014 },
    rocks: { topR: cm(4.25) - 0.0008, botR: cm(3.9), h: cm(9.0), base: 0.012 },
  };
  const glass = clearCup(specs[kind]);
  const parts = [glass.part];
  const level = glass.h * fill;
  const surface = foam
    ? (p) => mix(foam, shade(foam, 0.92), fbm(p, 300, 3))
    : (p) => mix(color(p, 1), shade(color(p, 1), 0.9), fbm(p, 200, 2) * 0.5);
  parts.push(...liquid(glass.inner, glass.base + 0.0004, level, color, { surface, material: foam ? "satin" : "gloss" }));
  if (ice) parts.push(...iceCubes(rand, glass.inner, level + 0.006, ice));
  if (strawColor) parts.push(straw(glass.h + cm(6), 0.1, strawColor));
  if (garnish) parts.push(...garnish(level, glass.inner));
  return parts;
}

const layered = (bottom, top, split = 0.5, blur = 0.15) => (p, t) => mix(bottom, top, smoothstep(split - blur, split + blur, t));
const solid = (c) => (p) => mix(c, shade(c, 0.94), fbm(p, 200, 2) * 0.4);

function lemonWheel(level, inner) {
  const r = cm(2.6);
  return [
    disc(r, {
      nu: 48,
      nv: 10,
      material: "satin",
      k: 3,
      color: (p) => {
        const rr = Math.hypot(p[0], p[2]) / r;
        if (rr > 0.9) return hex("#e8c51b");
        if (rr > 0.84) return hex("#fbf5d8");
        const seg = (((Math.atan2(p[2], p[0]) + TAU) / (TAU / 9)) % 1) - 0.5;
        return Math.abs(seg) < 0.06 ? hex("#fbf5d8") : hex("#f4e27a");
      },
    })
      .rotX(1.25)
      .move(inner(level) * 0.3, level + cm(1.4), 0),
  ];
}

function affogato() {
  const glass = clearCup({ topR: cm(4.25) - 0.0008, botR: cm(3.4), h: cm(7.5), base: 0.01 });
  const parts = [glass.part];
  parts.push(...liquid(glass.inner, glass.base + 0.0004, cm(2.4), () => hex("#4a2a14"), { material: "gloss" }));
  parts.push(
    ellipsoid(cm(3.1), cm(2.6), cm(3.1), {
      nu: 40,
      nv: 20,
      material: "satin",
      k: 2,
      disp: (d) => (fbm(d, 3, 3) - 0.5) * 0.12,
      color: (p) => {
        let c = mix(hex("#fbf4e2"), hex("#efe2c4"), fbm(p, 200, 3));
        if (p[1] < cm(-0.6)) c = mix(c, hex("#8a5a32"), smoothstep(cm(-0.6), cm(-1.8), p[1]) * 0.7);
        return c;
      },
    }).move(0, cm(4.6), 0),
  );
  return parts;
}

// ---------------------------------------------------------------------------
// Bakery & breakfast
// ---------------------------------------------------------------------------

function paoDeQueijo(rand) {
  const w = cm(rand.range(4.6, 5.0));
  const h = cm(rand.range(3.6, 4.0));
  return deform(
    ellipsoid(w / 2, h / 2, w / 2, {
      nu: 36,
      nv: 18,
      material: "satin",
      k: 3,
      disp: (d) => (fbm(d, 2.5, 4) - 0.5) * 0.14 + 0.05 * smoothstep(0.82, 0.95, noise(d[0] * 6, d[1] * 6, d[2] * 6)),
      color: (p) => {
        const top = smoothstep(-0.2 * h, 0.45 * h, p[1]);
        let c = mix(hex("#f0d08a"), hex("#d9a14a"), top * 0.8 + (fbm(p, 220, 3) - 0.5) * 0.6);
        const crack = noise(p[0] * 700, p[1] * 700, p[2] * 700);
        if (crack > 0.78) c = mix(c, hex("#f7e6b8"), 0.7);
        return c;
      },
    }),
    (x, y, z) => [x, Math.max(y, -h * 0.38), z],
  ).move(0, h * 0.38, 0);
}

function paoDeQueijoPlate(count, plateCm) {
  const rand = rng(40 + count);
  const pl = plate(plateCm, 0.006);
  const parts = [pl.part];
  const spots = {
    1: [[0, 0]],
    3: [[-0.028, 0.018], [0.028, 0.018], [0, -0.03]],
    5: [[-0.03, 0.025], [0.03, 0.025], [-0.042, -0.025], [0.042, -0.025], [0, -0.005]],
  }[count];
  for (const [x, z] of spots) parts.push(paoDeQueijo(rand).rotY(rand() * TAU).move(x, pl.base, z));
  return parts;
}

function ramekin(fill) {
  const r = cm(3);
  const parts = [
    lathe(
      [
        [0, 0],
        [r - 0.003, 0],
        [r, 0.004],
        [r, cm(3)],
        [r - 0.002, cm(3) + 0.001],
        [r - 0.004, cm(3)],
        [r - 0.004, 0.006],
        [0, 0.006],
      ],
      { nu: 64, nv: 24, material: "ceramic", k: 1, color: WHITE },
    ),
  ];
  parts.push(
    disc(r - 0.0042, {
      nu: 48,
      nv: 12,
      y: cm(2.4),
      material: "sauce",
      k: 2,
      color: (p) => mix(fill, shade(fill, 0.7), fbm(p, 300, 3)),
    }),
  );
  return parts;
}

function croissant() {
  const R = cm(13.4);
  const alpha = 0.6;
  const body = tube(
    (u) => {
      const a = -alpha + u * 2 * alpha;
      return {
        c: [R * Math.sin(a), 0, R * Math.cos(a) - R * Math.cos(alpha) - cm(2.2)],
        n1: [Math.sin(a), 0, Math.cos(a)],
        n2: [0, 1, 0],
      };
    },
    (u) => {
      const taper = Math.pow(Math.sin(Math.PI * u), 0.55);
      const ridge = 1 + 0.16 * Math.abs(Math.cos(Math.PI * u * 7)) ** 0.7;
      return [cm(4.25) * taper * ridge, cm(2.75) * taper * ridge];
    },
    {
      nu: 96,
      nv: 28,
      material: "glaze",
      k: 3,
      color: (p, u, v) => {
        const up = Math.sin(v * TAU); // +1 top, -1 bottom
        const band = Math.abs(Math.cos(Math.PI * u * 7)) ** 0.7; // ridges darker, folds lighter
        let c = mix(hex("#e3a957"), hex("#8f4a12"), clamp01(0.4 + up * 0.55) * (0.35 + 0.65 * band));
        c = mix(c, shade(c, 0.85), fbm(p, 260, 3) * 0.6);
        const tip = Math.min(u, 1 - u);
        return mix(shade(c, 0.78), c, smoothstep(0, 0.12, tip));
      },
    },
  );
  // Sit flat on the plate.
  return deform(body, (x, y, z) => [x, Math.max(y, -cm(2.2)), z]).move(0, cm(2.2), 0);
}

function multigrainToast(rand) {
  const w = cm(12);
  const d = cm(10);
  const t = cm(1.6);
  const bread = roundedBox(w, t, d, {
    e: 0.32,
    nu: 48,
    nv: 20,
    material: "matte",
    k: 3,
    color: (p) => {
      const rr = Math.max(Math.abs(p[0]) / (w / 2), Math.abs(p[2]) / (d / 2));
      let c = mix(hex("#c79a62"), hex("#a8763e"), fbm(p, 300, 3));
      if (noise(p[0] * 1500, p[1] * 1500, p[2] * 1500) > 0.8) c = hex("#5b3a1c"); // seeds
      if (noise(p[0] * 1100 + 7, p[1] * 1100, p[2] * 1100) > 0.84) c = hex("#e9d8a8"); // oats
      return mix(c, hex("#6e4320"), smoothstep(0.86, 0.97, rr)); // crust
    },
  });
  const avo = deform(
    roundedBox(w * 0.9, cm(0.9), d * 0.88, {
      e: 0.5,
      nu: 48,
      nv: 20,
      material: "satin",
      k: 3,
      color: (p) => {
        let c = mix(hex("#8ea845"), hex("#5d7426"), fbm(p, 220, 3));
        if (noise(p[0] * 900, p[1] * 900, p[2] * 900) > 0.84) c = hex("#b9c97a");
        if (noise(p[0] * 700 + 9, p[1] * 700, p[2] * 700) > 0.86) c = shade(c, 0.75);
        if (noise(p[0] * 1300 + 3, p[1] * 1300, p[2] * 1300) > 0.9) c = hex("#b8321e"); // chili flakes
        return c;
      },
    }),
    (x, y, z) => [x, y + ((fbm([x, 0, z], 60, 3) - 0.5) * cm(0.6) + (fbm([x, 0, z], 220, 2) - 0.5) * cm(0.3)) * smoothstep(0, cm(0.5), y), z],
  ).move(0, t * 0.92, 0);
  const parts = [bread, avo];
  // Burrata & tomatoes topping.
  parts.push(
    ellipsoid(cm(2.6), cm(1.4), cm(2.3), {
      nu: 32,
      nv: 14,
      material: "satin",
      k: 2,
      disp: (dd) => (fbm(dd, 4, 3) - 0.5) * 0.35,
      color: (p) => mix(hex("#fbf7ee"), hex("#ece2cc"), fbm(p, 200, 3)),
    }).move(cm(-1.5), t + cm(1.2), cm(0.5)),
  );
  for (let i = 0; i < 3; i++) {
    const r = cm(1.25);
    const x = cm(1.8 + (i % 2) * 1.6);
    const z = cm(-2.2 + i * 2.1);
    const skin = hex(i === 1 ? "#e3a21c" : "#c62a1d");
    const flesh = hex(i === 1 ? "#f2c24a" : "#e0503a");
    parts.push(
      ellipsoid(r, r * 0.9, r, { nu: 20, nv: 8, phi0: Math.PI / 2, phi1: Math.PI, material: "satin", k: 2, color: () => skin }).move(x, t + cm(1.7), z),
      disc(r, {
        nu: 28,
        nv: 8,
        y: t + cm(1.7),
        material: "satin",
        k: 2,
        color: (p) => (Math.hypot(p[0], p[2]) / r > 0.85 ? skin : mix(flesh, hex("#f6d9a0"), noise(p[0] * 2500, 0, p[2] * 2500) > 0.8 ? 0.8 : 0)),
      }).move(x, 0, z),
    );
  }
  for (let i = 0; i < 4; i++) {
    parts.push(
      leaf(cm(1.6), cm(0.8), { cup: 0.25, arch: 0.15, material: "satin", color: () => hex("#4f8f2f") })
        .rotY(rand() * TAU)
        .move(cm(rand.range(-3, 3)), t + cm(0.85), cm(rand.range(-3, 3))),
    );
  }
  return parts;
}

function avocadoToast() {
  const rand = rng(77);
  const pl = plate(28);
  const parts = [pl.part];
  parts.push(...each(multigrainToast(rand), (p) => p.rotY(0.25).move(cm(-5.6), pl.base, cm(0.4))));
  parts.push(...each(multigrainToast(rand), (p) => p.rotY(-0.2).move(cm(5.6), pl.base, cm(-0.4))));
  return parts;
}

/** Folded half-moon (tapioca crepe, omelette). Straight fold edge along x at z = 0. */
function halfMoon({ diameter, thick, top, sides, spots, spotColor }) {
  const R = diameter / 2;
  const height = (x, z) => {
    const zmax = Math.sqrt(Math.max(0, R * R - x * x));
    const v = zmax > 0 ? z / zmax : 1;
    return thick * Math.pow(Math.max(0, 1 - v ** 2.2), 0.55) * Math.pow(Math.max(0, 1 - (x / R) ** 2), 0.3);
  };
  const color = (p) => {
    let c = mix(top, shade(top, 0.93), fbm(p, 150, 3));
    const s = fbm([p[0] * 3, 0, p[2] * 3], 60, 3);
    if (s > 0.58) c = mix(c, spotColor, smoothstep(0.58, 0.72, s) * spots);
    // Small toasted freckles, like a tapioca or omelette fresh off the pan.
    const f = noise(p[0] * 600, p[1] * 600, p[2] * 600);
    if (f > 0.8) c = mix(c, spotColor, 0.55 * spots);
    return c;
  };
  const surface = new Part(
    64,
    24,
    (u, v) => {
      const x = (u * 2 - 1) * R * 0.999;
      const z = v * Math.sqrt(R * R - x * x);
      return [x, height(x, z), z];
    },
    { material: "satin", k: 3, color },
  );
  // Rounded fold along the straight edge.
  const fold = new Part(
    64,
    12,
    (u, v) => {
      const x = (u * 2 - 1) * R * 0.999;
      const hgt = height(x, 0);
      const a = v * Math.PI;
      return [x, hgt * (0.5 + 0.5 * Math.cos(a)), -Math.sin(a) * hgt * 0.45];
    },
    { material: "satin", k: 2, color: (p) => mix(sides, spotColor, smoothstep(0.6, 0.75, fbm(p, 120, 3)) * spots) },
  );
  return [surface, fold].map((p) => p.move(0, 0, -R * 0.42));
}

function tapiocaCrepe() {
  const pl = plate(28);
  return [
    pl.part,
    ...each(
      halfMoon({ diameter: cm(22), thick: cm(2.6), top: hex("#f3ecdc"), sides: hex("#ece3cf"), spots: 1, spotColor: hex("#c48f52") }),
      (p) => p.move(0, pl.base, 0),
    ),
  ];
}

function omelette() {
  const pl = plate(28);
  const parts = [pl.part];
  parts.push(
    ...each(
      halfMoon({ diameter: cm(20), thick: cm(3.4), top: hex("#f5cf55"), sides: hex("#f2c64a"), spots: 0.45, spotColor: hex("#d99a2b") }),
      (p) => p.move(0, pl.base, 0),
    ),
  );
  const rand = rng(9);
  for (let i = 0; i < 22; i++) {
    parts.push(
      ellipsoid(cm(0.2), cm(0.05), cm(0.14), { nu: 6, nv: 4, material: "satin", color: () => hex("#3f7f2a") })
        .rotY(rand() * TAU)
        .move(cm(rand.range(-6, 6)), pl.base + cm(3.2), cm(rand.range(-3, 1))),
    );
  }
  return parts;
}

function scrambledEggs() {
  const rand = rng(21);
  const pl = plate(26);
  const parts = [pl.part];
  for (let i = 0; i < 26; i++) {
    const a = rand() * TAU;
    const r = cm(5) * Math.sqrt(rand());
    const s = cm(rand.range(1.4, 2.4));
    const y = pl.base + cm(1.6) * (1 - r / cm(5.5)) + s * 0.2;
    parts.push(
      ellipsoid(s, s * 0.45, s * 0.8, {
        nu: 16,
        nv: 8,
        material: "glaze",
        k: 1,
        disp: (d) => (fbm(d, 3, 2) - 0.5) * 0.4,
        color: (p) => mix(hex("#f7d65e"), hex("#f0c13d"), fbm(p, 200, 2)),
      })
        .rotY(rand() * TAU)
        .move(Math.cos(a) * r, y, Math.sin(a) * r),
    );
  }
  return parts;
}

function shakshuka() {
  const rand = rng(31);
  const R = cm(9);
  const parts = [
    lathe(
      [
        [0, 0],
        [R - 0.008, 0],
        [R - 0.002, 0.006],
        [R, cm(4)],
        [R - 0.003, cm(4) + 0.002],
        [R - 0.005, cm(4)],
        [R - 0.008, 0.012],
        [R - 0.016, 0.006],
        [0, 0.006],
      ],
      { nu: 96, nv: 36, material: "metal", k: 1, color: (p) => mix(hex("#2a2826"), hex("#3a3633"), fbm(p, 80, 2)) },
    ),
  ];
  const sauceY = cm(2.8);
  parts.push(
    disc(R - 0.006, {
      nu: 80,
      nv: 20,
      height: (x, z) => sauceY + (fbm([x, 0, z], 80, 3) - 0.5) * 0.004,
      material: "glaze",
      k: 3,
      color: (p) => {
        let c = mix(hex("#b8321e"), hex("#8f2414"), fbm(p, 120, 3));
        if (noise(p[0] * 300, 0, p[2] * 300) > 0.8) c = hex("#d65a2a"); // peppers
        if (noise(p[0] * 900 + 5, 0, p[2] * 900) > 0.88) c = hex("#3f7f2a"); // herbs
        return c;
      },
    }),
  );
  for (const [x, z] of [[-cm(3), cm(1.2)], [cm(3), -cm(1.2)]]) {
    parts.push(
      disc((th) => cm(3.6) * (1 + 0.12 * Math.sin(3 * th + x * 100)), {
        nu: 48,
        nv: 10,
        y: sauceY + 0.002,
        material: "glaze",
        k: 2,
        color: (p) => mix(hex("#fbfaf4"), hex("#ece6d6"), fbm(p, 200, 2)),
      }).move(x, 0, z),
      ellipsoid(cm(1.5), cm(0.9), cm(1.5), {
        nu: 28,
        nv: 12,
        phi1: Math.PI / 2,
        material: "gloss",
        k: 2,
        color: () => hex("#f2a81d"),
      }).move(x + cm(0.3), sauceY + 0.002, z),
    );
  }
  for (let i = 0; i < 30; i++) {
    parts.push(
      ellipsoid(cm(0.25), cm(0.04), cm(0.15), { nu: 6, nv: 4, material: "satin", color: () => hex("#3f7f2a") })
        .rotY(rand() * TAU)
        .move(cm(rand.range(-6, 6)), sauceY + cm(0.9), cm(rand.range(-6, 6))),
    );
  }
  return parts;
}

function boureka() {
  const rand = rng(5);
  const pl = plate(20);
  const Rin = cm(2.9);
  const H = cm(3.8);
  const edge = cm(0.7);
  const rTri = (th) => {
    const f = ((((th + Math.PI / 2) % (TAU / 3)) + TAU / 3) % (TAU / 3)) - Math.PI / 3;
    return Rin / Math.pow(Math.cos(f), 0.82);
  };
  const flaky = (p) => {
    const layer = Math.sin(p[1] * 2400) * 0.5 + 0.5;
    return mix(hex("#e9b968"), hex("#c47f2a"), layer * 0.6 + fbm(p, 200, 2) * 0.4);
  };
  const top = disc(rTri, {
    nu: 96,
    nv: 24,
    height: (x, z, v) => edge + (H - edge) * Math.pow(Math.max(0, 1 - v ** 2.4), 0.6),
    material: "glaze",
    k: 3,
    color: (p) => {
      let c = mix(hex("#d18c33"), hex("#a8601c"), fbm(p, 160, 3));
      if (noise(p[0] * 1200, p[1] * 1200, p[2] * 1200) > 0.83) c = hex("#f3e3b5"); // sesame
      return c;
    },
  });
  const side = new Part(
    96,
    8,
    (u, v) => {
      const th = u * TAU;
      const r = rTri(th) * (1 + 0.04 * Math.sin(v * Math.PI));
      return [r * Math.cos(th), v * edge, r * Math.sin(th)];
    },
    { material: "glaze", k: 3, color: flaky },
  );
  return [pl.part, ...each([top, side], (p) => p.rotY(rand() * 0.4).move(0, pl.base, 0))];
}

function smoothieBowl(base) {
  const rand = rng(12);
  const R = cm(8);
  const h = cm(7);
  const parts = [
    lathe(
      [
        [0, 0],
        [cm(4), 0],
        [cm(4.3), 0.004],
        [R * 0.92, h * 0.75],
        [R, h],
        [R - 0.002, h + 0.0015],
        [R - 0.004, h],
        [R * 0.92 - 0.004, h * 0.75],
        [cm(4), 0.008],
        [0, 0.008],
      ],
      { nu: 96, nv: 36, material: "ceramic", k: 2, color: WHITE },
    ),
  ];
  const sy = h - cm(0.8);
  const sr = R * 0.94;
  parts.push(
    disc(sr, {
      nu: 80,
      nv: 20,
      height: (x, z) => sy + (fbm([x, 0, z], 60, 3) - 0.5) * 0.004,
      material: "satin",
      k: 2,
      color: (p) => mix(base, shade(base, 0.85), fbm(p, 150, 3)),
    }),
  );
  // Classic rows: banana, strawberry, blueberry, granola.
  const rows = [cm(-3.6), cm(-1.2), cm(1.2), cm(3.6)];
  for (let x = -cm(4.8); x <= cm(4.8); x += cm(2.4)) {
    parts.push(
      disc(cm(1.4), {
        nu: 28,
        nv: 6,
        y: 0,
        material: "satin",
        k: 2,
        color: (p) => mix(hex("#f6efc8"), hex("#e9dba0"), smoothstep(0.85, 1, Math.hypot(p[0], p[2]) / cm(1.4))),
      })
        .rotX(-0.2)
        .move(x, sy + cm(0.6), rows[0]),
    );
  }
  for (let x = -cm(4.5); x <= cm(4.5); x += cm(2.6)) {
    parts.push(
      ellipsoid(cm(1.2), cm(1.5), cm(0.6), {
        nu: 20,
        nv: 10,
        material: "gloss",
        k: 2,
        color: (p) => (noise(p[0] * 1500, p[1] * 1500, p[2] * 1500) > 0.83 ? hex("#f3d36b") : hex("#c8172e")),
      })
        .rotX(-1.1)
        .move(x, sy + cm(0.5), rows[1]),
    );
  }
  for (let i = 0; i < 14; i++) {
    parts.push(
      ellipsoid(cm(0.55), cm(0.5), cm(0.55), { nu: 12, nv: 8, material: "satin", color: () => hex("#2f3364") }).move(
        cm(rand.range(-5, 5)),
        sy + cm(0.5),
        rows[2] + cm(rand.range(-0.8, 0.8)),
      ),
    );
  }
  for (let i = 0; i < 18; i++) {
    parts.push(
      ellipsoid(cm(0.6), cm(0.35), cm(0.5), {
        nu: 10,
        nv: 6,
        material: "matte",
        disp: (d) => (fbm(d, 3, 2) - 0.5) * 0.5,
        color: (p) => mix(hex("#c08a45"), hex("#8a5a26"), fbm(p, 300, 2)),
      })
        .rotY(rand() * TAU)
        .move(cm(rand.range(-5, 5)), sy + cm(0.4), rows[3] + cm(rand.range(-0.9, 0.6))),
    );
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Catalog: id -> builder + framing for the menu photo
// ---------------------------------------------------------------------------

const C = {
  espresso: hex("#4a2a14"),
  milkCoffee: hex("#b07a4a"),
  mocha: hex("#6b3d22"),
  chai: hex("#c9a27a"),
  matcha: hex("#8fb85a"),
  cocoa: hex("#5b3420"),
  tea: hex("#9a4a1c"),
  milk: hex("#f1eadc"),
};
const kraft = hex("#d9c4a0");

export const IRONSIDE_DISHES = [
  // Bakery & breakfast
  { id: "pao-de-queijo", build: () => paoDeQueijoPlate(1, 14), plateCm: 14, heightCm: 5 },
  { id: "pao-de-queijo-3", build: () => paoDeQueijoPlate(3, 18), plateCm: 18, heightCm: 5 },
  { id: "pao-de-queijo-5", build: () => paoDeQueijoPlate(5, 20), plateCm: 20, heightCm: 5 },
  { id: "boureka", build: boureka, plateCm: 20, heightCm: 5 },
  {
    id: "classic-croissant",
    build: () => {
      const pl = plate(24);
      return [pl.part, ...each([croissant()], (p) => p.move(cm(-0.8), pl.base, cm(1.5))), ...each(ramekin(hex("#b5172e")), (p) => p.move(cm(6.2), pl.base, cm(-5.6)))];
    },
    plateCm: 24,
    heightCm: 7,
  },
  { id: "avocado-toast", build: avocadoToast, plateCm: 28, heightCm: 6 },
  { id: "omelette", build: omelette, plateCm: 28, heightCm: 5 },
  { id: "scrambled-eggs", build: scrambledEggs, plateCm: 26, heightCm: 5 },
  { id: "tapioca-crepe", build: tapiocaCrepe, plateCm: 28, heightCm: 4 },
  { id: "shakshuka", build: shakshuka, plateCm: 18, heightCm: 6 },
  // Bowls
  { id: "classic-acai-bowl", build: () => smoothieBowl(hex("#3d1530")), plateCm: 16, heightCm: 9 },
  { id: "mango-passion-bowl", build: () => smoothieBowl(hex("#f2b134")), plateCm: 16, heightCm: 9 },
  // Hot coffee & tea
  { id: "espresso", build: () => hotDrink("demitasse", { coffee: C.espresso, top: "crema", fill: 0.7 }), plateCm: 12, heightCm: 7 },
  { id: "macchiato", build: () => hotDrink("demitasse", { coffee: C.espresso, top: "dollop", fill: 0.8 }), plateCm: 12, heightCm: 7 },
  { id: "cortado", build: () => coldDrink("gibraltar", { color: layered(C.espresso, C.milkCoffee, 0.45), foam: hex("#f1e6d2"), fill: 0.85 }), plateCm: 7.3, heightCm: 10 },
  { id: "overturned-coffee", build: () => coldDrink("gibraltar", { color: layered(C.milk, C.milkCoffee, 0.6), foam: hex("#f4ecdd"), fill: 0.9 }), plateCm: 7.3, heightCm: 10 },
  { id: "americano", build: () => hotDrink("mug12", { coffee: hex("#2a170b"), top: "crema", fill: 0.88 }), plateCm: 16, heightCm: 10 },
  { id: "cappuccino", build: () => hotDrink("cappuccino", { coffee: C.milkCoffee, top: "dust", dust: hex("#6b3d22"), fill: 0.95 }), plateCm: 15, heightCm: 9 },
  { id: "hot-chocolate", build: () => hotDrink("mug12", { coffee: C.cocoa, top: "art", foam: hex("#e9d8c0") }), plateCm: 16, heightCm: 10 },
  { id: "latte", build: () => hotDrink("mug12", { coffee: C.milkCoffee, top: "art" }), plateCm: 16, heightCm: 10 },
  { id: "mochaccino", build: () => hotDrink("mug12", { coffee: C.mocha, top: "art" }), plateCm: 16, heightCm: 10 },
  { id: "chai-latte", build: () => hotDrink("mug12", { coffee: C.chai, top: "dust", foam: hex("#efe2cd"), dust: hex("#8a5a32") }), plateCm: 16, heightCm: 10 },
  { id: "matcha-latte", build: () => hotDrink("mug12", { coffee: C.matcha, top: "art", foam: hex("#eef0dc") }), plateCm: 16, heightCm: 10 },
  { id: "hot-tea", build: () => hotDrink("mug12", { coffee: C.tea, top: "tea", fill: 0.85 }), plateCm: 16, heightCm: 10 },
  // Iced
  { id: "iced-cortado", build: () => coldDrink("rocks", { color: layered(C.milk, C.espresso, 0.55), fill: 0.6, ice: 3, seed: 2 }), plateCm: 8.5, heightCm: 10 },
  { id: "iced-americano", build: () => coldDrink("pet16", { color: solid(hex("#2a170b")), ice: 6, strawColor: kraft, seed: 3 }), plateCm: 9.8, heightCm: 20 },
  { id: "iced-cappuccino", build: () => coldDrink("pet16", { color: layered(C.milk, C.milkCoffee, 0.5), foam: hex("#f3eadb"), ice: 4, strawColor: kraft, seed: 4 }), plateCm: 9.8, heightCm: 20 },
  { id: "iced-latte", build: () => coldDrink("pet16", { color: layered(C.milk, C.milkCoffee, 0.55, 0.25), ice: 6, strawColor: kraft, seed: 5 }), plateCm: 9.8, heightCm: 20 },
  { id: "iced-mochaccino", build: () => coldDrink("pet16", { color: layered(C.milk, C.mocha, 0.5, 0.25), ice: 6, strawColor: kraft, seed: 6 }), plateCm: 9.8, heightCm: 20 },
  { id: "iced-chai", build: () => coldDrink("pet16", { color: solid(C.chai), ice: 6, strawColor: kraft, seed: 7 }), plateCm: 9.8, heightCm: 20 },
  { id: "iced-matcha", build: () => coldDrink("pet16", { color: layered(C.milk, C.matcha, 0.55, 0.2), ice: 6, strawColor: kraft, seed: 8 }), plateCm: 9.8, heightCm: 20 },
  { id: "iced-tea", build: () => coldDrink("pet16", { color: solid(hex("#b5561c")), ice: 7, strawColor: kraft, seed: 9 }), plateCm: 9.8, heightCm: 20 },
  { id: "vanilla-affogato", build: affogato, plateCm: 8.5, heightCm: 10 },
  { id: "shakerato", build: () => coldDrink("rocks", { color: solid(hex("#5a3418")), foam: hex("#c79a6a"), fill: 0.7 }), plateCm: 8.5, heightCm: 10 },
  // Juices
  { id: "lemonade", build: () => coldDrink("pet16", { color: solid(hex("#f3e7a2")), ice: 6, strawColor: hex("#f4f1ea"), garnish: lemonWheel, seed: 10 }), plateCm: 9.8, heightCm: 20 },
  { id: "super-greens", build: () => coldDrink("pet16", { color: solid(hex("#7fa83a")), strawColor: hex("#f4f1ea"), seed: 11 }), plateCm: 9.8, heightCm: 20 },
  { id: "detox", build: () => coldDrink("pet16", { color: solid(hex("#e6e3a0")), strawColor: hex("#f4f1ea"), seed: 12 }), plateCm: 9.8, heightCm: 20 },
  { id: "ironside-sunset", build: () => coldDrink("pet16", { color: solid(hex("#f08a24")), strawColor: hex("#f4f1ea"), seed: 13 }), plateCm: 9.8, heightCm: 20 },
  { id: "tropicooler", build: () => coldDrink("pet16", { color: solid(hex("#f5c542")), strawColor: hex("#f4f1ea"), seed: 14 }), plateCm: 9.8, heightCm: 20 },
  { id: "orange-juice", build: () => coldDrink("pet16", { color: solid(hex("#f39c1f")), strawColor: hex("#f4f1ea"), seed: 15 }), plateCm: 9.8, heightCm: 20 },
  // Smoothies (thick, opaque)
  { id: "antioxidant-acai", build: () => coldDrink("pet16", { color: solid(hex("#4b1d3f")), fill: 0.9, strawColor: kraft, seed: 16 }), plateCm: 9.8, heightCm: 20 },
  { id: "banana-cacao", build: () => coldDrink("pet16", { color: solid(hex("#8a5a3c")), fill: 0.9, strawColor: kraft, seed: 17 }), plateCm: 9.8, heightCm: 20 },
  { id: "banana-strawberry", build: () => coldDrink("pet16", { color: solid(hex("#f0a3a8")), fill: 0.9, strawColor: kraft, seed: 18 }), plateCm: 9.8, heightCm: 20 },
  { id: "green-tropical-detox", build: () => coldDrink("pet16", { color: solid(hex("#a8c64a")), fill: 0.9, strawColor: kraft, seed: 19 }), plateCm: 9.8, heightCm: 20 },
  { id: "energy-booster", build: () => coldDrink("pet16", { color: solid(hex("#f7b733")), fill: 0.9, strawColor: kraft, seed: 20 }), plateCm: 9.8, heightCm: 20 },
  { id: "longevity-breeze", build: () => coldDrink("pet16", { color: solid(hex("#7a2a55")), fill: 0.9, strawColor: kraft, seed: 21 }), plateCm: 9.8, heightCm: 20 },
];
