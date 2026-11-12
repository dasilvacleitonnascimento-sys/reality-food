// Geometry toolkit for the procedural demo dishes.
// Every shape is a parametric grid (u, v in [0, 1]). That keeps texture baking
// simple: each grid gets its own rectangle in a texture atlas.
// Units are meters. Colors are sRGB in [0, 1].

export const cm = (v) => v / 100;
export const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Random + noise
// ---------------------------------------------------------------------------

export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + next() * (hi - lo);
  return next;
}

function hash3(x, y, z) {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(y, 0x165667b1) ^ Math.imul(z, 0x1b873593);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const fade = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

/** Value noise in [0, 1]. */
export function noise(x, y, z) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = fade(x - xi);
  const yf = fade(y - yi);
  const zf = fade(z - zi);
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), xf), lerp(c(0, 1, 0), c(1, 1, 0), xf), yf),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), xf), lerp(c(0, 1, 1), c(1, 1, 1), xf), yf),
    zf,
  );
}

/** Fractal noise in roughly [0, 1]. `freq` is in cycles per meter. */
export function fbm(p, freq, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let f = freq;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(p[0] * f + i * 17.1, p[1] * f - i * 9.3, p[2] * f + i * 5.7);
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return sum / norm;
}

export const clamp01 = (t) => Math.min(1, Math.max(0, t));
export const smoothstep = (a, b, t) => fade(clamp01((t - a) / (b - a)));

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

export function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

// ---------------------------------------------------------------------------
// Parametric grid parts
// ---------------------------------------------------------------------------

/**
 * A grid surface. `pos(u, v)` returns a local point; `color(local, u, v)`
 * returns an sRGB color. `k` is texels per grid cell when baking.
 */
export class Part {
  constructor(nu, nv, pos, { material = "satin", color = () => [1, 1, 1], k = 1, weld = true } = {}) {
    this.nu = nu;
    this.nv = nv;
    this.material = material;
    this.color = color;
    this.k = k;
    this.weld = weld;
    const count = (nu + 1) * (nv + 1);
    this.local = new Float64Array(count * 3);
    for (let j = 0; j <= nv; j++) {
      for (let i = 0; i <= nu; i++) {
        const p = pos(i / nu, j / nv);
        this.local.set(p, (j * (nu + 1) + i) * 3);
      }
    }
    this.world = Float64Array.from(this.local);
  }

  #map(fn) {
    for (let o = 0; o < this.world.length; o += 3) {
      const p = fn(this.world[o], this.world[o + 1], this.world[o + 2]);
      this.world[o] = p[0];
      this.world[o + 1] = p[1];
      this.world[o + 2] = p[2];
    }
    return this;
  }

  move(x, y, z) {
    return this.#map((px, py, pz) => [px + x, py + y, pz + z]);
  }

  rotX(a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return this.#map((x, y, z) => [x, y * c - z * s, y * s + z * c]);
  }

  /** Positive angles turn +x toward -z. */
  rotY(a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return this.#map((x, y, z) => [x * c + z * s, y, -x * s + z * c]);
  }

  rotZ(a) {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return this.#map((x, y, z) => [x * c - y * s, x * s + y * c, z]);
  }

  /** Triangle indices into the grid's vertices. */
  indices() {
    const out = [];
    const row = this.nu + 1;
    for (let j = 0; j < this.nv; j++) {
      for (let i = 0; i < this.nu; i++) {
        const a = j * row + i;
        const b = a + 1;
        const c = a + row + 1;
        const d = a + row;
        out.push(a, b, c, a, c, d);
      }
    }
    return out;
  }

  /** Smooth normals; seams and poles are welded by position when `weld` is on. */
  normals() {
    const P = this.world;
    const count = P.length / 3;
    const acc = new Float64Array(P.length);
    const idx = this.indices();
    const keyOf = (i) =>
      `${Math.round(P[i * 3] * 1e5)},${Math.round(P[i * 3 + 1] * 1e5)},${Math.round(P[i * 3 + 2] * 1e5)}`;
    const slot = new Int32Array(count);
    if (this.weld) {
      const seen = new Map();
      for (let i = 0; i < count; i++) {
        const key = keyOf(i);
        if (!seen.has(key)) seen.set(key, i);
        slot[i] = seen.get(key);
      }
    } else {
      for (let i = 0; i < count; i++) slot[i] = i;
    }
    for (let t = 0; t < idx.length; t += 3) {
      const [a, b, c] = [idx[t], idx[t + 1], idx[t + 2]];
      const e1 = [P[b * 3] - P[a * 3], P[b * 3 + 1] - P[a * 3 + 1], P[b * 3 + 2] - P[a * 3 + 2]];
      const e2 = [P[c * 3] - P[a * 3], P[c * 3 + 1] - P[a * 3 + 1], P[c * 3 + 2] - P[a * 3 + 2]];
      const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
      for (const v of [a, b, c]) {
        const s = slot[v] * 3;
        acc[s] += n[0];
        acc[s + 1] += n[1];
        acc[s + 2] += n[2];
      }
    }
    const out = new Float32Array(P.length);
    for (let i = 0; i < count; i++) {
      const s = slot[i] * 3;
      let [x, y, z] = [acc[s], acc[s + 1], acc[s + 2]];
      const len = Math.hypot(x, y, z);
      if (len < 1e-20) {
        [x, y, z] = [0, 1, 0];
      } else {
        x /= len;
        y /= len;
        z /= len;
      }
      out.set([x, y, z], i * 3);
    }
    return out;
  }

  /** Local point at fractional grid coordinates (bilinear). */
  localAt(gu, gv) {
    const i = Math.min(Math.floor(gu), this.nu - 1);
    const j = Math.min(Math.floor(gv), this.nv - 1);
    const fu = gu - i;
    const fv = gv - j;
    const row = this.nu + 1;
    const L = this.local;
    const at = (ii, jj, c) => L[(jj * row + ii) * 3 + c];
    const p = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      p[c] = lerp(lerp(at(i, j, c), at(i + 1, j, c), fu), lerp(at(i, j + 1, c), at(i + 1, j + 1, c), fu), fv);
    }
    return p;
  }
}

// ---------------------------------------------------------------------------
// Shape builders
// ---------------------------------------------------------------------------

/**
 * Ellipsoid. `disp(dir, u, v)` returns a relative radial offset (0.05 = +5%).
 * `phi0`/`phi1` limit the polar range (0 = top, PI = bottom).
 */
export function ellipsoid(rx, ry, rz, opts = {}) {
  const { nu = 32, nv = 16, disp, phi0 = 0, phi1 = Math.PI, ...rest } = opts;
  return new Part(
    nu,
    nv,
    (u, v) => {
      const th = u * TAU;
      const ph = phi0 + v * (phi1 - phi0);
      const dir = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)];
      const d = disp ? 1 + disp(dir, u, v) : 1;
      return [dir[0] * rx * d, dir[1] * ry * d, dir[2] * rz * d];
    },
    rest,
  );
}

/** Polar disc in the XZ plane at height y; `radius(theta)` allows wavy edges. */
export function disc(radius, opts = {}) {
  const { nu = 48, nv = 12, y = 0, height, ...rest } = opts;
  const R = typeof radius === "function" ? radius : () => radius;
  return new Part(
    nu,
    nv,
    (u, v) => {
      const th = u * TAU;
      const r = v * R(th);
      const x = r * Math.cos(th);
      const z = r * Math.sin(th);
      return [x, height ? height(x, z, v) : y, z];
    },
    rest,
  );
}

/**
 * Surface of revolution from a polyline of [radius, y] points.
 * Every profile point is kept exactly (so a plate's rim is exactly its
 * stated radius); extra rows are spread over segments by length.
 */
export function lathe(profile, opts = {}) {
  // theta0/thetaLength: sweep only part of the circle (e.g. a slice).
  const { nu = 96, nv = 64, theta0 = 0, thetaLength = TAU, ...rest } = opts;
  const segs = profile.length - 1;
  const lens = [];
  for (let i = 1; i < profile.length; i++) {
    lens.push(Math.hypot(profile[i][0] - profile[i - 1][0], profile[i][1] - profile[i - 1][1]));
  }
  const total = lens.reduce((a, b) => a + b, 0);
  const rows = Math.max(nv, segs);
  // At least one row per segment, the rest by length (largest remainders).
  const ideal = lens.map((l) => 1 + ((rows - segs) * l) / total);
  const counts = ideal.map(Math.floor);
  let left = rows - counts.reduce((a, b) => a + b, 0);
  const order = ideal.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left > 0; k++, left--) counts[order[k % segs][1]]++;
  const points = [profile[0]];
  counts.forEach((n, i) => {
    for (let s = 1; s <= n; s++) {
      const f = s / n;
      points.push([lerp(profile[i][0], profile[i + 1][0], f), lerp(profile[i][1], profile[i + 1][1], f)]);
    }
  });
  return new Part(
    nu,
    rows,
    (u, v) => {
      const th = theta0 + u * thetaLength;
      const [r, y] = points[Math.round(v * rows)];
      return [r * Math.cos(th), y, r * Math.sin(th)];
    },
    rest,
  );
}

/**
 * Tube around a curve. `frame(u)` returns {c, n1, n2} (center + two unit
 * axes of the cross-section); `radius(u, theta)` returns [a, b].
 */
export function tube(frame, radius, opts = {}) {
  const { nu = 64, nv = 16, ...rest } = opts;
  return new Part(
    nu,
    nv,
    (u, v) => {
      const th = v * TAU;
      const { c, n1, n2 } = frame(u);
      const [a, b] = radius(u, th);
      return [
        c[0] + n1[0] * a * Math.cos(th) + n2[0] * b * Math.sin(th),
        c[1] + n1[1] * a * Math.cos(th) + n2[1] * b * Math.sin(th),
        c[2] + n1[2] * a * Math.cos(th) + n2[2] * b * Math.sin(th),
      ];
    },
    rest,
  );
}

/** A leaf lying along +x, base at the origin. */
export function leaf(length, width, opts = {}) {
  const { nu = 20, nv = 8, cup = 0.3, arch = 0.08, ...rest } = opts;
  return new Part(
    nu,
    nv,
    (u, v) => {
      const s = v * 2 - 1;
      const w = width * Math.pow(Math.sin(Math.PI * Math.min(u, 0.999) ** 0.85), 0.8) * (1 - 0.25 * u) * 0.5;
      return [u * length, Math.abs(s) * w * cup + Math.sin(Math.PI * u) * length * arch, s * w];
    },
    { weld: false, ...rest },
  );
}
