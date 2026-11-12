// Tiny check kept separate from follow-ar.ts so three.js only loads when needed.

/** True when the browser can run our own WebXR AR session (Chrome on Android over HTTPS). */
export async function isFollowArSupported(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.xr) return false;
  try {
    return await navigator.xr.isSessionSupported("immersive-ar");
  } catch {
    return false;
  }
}
