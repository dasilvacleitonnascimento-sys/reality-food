"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";
import type { FollowArSession, FollowArStatus } from "@/lib/ar/follow-ar";
import { isFollowArSupported } from "@/lib/ar/support";
import { formatPlateSize } from "@/lib/format";

type Props = {
  glbUrl: string;
  usdzUrl?: string;
  poster: string;
  alt: string;
  plateDiameterCm: number;
};

type ArStatus = "not-presenting" | "session-started" | "object-placed" | "failed";

const HINTS: Record<FollowArStatus, string> = {
  loading: "Loading the dish…",
  searching: "Point your camera at the table and move your phone slowly.",
  following: "The dish follows your camera. Tap Place to set it down.",
  placed: "Set down at true size. Walk around it or hold your hand next to it.",
  ended: "",
};

export function DishViewer({ glbUrl, usdzUrl, poster, alt, plateDiameterCm }: Props) {
  const viewerRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<FollowArSession | null>(null);
  const followModuleRef = useRef<typeof import("@/lib/ar/follow-ar") | null>(null);
  const [progress, setProgress] = useState(0);
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [followSupported, setFollowSupported] = useState<boolean | null>(null);
  const [followStatus, setFollowStatus] = useState<FollowArStatus | null>(null);
  const [arFailed, setArFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    // model-viewer touches `window`, so it is loaded only in the browser, only on this page.
    import("@google/model-viewer").catch(() => setLoadFailed(true));

    let cancelled = false;
    isFollowArSupported().then((supported) => {
      if (cancelled) return;
      setFollowSupported(supported);
      // Warm up three.js so the AR view opens fast when the diner taps.
      if (supported) {
        import("@/lib/ar/follow-ar")
          .then((mod) => {
            followModuleRef.current = mod;
          })
          .catch(() => {});
      }
    });

    const viewer = viewerRef.current as ModelViewerElement | null;
    if (!viewer) return;

    const onProgress = (event: Event) => {
      const { totalProgress } = (event as CustomEvent<{ totalProgress: number }>).detail;
      setProgress(totalProgress);
    };
    const onLoad = () => {
      setProgress(1);
      setArSupported(viewer.canActivateAR);
    };
    const onError = () => setLoadFailed(true);
    const onArStatus = (event: Event) => {
      const { status } = (event as CustomEvent<{ status: ArStatus }>).detail;
      if (status === "failed") setArFailed(true);
      if (status === "session-started") setArFailed(false);
    };

    viewer.addEventListener("progress", onProgress);
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    viewer.addEventListener("ar-status", onArStatus);
    return () => {
      cancelled = true;
      viewer.removeEventListener("progress", onProgress);
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("ar-status", onArStatus);
      sessionRef.current?.end();
    };
  }, []);

  const startFollow = async () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    setArFailed(false);
    try {
      // Usually preloaded, so requestSession runs right inside this tap.
      const { startFollowAr } = followModuleRef.current ?? (await import("@/lib/ar/follow-ar"));
      sessionRef.current = await startFollowAr({
        glbUrl,
        overlay,
        onStatus: (status) => setFollowStatus(status === "ended" ? null : status),
      });
    } catch {
      setFollowStatus(null);
      setArFailed(true);
    }
  };

  const isLoading = progress < 1 && !loadFailed;
  const canFollow = followSupported === true;
  const inFollow = followStatus !== null;
  const canAr = canFollow || arSupported === true;

  return (
    <div>
      <model-viewer
        ref={viewerRef}
        src={glbUrl}
        ios-src={usdzUrl}
        poster={poster}
        alt={alt}
        // On Android with WebXR we run our own "follow the camera" AR instead.
        ar={!canFollow}
        ar-modes="scene-viewer quick-look"
        ar-scale="fixed"
        camera-controls
        touch-action="pan-y"
        shadow-intensity="1"
        className="relative block aspect-square w-full bg-muted"
      >
        {isLoading && (
          <div
            role="progressbar"
            aria-label="Loading 3D model"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            className="absolute inset-x-0 top-0 h-1 bg-black/10"
          >
            <div
              className="h-full bg-(--brand) transition-[width] duration-200"
              style={{ width: `${Math.max(progress, 0.05) * 100}%` }}
            />
          </div>
        )}

        {canFollow ? (
          <button
            type="button"
            onClick={startFollow}
            className="absolute inset-x-4 bottom-4 h-14 rounded-xl bg-(--brand) text-base font-semibold text-white shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-white/70"
          >
            View on your table
          </button>
        ) : (
          // model-viewer only shows this slot when the device supports AR (iOS Quick Look, Scene Viewer).
          <button
            slot="ar-button"
            type="button"
            className="absolute inset-x-4 bottom-4 h-14 rounded-xl bg-(--brand) text-base font-semibold text-white shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-white/70"
          >
            View on your table
          </button>
        )}
      </model-viewer>

      <div className="px-4 pt-3 text-sm text-muted-foreground" aria-live="polite">
        {loadFailed ? (
          <p>The 3D model could not be loaded. Please check your connection.</p>
        ) : arFailed ? (
          <p>AR could not start on this device. You can still rotate the dish above with your finger.</p>
        ) : arSupported === false && followSupported === false ? (
          <p>Open this page on your phone to see the dish on your table. Here you can drag to rotate it.</p>
        ) : canAr ? (
          <p>Tap the button, then point your camera at the table.</p>
        ) : null}
      </div>

      {/* Shown on top of the camera during follow AR (WebXR DOM overlay). */}
      <div
        ref={overlayRef}
        className={inFollow ? "fixed inset-0 z-50 flex flex-col justify-between p-4 text-white" : "hidden"}
      >
        {inFollow && (
          <>
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold">
                True size · {formatPlateSize(plateDiameterCm)} plate
              </span>
              <button
                type="button"
                onClick={() => sessionRef.current?.end()}
                className="size-11 rounded-full bg-black/60 text-xl font-semibold outline-none focus-visible:ring-4 focus-visible:ring-white/70"
                aria-label="Close AR"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <p className="max-w-xs rounded-xl bg-black/60 px-4 py-2 text-center text-sm">
                {HINTS[followStatus]}
              </p>
              {(followStatus === "following" || followStatus === "placed") && (
                <button
                  type="button"
                  onClick={() => sessionRef.current?.setPlaced(followStatus === "following")}
                  className="h-14 w-full max-w-sm rounded-xl bg-(--brand) text-base font-semibold text-white shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-white/70"
                >
                  {followStatus === "following" ? "Place here" : "Move dish"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
