// "Follow" AR mode (WebXR, Chrome on Android).
// The dish sits on the table exactly where the center of the screen points,
// at true size, and slides along as the phone moves. "Place" freezes it in
// place so the diner can walk around it or compare it with their hand.
//
// This module pulls in three.js, so only import it dynamically.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type FollowArStatus = "loading" | "searching" | "following" | "placed" | "ended";

export type FollowArSession = {
  setPlaced(placed: boolean): void;
  end(): Promise<void>;
};

type Options = {
  glbUrl: string;
  /** Element shown on top of the camera view (buttons, hints). */
  overlay: HTMLElement;
  onStatus: (status: FollowArStatus) => void;
};

const MIN_UP = 0.85; // only accept roughly horizontal surfaces (tables, not walls)

function lerpAngle(a: number, b: number, t: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + d * t;
}

/** Must be called directly from a tap handler (browsers require a user gesture). */
export async function startFollowAr({ glbUrl, overlay, onStatus }: Options): Promise<FollowArSession> {
  const xr = navigator.xr;
  if (!xr) throw new Error("WebXR is not available");

  // Request the session first, while we still have the user gesture.
  const session = await xr.requestSession("immersive-ar", {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay"],
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
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.9),
    new THREE.ShadowMaterial({ opacity: 0.28 }),
  );
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.0005;
  shadowCatcher.receiveShadow = true;
  dish.add(shadowCatcher);

  const cleanup = () => {
    renderer.setAnimationLoop(null);
    pmrem.dispose();
    renderer.dispose();
  };

  try {
    const gltf = await new GLTFLoader().loadAsync(glbUrl);
    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    // The model is in meters: no scaling, so it is always true to size.
    dish.add(gltf.scene);

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

  onStatus("searching");

  let placed = false;
  let found = false;
  const target = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const hitMatrix = new THREE.Matrix4();
  const hitQuat = new THREE.Quaternion();
  const up = new THREE.Vector3();

  renderer.setAnimationLoop((_time, frame) => {
    const refSpace = renderer.xr.getReferenceSpace();
    if (frame && refSpace && !placed) {
      for (const hit of frame.getHitTestResults(hitSource)) {
        const pose = hit.getPose(refSpace);
        if (!pose) continue;
        hitMatrix.fromArray(pose.transform.matrix);
        hitQuat.setFromRotationMatrix(hitMatrix);
        up.set(0, 1, 0).applyQuaternion(hitQuat);
        if (up.y < MIN_UP) continue;
        target.setFromMatrixPosition(hitMatrix);
        if (!found) {
          found = true;
          dish.position.copy(target);
          dish.visible = true;
          onStatus("following");
        }
        break;
      }
    }

    if (found && !placed) {
      // Smooth the motion so tracking noise doesn't make the plate jitter.
      dish.position.lerp(target, 0.3);
      // Turn the front of the dish toward the diner.
      camPos.setFromMatrixPosition(renderer.xr.getCamera().matrixWorld);
      const yaw = Math.atan2(camPos.x - dish.position.x, camPos.z - dish.position.z);
      dish.rotation.y = lerpAngle(dish.rotation.y, yaw, 0.2);
    }

    renderer.render(scene, camera);
  });

  session.addEventListener("end", () => {
    hitSource.cancel();
    cleanup();
    onStatus("ended");
  });

  return {
    setPlaced(value) {
      if (!found) return;
      placed = value;
      if (!value) target.copy(dish.position);
      onStatus(value ? "placed" : "following");
    },
    async end() {
      await session.end().catch(() => {});
    },
  };
}
