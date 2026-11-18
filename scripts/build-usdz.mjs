// Builds the iPhone AR file (.usdz) for every 3D dish, ahead of time.
//
//   npm run build-usdz            (all models in public/models)
//   npm run build-usdz -- burger  (only files whose path contains "burger")
//
// Without it, the iPhone converts the .glb to .usdz on the diner's phone when
// they tap "View on your table", which takes seconds. This does the same
// conversion (three.js USDZExporter, the one model-viewer uses) once, here.
// The exporter needs a browser canvas, so it runs in headless Chrome: a tiny
// local server hands Chrome the models and receives the .usdz files back.
// Then `npm run seed` uploads them and menus pass them to model-viewer (ios-src).

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { simplify, weld } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import { createIO } from "./demo/export.mjs";
import { pngTexturesToJpeg } from "./demo/usdz-jpeg.mjs";

const root = path.resolve(import.meta.dirname, "..");
const filter = process.argv[2] ?? "";
// USDZ stores geometry as text (no compression), so the AR copy is lighter
// than the 3D viewer's: ~15k triangles. Color stays sharp at 2048 px (food is
// looked at from up close in AR); roughness/occlusion maps are cut to 1024 px,
// where nobody sees the difference. Textures are re-packed as JPEG
// (scripts/demo/usdz-jpeg.mjs), so files land around 2-4 MB.
// Scanned food keeps its full mesh (~35k triangles) so AR shows the real shape;
// only heavier models are simplified. JPEG textures leave room for it under 5 MB.
const MAX_TRIS = 50000;
const MAX_TEXTURE = 2048;
const MAX_DATA_TEXTURE = 1024;
const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];

async function listModels(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listModels(full)));
    else if (entry.name.endsWith(".glb")) out.push(path.relative(path.join(root, "public"), full).split(path.sep).join("/"));
  }
  return out;
}
const models = (await listModels(path.join(root, "public", "models"))).filter((m) => m.includes(filter));
if (!models.length) {
  console.error(`No .glb files match "${filter}".`);
  process.exit(1);
}

// Lighter copies for AR, in a temp folder served at /work/.
const work = await mkdtemp(path.join(tmpdir(), "rf-usdz-work-"));
const io = await createIO();
await MeshoptSimplifier.ready;
for (const m of models) {
  const doc = await io.read(path.join(root, "public", m));
  let tris = 0;
  for (const prim of doc.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives())) {
    tris += (prim.getIndices()?.getCount() ?? prim.getAttribute("POSITION").getCount()) / 3;
  }
  if (tris > MAX_TRIS) {
    await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: MAX_TRIS / tris, error: 0.01 }));
  }
  // Normal maps double the file size for little gain at arm's length in AR.
  for (const material of doc.getRoot().listMaterials()) material.setNormalTexture(null);
  for (const texture of doc.getRoot().listTextures()) {
    if (!doc.getRoot().listMaterials().some((mat) => [mat.getBaseColorTexture(), mat.getMetallicRoughnessTexture(), mat.getOcclusionTexture(), mat.getEmissiveTexture()].includes(texture))) texture.dispose();
  }
  // Roughness/occlusion maps: smaller than color (see MAX_DATA_TEXTURE).
  for (const texture of doc.getRoot().listTextures()) {
    const materials = doc.getRoot().listMaterials();
    const isData = materials.some((mat) => [mat.getMetallicRoughnessTexture(), mat.getOcclusionTexture()].includes(texture));
    const isColor = materials.some((mat) => mat.getBaseColorTexture() === texture);
    if (!isData || isColor || !texture.getImage()) continue;
    const small = await sharp(Buffer.from(texture.getImage()))
      .resize(MAX_DATA_TEXTURE, MAX_DATA_TEXTURE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    texture.setImage(new Uint8Array(small)).setMimeType("image/jpeg");
  }
  let after = 0;
  for (const prim of doc.getRoot().listMeshes().flatMap((mesh) => mesh.listPrimitives())) {
    after += (prim.getIndices()?.getCount() ?? prim.getAttribute("POSITION").getCount()) / 3;
  }
  if (tris > MAX_TRIS) console.log(`  ${m}: ${Math.round(tris)} -> ${Math.round(after)} triangles for AR`);
  const out = path.join(work, m);
  await import("node:fs/promises").then((fsp) => fsp.mkdir(path.dirname(out), { recursive: true }));
  await io.write(out, doc);
}

const page = `<!doctype html><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>
<script type="module">
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { USDZExporter } from "three/addons/exporters/USDZExporter.js";
const post = (url, body) => fetch(url, { method: "POST", body });

// A 15 cm gold ruler lying on the table in front of the dish (cm on top, inches
// below), so diners can judge the size without holding their hand over it.
const RULER = { length: 0.15, width: 0.026, thick: 0.0012 };
function rulerTexture() {
  const W = 2048;
  const H = Math.round((W * RULER.width) / RULER.length);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  g.fillStyle = "#FBB71A";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#191A1F";
  const pxPerCm = W / 15;
  const margin = pxPerCm * 0.25;
  const usable = W - margin * 2;
  const cmPx = usable / 14.5;
  g.font = "700 " + Math.round(H * 0.2) + "px Arial";
  g.textBaseline = "top";
  for (let mm = 0; mm <= 145; mm++) {
    const x = margin + (mm / 10) * cmPx;
    const len = mm % 10 === 0 ? 0.32 : mm % 5 === 0 ? 0.22 : 0.13;
    g.fillRect(x - 1.5, 0, 3, H * len);
    if (mm % 10 === 0 && mm > 0) g.fillText(String(mm / 10), x + 4, H * 0.06);
  }
  const inPx = cmPx * 2.54;
  g.textBaseline = "bottom";
  for (let s16 = 0; s16 <= 5.7 * 16; s16++) {
    const x = margin + (s16 / 16) * inPx;
    const len = s16 % 16 === 0 ? 0.3 : s16 % 8 === 0 ? 0.22 : s16 % 4 === 0 ? 0.15 : 0.08;
    g.fillRect(x - 1.5, H * (1 - len), 3, H * len);
    if (s16 % 16 === 0 && s16 > 0) g.fillText(String(s16 / 16), x + 4, H * 0.94);
  }
  g.textAlign = "right";
  g.textBaseline = "middle";
  g.font = "700 " + Math.round(H * 0.16) + "px Arial";
  g.fillText("cm / in  ·  Reality Food", W - margin, H * 0.5);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const rulerMap = rulerTexture();
function addRuler(group, model) {
  const box = new THREE.Box3().setFromObject(model);
  const ruler = new THREE.Mesh(
    new THREE.BoxGeometry(RULER.length, RULER.thick, RULER.width),
    new THREE.MeshStandardMaterial({ map: rulerMap, roughness: 0.55, metalness: 0 }),
  );
  ruler.name = "ruler";
  const cx = (box.min.x + box.max.x) / 2;
  ruler.position.set(cx, box.min.y + RULER.thick / 2, box.max.z + 0.025 + RULER.width / 2);
  group.add(ruler);
}
const models = await (await fetch("/list")).json();
const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath("/public/draco/"));
for (const glb of models) {
  try {
    const gltf = await loader.loadAsync("/work/" + glb);
    // Same structure model-viewer exports: the model inside a plain group.
    const group = new THREE.Object3D();
    // Unlit materials (scanned food, KHR_materials_unlit) come in as MeshBasicMaterial,
    // which USDZ can't express. Quick Look would light the photo texture again on top
    // of the light already in it. Instead: no diffuse, the texture as emissive color,
    // so the dish shows exactly as photographed.
    gltf.scene.traverse((node) => {
      if (!node.isMesh || !node.material?.isMeshBasicMaterial) return;
      const basic = node.material;
      node.material = new THREE.MeshStandardMaterial({
        color: 0x000000,
        emissive: 0xffffff,
        emissiveMap: basic.map,
        roughness: 1,
        metalness: 0,
        side: basic.side,
      });
      basic.dispose();
    });
    group.add(gltf.scene);
    group.updateWorldMatrix(false, true);
    addRuler(group, gltf.scene);
    group.updateWorldMatrix(false, true);
    const usdz = await new USDZExporter().parseAsync(group, { maxTextureSize: ${MAX_TEXTURE} });
    await post("/save?file=" + encodeURIComponent(glb.replace(/\\.glb$/, ".usdz")), usdz);
  } catch (error) {
    await post("/fail?file=" + encodeURIComponent(glb), String(error));
  }
}
await post("/done", "");
</script>`;

const TYPES = { ".js": "text/javascript", ".wasm": "application/wasm", ".glb": "model/gltf-binary" };
let done;
const finished = new Promise((resolve) => (done = resolve));
const results = { saved: [], failed: [] };

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const body = async () => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    return Buffer.concat(chunks);
  };
  try {
    if (url.pathname === "/") return res.writeHead(200, { "content-type": "text/html" }).end(page);
    if (url.pathname === "/list") return res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(models));
    if (url.pathname === "/save") {
      const rel = url.searchParams.get("file") ?? "";
      const target = path.resolve(root, "public", rel);
      // Only ever write .usdz files inside public/models.
      if (!target.startsWith(path.join(root, "public", "models") + path.sep) || !target.endsWith(".usdz")) throw new Error(`bad path ${rel}`);
      // three.js writes PNG textures; JPEG is 3-4x lighter and Quick Look reads it.
      const data = await pngTexturesToJpeg(await body());
      await writeFile(target, data);
      results.saved.push([rel, data.length]);
      console.log(`  ${rel}  ${(data.length / 1024 / 1024).toFixed(2)} MB`);
      return res.writeHead(200).end();
    }
    if (url.pathname === "/fail") {
      const msg = (await body()).toString();
      results.failed.push([url.searchParams.get("file"), msg]);
      console.log(`  FAILED ${url.searchParams.get("file")}: ${msg}`);
      return res.writeHead(200).end();
    }
    if (url.pathname === "/done") {
      res.writeHead(200).end();
      return done();
    }
    // Static files: only node_modules/three and public/ (models + Draco decoder).
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const file = path.resolve(root, rel);
    const workFile = rel.startsWith("work/") ? path.resolve(work, rel.slice(5)) : null;
    const allowed = [path.join(root, "node_modules", "three"), path.join(root, "public")];
    if (workFile) {
      if (!workFile.startsWith(work + path.sep)) return res.writeHead(404).end();
      return res.writeHead(200, { "content-type": "model/gltf-binary" }).end(await readFile(workFile));
    }
    if (!allowed.some((dir) => file.startsWith(dir + path.sep))) return res.writeHead(404).end();
    await stat(file);
    return res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" }).end(await readFile(file));
  } catch (error) {
    if (!res.headersSent) res.writeHead(500).end(String(error));
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;

let chromePath;
for (const candidate of CHROME) {
  if (await stat(candidate).then(() => true, () => false)) {
    chromePath = candidate;
    break;
  }
}
if (!chromePath) {
  console.error("Google Chrome not found.");
  process.exit(1);
}
const profile = await mkdtemp(path.join(tmpdir(), "rf-usdz-"));
console.log(`Converting ${models.length} model(s) to .usdz...`);
const chrome = spawn(chromePath, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, `http://127.0.0.1:${port}/`], { stdio: "ignore" });

const timeout = setTimeout(() => done("timeout"), 15 * 60 * 1000);
const outcome = await finished;
clearTimeout(timeout);
chrome.kill();
server.close();
await rm(profile, { recursive: true, force: true }).catch(() => {});
await rm(work, { recursive: true, force: true }).catch(() => {});

const big = results.saved.filter(([, size]) => size > 5 * 1024 * 1024);
console.log(`\nSaved ${results.saved.length} .usdz file(s); ${results.failed.length} failed${outcome === "timeout" ? " (timed out)" : ""}.`);
if (big.length) console.log(`Over 5 MB (too big for upload): ${big.map(([f]) => f).join(", ")}`);
process.exit(results.failed.length || outcome === "timeout" || big.length ? 1 : 0);
