// Re-packs a .usdz with JPEG textures instead of PNG.
//
// three.js' USDZExporter always writes textures as PNG, which is 3-4x heavier than
// JPEG for photo-like food textures. AR Quick Look reads JPEG fine, so we convert
// every opaque PNG texture and point the scene at the .jpg. USDZ rules kept:
// files stored without compression, each file's data starting on a 64-byte
// boundary, and the scene (model.usda) still first.

import { crc32 } from "node:zlib";
import sharp from "sharp";

/** Reads the stored (uncompressed) entries of a zip, in order. */
function readEntries(buf) {
  const entries = [];
  let o = 0;
  while (o + 30 <= buf.length && buf.readUInt32LE(o) === 0x04034b50) {
    const method = buf.readUInt16LE(o + 8);
    const size = buf.readUInt32LE(o + 18);
    const nameLen = buf.readUInt16LE(o + 26);
    const extraLen = buf.readUInt16LE(o + 28);
    if (method !== 0) throw new Error("usdz-jpeg: compressed entries are not allowed in a .usdz");
    const name = buf.toString("utf8", o + 30, o + 30 + nameLen);
    const start = o + 30 + nameLen + extraLen;
    entries.push({ name, data: buf.subarray(start, start + size) });
    o = start + size;
  }
  return entries;
}

/** Writes a stored zip whose file data are 64-byte aligned (USDZ requirement). */
function writeUsdz(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    let pad = (64 - ((offset + 30 + nameBuf.length) % 64)) % 64;
    if (pad > 0 && pad < 4) pad += 64; // an extra field needs at least 4 bytes
    const extra = Buffer.alloc(pad);
    if (pad) {
      extra.writeUInt16LE(0x1986, 0); // padding field id (any unused id)
      extra.writeUInt16LE(pad - 4, 2);
    }
    const crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4); // version needed
    header.writeUInt16LE(0, 6); // flags
    header.writeUInt16LE(0, 8); // stored
    header.writeUInt32LE(0, 10); // time + date
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(extra.length, 28);
    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(data.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);
    chunks.push(header, nameBuf, extra, data);
    offset += 30 + nameBuf.length + extra.length + data.length;
  }
  const cdBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cdBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, cdBuf, end]);
}

/** Returns the .usdz with opaque PNG textures converted to JPEG. */
export async function pngTexturesToJpeg(usdz, quality = 88) {
  const entries = readEntries(Buffer.from(usdz));
  const renamed = new Map();
  for (const entry of entries) {
    if (!/^textures\/.+\.png$/i.test(entry.name)) continue;
    // Keep PNG where transparency matters (glass, cut-outs).
    const { isOpaque } = await sharp(entry.data).stats();
    if (!isOpaque) continue;
    const jpg = entry.name.replace(/\.png$/i, ".jpg");
    entry.data = await sharp(entry.data).flatten({ background: "#ffffff" }).jpeg({ quality, mozjpeg: true }).toBuffer();
    renamed.set(entry.name, jpg);
    entry.name = jpg;
  }
  if (!renamed.size) return Buffer.from(usdz);
  for (const entry of entries) {
    if (!entry.name.endsWith(".usda")) continue;
    let text = entry.data.toString("utf8");
    for (const [from, to] of renamed) text = text.replaceAll(`@${from}@`, `@${to}@`);
    entry.data = Buffer.from(text, "utf8");
  }
  return writeUsdz(entries);
}
