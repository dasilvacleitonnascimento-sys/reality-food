"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";

type Props = {
  glbUrl: string;
  usdzUrl?: string;
  poster: string;
  alt: string;
};

type ArStatus = "not-presenting" | "session-started" | "object-placed" | "failed";

export function DishViewer({ glbUrl, usdzUrl, poster, alt }: Props) {
  const viewerRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [arFailed, setArFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    // model-viewer touches `window`, so it is loaded only in the browser, only on this page.
    import("@google/model-viewer").catch(() => setLoadFailed(true));

    const viewer = viewerRef.current as ModelViewerElement | null;
    if (!viewer) return;

    const onProgress = (event: Event) => {
      const { totalProgress } = (event as CustomEvent<{ totalProgress: number }>)
        .detail;
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
      viewer.removeEventListener("progress", onProgress);
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("ar-status", onArStatus);
    };
  }, []);

  const isLoading = progress < 1 && !loadFailed;

  return (
    <div>
      <model-viewer
        ref={viewerRef}
        src={glbUrl}
        ios-src={usdzUrl}
        poster={poster}
        alt={alt}
        ar
        ar-modes="webxr scene-viewer quick-look"
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

        {/* model-viewer only shows this slot when the device supports AR. */}
        <button
          slot="ar-button"
          type="button"
          className="absolute inset-x-4 bottom-4 h-14 rounded-xl bg-(--brand) text-base font-semibold text-white shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-white/70"
        >
          View on your table
        </button>
      </model-viewer>

      <div className="px-4 pt-3 text-sm text-muted-foreground" aria-live="polite">
        {loadFailed ? (
          <p>The 3D model could not be loaded. Please check your connection.</p>
        ) : arFailed ? (
          <p>
            AR could not start on this device. You can still rotate the dish
            above with your finger.
          </p>
        ) : arSupported === false ? (
          <p>
            Open this page on your phone to see the dish on your table. Here
            you can drag to rotate it.
          </p>
        ) : arSupported ? (
          <p>Point your camera at the table and move your phone slowly.</p>
        ) : null}
      </div>
    </div>
  );
}
