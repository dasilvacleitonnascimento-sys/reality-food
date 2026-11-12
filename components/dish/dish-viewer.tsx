"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";
import type { FollowArSession, FollowArStatus } from "@/lib/ar/follow-ar";
import { isFollowArSupported } from "@/lib/ar/support";
import type { ViewerText } from "@/lib/i18n/dictionaries";
import { ArGuide } from "./ar-guide";

type Props = {
  glbUrl: string;
  usdzUrl?: string;
  poster: string;
  alt: string;
  text: ViewerText;
};

type ArStatus = "not-presenting" | "session-started" | "object-placed" | "failed";
type ActiveStatus = Exclude<FollowArStatus, "ended">;

const GUIDE_SEEN_KEY = "rf-ar-guide-seen";

function guideSeen() {
  try {
    return localStorage.getItem(GUIDE_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markGuideSeen() {
  try {
    localStorage.setItem(GUIDE_SEEN_KEY, "1");
  } catch {
    // Private mode: the guide just shows again next time.
  }
}

const buttonClass =
  "h-14 rounded-xl bg-(--brand) text-base font-semibold text-white shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-white/70 disabled:opacity-60";

export function DishViewer({ glbUrl, usdzUrl, poster, alt, text }: Props) {
  const viewerRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<FollowArSession | null>(null);
  const followModuleRef = useRef<typeof import("@/lib/ar/follow-ar") | null>(null);
  const [progress, setProgress] = useState(0);
  const [nativeArSupported, setNativeArSupported] = useState<boolean | null>(null);
  const [followSupported, setFollowSupported] = useState<boolean | null>(null);
  const [followStatus, setFollowStatus] = useState<ActiveStatus | null>(null);
  const [rulerOn, setRulerOn] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [arFailed, setArFailed] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    // Self-hosted Draco decoder (models are Draco-compressed). Must be set before model-viewer loads.
    const globalConfig = window as unknown as { ModelViewerElement?: Record<string, string> };
    globalConfig.ModelViewerElement = { ...globalConfig.ModelViewerElement, dracoDecoderLocation: "/draco/" };
    // model-viewer touches `window`, so it is loaded only in the browser, only on this page.
    import("@google/model-viewer").catch(() => setLoadFailed(true));

    let cancelled = false;
    isFollowArSupported().then((supported) => {
      if (cancelled) return;
      setFollowSupported(supported);
      // Warm up three.js so the AR view opens right away when the diner taps.
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
      setNativeArSupported(viewer.canActivateAR);
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

  const canFollow = followSupported === true;

  /** Opens the camera. Must run inside a tap (browsers require a user gesture). */
  const openAr = async () => {
    setShowGuide(false);
    setArFailed(false);
    if (!canFollow) {
      // iPhone (AR Quick Look) and Android without WebXR (Scene Viewer).
      (viewerRef.current as ModelViewerElement | null)?.activateAR();
      return;
    }
    const overlay = overlayRef.current;
    if (!overlay) return;
    try {
      // Usually preloaded, so requestSession runs right inside this tap.
      const { startFollowAr } = followModuleRef.current ?? (await import("@/lib/ar/follow-ar"));
      setRulerOn(false);
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

  const onViewTap = () => {
    if (guideSeen()) {
      void openAr();
    } else {
      setShowGuide(true);
    }
  };

  const onGuideOpen = () => {
    markGuideSeen();
    void openAr();
  };

  const toggleRuler = () => {
    const next = !rulerOn;
    setRulerOn(next);
    sessionRef.current?.setRuler(next);
  };

  const isLoading = progress < 1 && !loadFailed;
  const canAr = canFollow || nativeArSupported === true;
  const onTable = followStatus === "following" || followStatus === "placed";

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
        // h-auto: model-viewer sets height: 150px by default, which would beat aspect-square.
        className="relative block aspect-square h-auto w-full bg-muted"
      >
        {isLoading && (
          <div
            role="progressbar"
            aria-label={text.loading3d}
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

        {canAr && (
          <button type="button" onClick={onViewTap} className={`absolute inset-x-4 bottom-4 ${buttonClass}`}>
            {text.viewOnTable}
          </button>
        )}
      </model-viewer>

      <div className="px-4 pt-3 text-sm text-muted-foreground" aria-live="polite">
        {loadFailed ? (
          <p>{text.loadFailed}</p>
        ) : arFailed ? (
          <p>{text.arFailed}</p>
        ) : nativeArSupported === false && followSupported === false ? (
          <p>{text.notSupported}</p>
        ) : canAr ? (
          <p>{text.tapHint}</p>
        ) : null}
      </div>

      {showGuide && <ArGuide text={text.guide} onOpen={onGuideOpen} onCancel={() => setShowGuide(false)} />}

      {/* Shown on top of the camera during follow AR (WebXR DOM overlay). */}
      <div
        ref={overlayRef}
        className={followStatus ? "fixed inset-0 z-50 flex flex-col justify-between p-4 text-white" : "hidden"}
      >
        {followStatus && (
          <>
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold">{text.trueSize}</span>
              <button
                type="button"
                onClick={() => sessionRef.current?.end()}
                className="size-11 shrink-0 rounded-full bg-black/60 text-xl font-semibold outline-none focus-visible:ring-4 focus-visible:ring-white/70"
                aria-label={text.close}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center gap-3">
              <p className="max-w-xs rounded-xl bg-black/60 px-4 py-2 text-center text-sm" aria-live="polite">
                {text.hints[followStatus]}
              </p>
              {(onTable || followStatus === "estimating") && (
                <div className="flex w-full max-w-sm gap-2">
                  <button
                    type="button"
                    onClick={toggleRuler}
                    aria-pressed={rulerOn}
                    className={`h-14 shrink-0 rounded-xl px-4 text-base font-semibold outline-none focus-visible:ring-4 focus-visible:ring-white/70 ${
                      rulerOn ? "bg-white text-black" : "bg-black/60 text-white"
                    }`}
                  >
                    {text.ruler}
                  </button>
                  <button
                    type="button"
                    disabled={!onTable}
                    onClick={() => sessionRef.current?.setPlaced(followStatus === "following")}
                    className={`flex-1 ${buttonClass}`}
                  >
                    {followStatus === "placed" ? text.moveDish : text.placeHere}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
