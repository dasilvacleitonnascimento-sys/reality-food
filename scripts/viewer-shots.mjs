// Screenshots a dish model in <model-viewer> with the menu's own look, so problems
// show up before a phone does: a wide 3/4 view plus low close-ups of the food's base
// from four sides (where torn rims, white leftovers of the old plate and gaps hide).
//
//   npm run viewer-shots -- public/models/demo-bistro/burger.glb <out-dir>
//
// Writes <out-dir>/wide.png, front.png, right.png, back.png, left.png.
// Runs headless Chrome with software WebGL (works on machines without a GPU).

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createIO } from "./demo/export.mjs";

const [input, outDir] = process.argv.slice(2);
if (!input || !outDir) {
  console.error("Usage: npm run viewer-shots -- <model.glb under public/> <out-dir>");
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, "..");
const glb = path.resolve(input);
if (!glb.startsWith(path.join(root, "public") + path.sep)) {
  console.error("The model must be inside public/ (it's served like on the site).");
  process.exit(1);
}
const modelUrl = "/" + path.relative(root, glb).split(path.sep).join("/");
await mkdir(outDir, { recursive: true });

// Where the food is (everything but the "ceramic" plate), for the close-ups.
const doc = await (await createIO()).read(glb);
const lo = [Infinity, Infinity, Infinity];
const hi = [-Infinity, -Infinity, -Infinity];
const v = [0, 0, 0];
for (const node of doc.getRoot().listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  const m = node.getWorldMatrix();
  for (const prim of mesh.listPrimitives()) {
    if (prim.getMaterial()?.getName() === "ceramic") continue;
    const pos = prim.getAttribute("POSITION");
    for (let i = 0; i < pos.getCount(); i++) {
      pos.getElement(i, v);
      const w = [0, 1, 2].map((c) => m[c] * v[0] + m[4 + c] * v[1] + m[8 + c] * v[2] + m[12 + c]);
      for (let c = 0; c < 3; c++) {
        lo[c] = Math.min(lo[c], w[c]);
        hi[c] = Math.max(hi[c], w[c]);
      }
    }
  }
}
const center = [(lo[0] + hi[0]) / 2, lo[1] + (hi[1] - lo[1]) * 0.3, (lo[2] + hi[2]) / 2];
const span = Math.max(hi[0] - lo[0], hi[2] - lo[2], 0.08);
const target = center.map((c) => `${c.toFixed(3)}m`).join(" ");
const radius = `${(span * 1.35).toFixed(3)}m`;
const views = [
  { name: "wide", orbit: "30deg 62deg auto", target: "auto auto auto", fov: "30deg" },
  ...[
    ["front", 30],
    ["right", 120],
    ["back", 210],
    ["left", 300],
  ].map(([name, deg]) => ({ name, orbit: `${deg}deg 80deg ${radius}`, target, fov: "26deg" })),
];

// Same look as the site (lib/ar/viewer-look.ts).
const page = `<!doctype html><html><body style="margin:0;background:#fff">
<script>self.ModelViewerElement={dracoDecoderLocation:"/public/draco/"};</script>
<script src="/node_modules/@google/model-viewer/dist/model-viewer-umd.min.js"></script>
<model-viewer src="${modelUrl}" environment-image="neutral" tone-mapping="neutral" shadow-intensity="1" shadow-softness="1"
  interaction-prompt="none" style="width:1000px;height:700px;background:#fff"></model-viewer>
<script>
const views = ${JSON.stringify(views)};
const mv = document.querySelector("model-viewer");
const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
mv.addEventListener("load", async () => {
  for (const view of views) {
    mv.cameraTarget = view.target;
    mv.cameraOrbit = view.orbit;
    mv.fieldOfView = view.fov;
    mv.jumpCameraToGoal();
    await frame(); await frame();
    await new Promise((r) => setTimeout(r, 900));
    const blob = await mv.toBlob({ idealAspect: false });
    await fetch("/shot?name=" + view.name, { method: "POST", body: blob });
  }
  await fetch("/done", { method: "POST" });
});
mv.addEventListener("error", () => fetch("/done?error=1", { method: "POST" }));
</script></body></html>`;

let finish;
const finished = new Promise((resolve) => (finish = resolve));
const saved = [];
const server = createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  try {
    if (u.pathname === "/") return res.writeHead(200, { "content-type": "text/html" }).end(page);
    if (req.method === "POST") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      if (u.pathname === "/shot") {
        const name = (u.searchParams.get("name") ?? "shot").replace(/[^a-z]/g, "");
        const file = path.join(outDir, `${name}.png`);
        await writeFile(file, Buffer.concat(chunks));
        saved.push(file);
      }
      if (u.pathname === "/done") finish(u.searchParams.get("error") ? "error" : "ok");
      return res.writeHead(200).end();
    }
    const file = path.resolve(root, "." + decodeURIComponent(u.pathname));
    const allowed = [path.join(root, "public"), path.join(root, "node_modules", "@google", "model-viewer")];
    if (!allowed.some((dir) => file.startsWith(dir + path.sep))) return res.writeHead(404).end();
    await stat(file);
    const type = file.endsWith(".js") ? "text/javascript" : file.endsWith(".wasm") ? "application/wasm" : "application/octet-stream";
    return res.writeHead(200, { "content-type": type }).end(await readFile(file));
  } catch {
    if (!res.headersSent) res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
];
let chromePath;
for (const c of CHROME) if (!chromePath && (await stat(c).then(() => true, () => false))) chromePath = c;
if (!chromePath) {
  console.error("Google Chrome not found.");
  process.exit(1);
}
const profile = await mkdtemp(path.join(tmpdir(), "rf-shots-"));
const chrome = spawn(
  chromePath,
  ["--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--remote-debugging-port=0", "--window-size=1000,700", `--user-data-dir=${profile}`, `http://127.0.0.1:${server.address().port}/`],
  { stdio: "ignore" },
);
const timer = setTimeout(() => finish("timeout"), 5 * 60 * 1000);
const outcome = await finished;
clearTimeout(timer);
chrome.kill();
server.close();
await rm(profile, { recursive: true, force: true }).catch(() => {});
console.log(saved.length ? `Saved ${saved.length} view(s):\n  ${saved.join("\n  ")}` : "No views saved.");
if (outcome !== "ok") {
  console.error(`Viewer ${outcome}.`);
  process.exit(1);
}
