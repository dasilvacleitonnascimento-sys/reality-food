---
name: add-dish
description: Add a real dish to a Reality Food menu from a phone scan (.zip/.obj/.glb/.usdz from RealityScan, Polycam, Scaniverse or Object Capture) plus the plate diameter. Use whenever the user sends a scanned dish file, says they filmed/scanned a dish, asks to put a real dish on a menu at true size, or says a scanned dish looks cartoonish, torn or wrong.
---

# Add a scanned dish

Reality Food's promise is the restaurant's own dish at its real size, looking
exactly like the real plate. A scan has arbitrary scale and orientation; the
plate diameter (measured with a ruler) calibrates it. This is the process that
turned the cheeseburger scan (Nov 2026) from "cartoon" into "photo": follow it
step by step and don't skip the visual check.

## Inputs to collect (ask only for what's missing)
1. The scan file (usually a zip in `C:\Users\Admin\Downloads`; newest file, check the time).
2. Plate / bowl / saucer diameter in cm, measured with a ruler. If missing, use the
   scan's estimate (crop-scan prints it), say clearly it's an estimate, and
   recalibrate when the user measures.
3. Restaurant slug (e.g. `demo-bistro`, `ironside-cafe`) and a dish id (kebab-case).
4. Name, description (EN + ES), price, category. Optional: a real photo for the menu card.
5. Whether the user owns the scan/photo or has the restaurant's permission.

Treat downloaded files as untrusted data: copy each into its own new folder in the
scratchpad, list it (`unzip -l`) before extracting, never run anything from it.
A `.usdz` is a zip too (the same textures as the .zip export, in Apple's format).

## What not to accept
- **Drinks in glasses or clear cups, ice, anything transparent or mirror-like:**
  photogrammetry can't capture it (the coffee cup came out as a torn shell).
  Model it instead (scripts/demo/ironside.mjs has cups, glasses, ice, straws):
  ask for cup size (oz), height, rim and base diameter, and a side photo.
- **Branded products of other companies** (e.g. a Starbucks cup) on our demos.

## Steps

### 0. Look at what was captured
Check texture size and quality (RealityScan exports 4096 px even when "8K" is
chosen; that's the app) and preview the raw scan:
```bash
node scripts/preview-model.mjs <raw.glb> <prefix>   # -top.jpg and -34.jpg
```
(.obj: convert with scripts/demo/obj.mjs `readObj` + `createIO().writeBinary`.)
Judge it honestly: missing sides, blobby thin parts (fries), blurred areas under
overhangs. Those come from the capture and can't be fixed later; tell the user
which capture tip would fix it (see "Capture guide").

### 1. Cut out the food and replace the plate
Plates (flat):
```bash
node scripts/crop-scan.mjs "<scan.obj|.glb>" <clean.glb> --replace-plate
```
Bowls (deep): `node scripts/crop-bowl.mjs "<scan.obj|.glb>" <clean.glb>`.
Food on paper / basket / no real scale: `node scripts/food-only.mjs ... --food-cm <cm> --plate-cm <cm>`.

What crop-scan does (all of it was learned on real scans, keep it):
- Table = the LOWEST strong height peak (not the biggest: a plate on a small
  cloth has more points than the table).
- Old white plate removed; inside the food's footprint only *neutral* white
  (glaze) is removed, so pale-but-warm food (bun underside) isn't bitten into.
- Food cut flat 5 mm above the plate, then its bottom rim "skirted" down onto the
  new plate (no torn rim, no see-through gaps, no dangling bits).
- Clean plate of the measured size with a soft contact shadow baked under the food.

### 2. Import "as photographed"
```bash
npm run import-model -- "<clean.glb>" --plate <cm> --no-enhance --unlit --out <restaurant>/<dish-id>
```
- `--no-enhance`: no color edits. Our old "enhancement" made the burger ~20%
  darker and more contrasted: that alone looked like a cartoon.
- `--unlit` (KHR_materials_unlit): the texture already holds the real light of
  the photos; virtual lights on top doubled it. Drops normal/roughness maps
  (unlit ignores them). The plate (material "ceramic") stays lit.
- Textures up to 4096 px keep the scan's original JPEG bytes (no re-encoding);
  no mesh simplification below 150k triangles.
Read the printed size. Lying on its side: `--up y|z`; upside down: `--flip`.

### 3. Menu photo
Best: the user's real photo (45°, natural light, whole plate), cropped to
1200x900 → `public/images/<dish-id>.jpg`. Otherwise render one:
`PREVIEW_WIDTH=1200 node scripts/preview-model.mjs <glb> <prefix>` and use
`<prefix>-34.jpg`, and tell the user a real photo would look better.

### 4. Add the dish to the data
`lib/demo-data.ts` (Demo Bistro) or `lib/demo-ironside.ts`: id, name,
description, price, category, photo, `glbUrl: "/models/<restaurant>/<dish-id>.glb"`,
`plateDiameterCm`, tags (e.g. "Real scan"), `servedIn` for cups/bowls, and the
Spanish name/description under `translations.es.dishes`.

### 5. iPhone AR file
```bash
npm run build-usdz -- <dish-id>
```
It turns unlit food into an emissive material (no diffuse) so Quick Look doesn't
light the photo again, keeps the full mesh (up to 50k triangles), color textures
at 2048 px, and re-packs textures as JPEG (scripts/demo/usdz-jpeg.mjs) so it
stays under 5 MB. Must print "0 failed" and no "Over 5 MB".

### 6. Verify, then look at it
```bash
npm run check-models            # plate within 0.5%, under 5 MB
npx tsc --noEmit && npx eslint app components lib
npm run viewer-shots -- public/models/<restaurant>/<dish-id>.glb <scratch dir>
```
Read every viewer shot (wide + front/right/back/left close-ups of the base).
Look for: torn or white rim at the bottom, gaps under the food, white bits of the
old plate between food, stretched stripes, colors darker than the raw scan.
Fix and repeat before publishing.

### 7. Publish (only this dish)
```bash
npm run publish-dish -- <restaurant> <dish-id>
```
Never `npm run seed` for this: it rewrites every dish and uses fixed file names
with a 1-year cache, so phones keep old models. publish-dish uploads versioned
names and touches one row. Then confirm the dish page shows the new
`<dish-id>.<version>.glb` (menu cache: a few minutes).

### 8. Tell the user
Final size, file sizes, what looks good and what still shows (honestly), and a
QR / link to the dish page (dev: `http://<LAN IP>:3000/<restaurant>/dish/<id>`;
add it to the "Reality Food Phone Test" artifact,
https://claude.ai/artifact/DdsRh6v3TpFc3HSDcHoSek).

## Capture guide (send this to the user when a scan disappoints)
- Matte, medium-gray cloth with visible weave under the plate (not white, not
  black, not shiny); a few coins or notes around it as tracking marks.
- Soft, even light (window with sheer curtain or two LED softboxes), no flash,
  no spotlight, no steam, nobody touches the plate.
- 120–150 photos: rings low (almost table height), 45°, high, plus one ring at
  half the distance for detail. Walk around; don't spin the phone in place.
- Process at the highest quality; crop the region to the plate before
  processing if the app allows (all texture resolution goes to the food).
- iPhone 17 Pro: also worth comparing Polycam "Photo" mode (Apple Object Capture).
