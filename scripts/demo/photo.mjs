// Loads a photo so dish models can be textured from real pixels.

import sharp from "sharp";

/**
 * Returns `sample(x, y)` -> sRGB [0..1], where x/y are in a reference
 * coordinate space `refWidth` pixels wide (measurements are taken on a
 * downscaled copy, sampling uses the full-resolution pixels).
 */
export async function loadPhoto(file, refWidth) {
  const { data, info } = await sharp(file).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const k = width / refWidth;
  const px = (x, y, c) => data[(y * width + x) * 3 + c];
  const sample = (rx, ry) => {
    const x = Math.min(Math.max(rx * k - 0.5, 0), width - 1.001);
    const y = Math.min(Math.max(ry * k - 0.5, 0), height - 1.001);
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const out = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      const top = px(x0, y0, c) * (1 - fx) + px(x0 + 1, y0, c) * fx;
      const bottom = px(x0, y0 + 1, c) * (1 - fx) + px(x0 + 1, y0 + 1, c) * fx;
      out[c] = (top * (1 - fy) + bottom * fy) / 255;
    }
    return out;
  };
  return { sample, width, height };
}
