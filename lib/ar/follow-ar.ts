// "Follow" AR mode (WebXR, Chrome on Android).
//
// The dish sits on the table exactly where the center of the screen points,
// at true size, and slides along as the phone moves. "Place" pins it with a
// WebXR anchor so tracking corrections keep it glued to that spot while the
// diner walks around it or compares it with their hand. An optional ruler,
// measured from the model itself, shows the real size in centimeters.
//
// This module pulls in three.js, so only import it dynamically.

import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type FollowArStatus =
  | "loading"
  | "searching" // looking for the table
  | "estimating" // table not found yet: dish shown in front of the phone
  | "following" // dish on the table, following the center of the screen
  | "placed" // dish pinned to the table
  | "ended";

export type FollowArSession = {
  /** Plate width measured from the model, in cm. */
  plateWidthCm: number;
  setPlaced(placed: boolean): void;
  setRuler(visible: boolean): void;
  end(): Promise<void>;
};

type Options = {
  glbUrl: string;
  /** Element shown on top of the camera view (buttons, hints). */
  overlay: HTMLElement;
  onStatus: (status: FollowArStatus) => void;
};

const MIN_UP = 0.85; // only accept roughly horizontal surfaces (tables, not walls)
const SEARCH_TIMEOUT_MS = 4000; // then show the dish in front of the phone anyway
const RULER_WIDTH = 0.03; // 3 cm wide ruler
const RULER_GAP = 0.012; // between the plate's edge and the ruler

function lerpAngle(a: number, b: number, t: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * t;
}

/** A flat ruler, 0 at the plate's left edge, so the plate spans 0 -> its diameter. */
function makeRuler(plateWidth: number, maxAnisotropy: number) {
  const lengthCm = Math.ceil(plateWidth * 100) + 2;
  const length = lengthCm / 100;
  const pxPerCm = 64;
  const canvas = document.createElement("canvas");
  canvas.width = lengthCm * pxPerCm;
  canvas.height = Math.round(RULER_WIDTH * 100 * pxPerCm);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  const h = canvas.height;
  ctx.fillStyle = "rgba(255, 255, 255, 0.93)";
  ctx.fillRect(0, 0, canvas.width, h);
  ctx.fillStyle = "#1c1714";
  ctx.font = `600 ${Math.round(h * 0.32)}px system-ui, sans-serif`;
  ctx.textBaseline = "bottom";
  for (let mm = 0; mm <= lengthCm * 10; mm++) {
    const x = (mm / 10) * pxPerCm;
    const tick = mm % 10 === 0 ? (mm % 50 === 0 ? 0.55 : 0.4) : mm % 5 === 0 ? 0.25 : 0.14;
    ctx.fillRect(Math.min(x, canvas.width - 2), 0, mm % 10 === 0 ? 3 : 1.5, h * tick);
    if (mm % 50 === 0 && mm > 0) ctx.fillText(String(mm / 10), x + 6, h - 6);
  }
  // Mark the plate's measured diameter.
  const plateX = plateWidth * 100 * pxPerCm;
  ctx.fillStyle = "#b93a15";
  ctx.fillRect(plateX - 2, 0, 4, h);
  ctx.textAlign = "right";
  ctx.fillText(`${(plateWidth * 100).toFixed(1)} cm`, plateX - 8, h - 6);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  const ruler = new THREE.Mesh(
    new THREE.PlaneGeometry(length, RULER_WIDTH),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, toneMapped: false }),
  );
  ruler.rotation.x = -Math.PI / 2;
  // Lies on the table, in front of the plate (the side facing the diner).
  ruler.position.set(-plateWidth / 2 + length / 2, 0.0015, plateWidth / 2 + RULER_GAP + RULER_WIDTH / 2);
  ruler.visible = false;
  return ruler;
}

/** Must be called directly from a tap handler (browsers require a user gesture). */
export async function startFollowAr({ glbUrl, overlay, onStatus }: Options): Promise<FollowArSession> {
  const xr = navigator.xr;
  if (!xr) throw new Error("WebXR is not available");

  // Request the session first, while we still have the user gesture.
  const session = await xr.requestSession("immersive-ar", {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay", "anchors"],
    domOverlay: { root: overlay },
  });
  onStatus("loading");

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.9;

  const dish = new THREE.Group();
  dish.visible = false;
  scene.add(dish);

  // Soft sun that travels with the dish so its shadow always lands on the table.
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(0.25, 1, 0.15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0005;
  Object.assign(sun.shadow.camera, { left: -0.3, right: 0.3, top: 0.3, bottom: -0.3, near: 0.05, far: 3 });
  dish.add(sun, sun.target);

  // Invisible floor that only shows the shadow, so the plate looks grounded.
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.ShadowMaterial({ opacity: 0.28 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.0005;
  shadowCatcher.receiveShadow = true;
  dish.add(shadowCatcher);

  const cleanup = () => {
    renderer.setAnimationLoop(null);
    pmrem.dispose();
    renderer.dispose();
  };

  let plateWidth = 0;
  let ruler: THREE.Mesh | null = null;
  try {
    const loader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath("/draco/"));
    const gltf = await loader.loadAsync(glbUrl);
    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    // The model is in meters: no scaling, so it is always true to size.
    dish.add(gltf.scene);
    const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
    plateWidth = Math.max(size.x, size.z);
    ruler = makeRuler(plateWidth, renderer.capabilities.getMaxAnisotropy());
    dish.add(ruler);

    await renderer.xr.setSession(session);
  } catch (error) {
    cleanup();
    await session.end().catch(() => {});
    throw error;
  }

  const viewerSpace = await session.requestReferenceSpace("viewer");
  // The default ray points straight out of the middle of the screen.
  const hitSource = await session.requestHitTestSource?.({ space: viewerSpace });
  if (!hitSource) {
    cleanup();
    await session.end().catch(() => {});
    throw new Error("Hit testing is not available");
  }

  let status: FollowArStatus = "searching";
  const setStatus = (next: FollowArStatus) => {
    if (next === status) return;
    status = next;
    onStatus(next);
  };
  onStatus("searching");

  const searchStarted = performance.now();
  let placed = false;
  let onTable = false;
  let wantAnchor = false;
  let anchor: XRAnchor | null = null;
  const target = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const camDir = new THREE.Vector3();
  const tmp = new THREE.Matrix4();
  const tmpQuat = new THREE.Quaternion();
  const up = new THREE.Vector3();

  renderer.setAnimationLoop((time, frame) => {
    const refSpace = renderer.xr.getReferenceSpace();
    const xrCamera = renderer.xr.getCamera();
    camPos.setFromMatrixPosition(xrCamera.matrixWorld);

    if (frame && refSpace) {
      if (!placed) {
        for (const hit of frame.getHitTestResults(hitSource)) {
          const pose = hit.getPose(refSpace);
          if (!pose) continue;
          tmp.fromArray(pose.transform.matrix);
          up.set(0, 1, 0).applyQuaternion(tmpQuat.setFromRotationMatrix(tmp));
          if (up.y < MIN_UP) continue;
          target.setFromMatrixPosition(tmp);
          if (!onTable) {
            // First real table hit: jump there (no slow slide from a guess).
            dish.position.copy(target);
            onTable = true;
          }
          dish.visible = true;
          setStatus("following");
          break;
        }

        if (!onTable && time - searchStarted > SEARCH_TIMEOUT_MS) {
          // Plan B: no table yet. Show the dish (still true size) in front of the
          // phone, roughly where a table would be, and keep looking.
          camDir.set(0, 0, -1).applyQuaternion(xrCamera.quaternion);
          camDir.y = 0;
          camDir.normalize();
          target.copy(camPos).addScaledVector(camDir, 0.45);
          target.y = camPos.y - 0.4;
          if (!dish.visible) dish.position.copy(target);
          dish.visible = true;
          setStatus("estimating");
        }
      }

      // Pin the placed dish with an anchor (created inside a frame, as WebXR requires).
      if (placed && wantAnchor && frame.createAnchor) {
        wantAnchor = false;
        const transform = new XRRigidTransform(
          { x: dish.position.x, y: dish.position.y, z: dish.position.z },
          { x: 0, y: 0, z: 0, w: 1 },
        );
        frame
          .createAnchor(transform, refSpace)
          ?.then((created) => {
            if (placed) anchor = created;
            else created.delete();
          })
          .catch(() => {});
      }
      if (placed && anchor && frame.trackedAnchors?.has(anchor)) {
        const pose = frame.getPose(anchor.anchorSpace, refSpace);
        if (pose) dish.position.setFromMatrixPosition(tmp.fromArray(pose.transform.matrix));
      }
    }

    if (dish.visible && !placed) {
      // Smooth the motion so tracking noise doesn't make the plate jitter.
      dish.position.lerp(target, 0.3);
      // Turn the front of the dish (and the ruler) toward the diner.
      const yaw = Math.atan2(camPos.x - dish.position.x, camPos.z - dish.position.z);
      dish.rotation.y = lerpAngle(dish.rotation.y, yaw, 0.2);
    }

    renderer.render(scene, camera);
  });

  session.addEventListener("end", () => {
    hitSource.cancel();
    anchor?.delete();
    cleanup();
    onStatus("ended");
  });

  return {
    plateWidthCm: Math.round(plateWidth * 1000) / 10,
    setPlaced(value) {
      // Only pin the dish once it is really on the table.
      if (value && !onTable) return;
      placed = value;
      if (value) {
        wantAnchor = true;
        setStatus("placed");
      } else {
        anchor?.delete();
        anchor = null;
        wantAnchor = false;
        target.copy(dish.position);
        setStatus("following");
      }
    },
    setRuler(visible) {
      if (ruler) ruler.visible = visible;
    },
    async end() {
      await session.end().catch(() => {});
    },
  };
}
