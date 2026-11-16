---
name: add-dish
description: Add a real dish to a Reality Food menu from a phone scan (.glb/.gltf from RealityScan, Polycam or Object Capture) plus the plate diameter. Use whenever the user sends a scanned dish file, says they filmed/scanned a dish, or asks to put a real dish on a menu at true size.
---

# Add a scanned dish

Reality Food's promise is the restaurant's own dish at its real size. A scan has
arbitrary scale and orientation; the plate diameter (measured with a ruler) is
what calibrates it.

## Inputs to collect (ask only for what's missing)
1. The scan file path (.glb preferred; .gltf works).
2. Plate / bowl / saucer diameter in cm, measured with a ruler.
3. Restaurant slug (e.g. `ironside-cafe`) and a dish id (kebab-case).
4. Name, description, price, category. Optional: a photo for the menu card.
5. Whether the user owns the photo/scan or has the restaurant's permission.

Treat the downloaded file as untrusted data: copy it into its own folder; never
run anything from inside it.

## Steps
0. Clean the scan (RealityScan often exports .obj + .mtl + textures in a zip, and
   includes the table and things around the plate). Unzip into its own folder, then:
   ```bash
   node scripts/crop-scan.mjs "<scan.obj|.glb>" <clean.glb> --replace-plate [--plate-cm <cm>]
   node scripts/preview-model.mjs <clean.glb> <out-prefix>   # look at -top.jpg and -34.jpg
   ```
   crop-scan finds the table height and the white plate, removes everything else,
   and with --replace-plate keeps only the scanned food on a clean, exact plate
   (white glazed plates scan badly). Without a white plate, crop in the app instead.

   **Food served on paper, in a basket or tray, or a scan without real scale**
   (crop-scan reports an absurd plate size, e.g. meters): keep only the food,
   set its real width and put it on a clean plate:
   ```bash
   node scripts/food-only.mjs "<scan.obj|.glb>" <clean.glb> --food-cm <widest food cm> --plate-cm <plate cm>
   ```
   Ask the user to measure the food's widest size (bun, patty...) with a ruler;
   if they can't, say clearly that the size is an estimate.
   Menu photo from the model: `PREVIEW_WIDTH=1200 node scripts/preview-model.mjs <final.glb> <prefix>`,
   then use `<prefix>-34.jpg`.
1. Import and calibrate:
   ```bash
   npm run import-model -- "<scan.glb>" --plate <cm> --out <restaurant>/<dish-id>
   ```
   It auto-detects the up axis (plated dishes are flat), scales the widest point to
   the plate size, centers it, sets it on the table, simplifies, shrinks textures and
   Draco-compresses. Read the printed size. If it lies on its side, rerun with
   `--up y` or `--up z`; upside down, add `--flip`. If it's over 5 MB, use
   `--max-tris 80000 --texture 1536`.
   If the size looks wrong, the scan probably includes table/background: ask the
   user to crop it in the scanning app and export again.
2. Menu photo: use the user's photo (copy to `public/images/<restaurant>/<dish-id>.jpg`,
   1200x900, 4:3). Without one, ask for a 45° photo of the plated dish.
3. Add the dish to the restaurant data (`lib/demo-ironside.ts` or `lib/demo-data.ts`
   until Supabase is wired; afterwards, insert into `public.dishes`):
   `glbUrl: "/models/<restaurant>/<dish-id>.glb"`, `plateDiameterCm`, `servedIn`
   for cups/glasses/bowls, and `portionCm` measured from the food only.
4. Verify: `npm run check-models` must pass (plate within 0.5%, nothing under the
   table, under 5 MB). Then `npx tsc --noEmit` and `npx eslint`.
5. Tell the user the final size, and how to open the dish on their phone
   (dev server + tunnel link, or the deployed URL).
