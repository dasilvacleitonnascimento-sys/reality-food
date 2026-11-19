"use client";

// The dish's 3D model as diners will see it, plus "View on table" so it can be
// checked in AR from the admin on a phone. Loads model-viewer only on this page.

import { useEffect } from "react";
import { VIEWER_LOOK } from "@/lib/ar/viewer-look";

type Props = { glbUrl: string; usdzUrl?: string; poster?: string; alt: string };

export function ModelPreview({ glbUrl, usdzUrl, poster, alt }: Props) {
  useEffect(() => {
    const globalConfig = window as unknown as { ModelViewerElement?: Record<string, string> };
    globalConfig.ModelViewerElement = { ...globalConfig.ModelViewerElement, dracoDecoderLocation: "/draco/" };
    import("@google/model-viewer").catch(() => {});
  }, []);

  return (
    <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-muted">
      <model-viewer
        src={glbUrl}
        {...(usdzUrl ? { "ios-src": usdzUrl } : {})}
        {...(poster ? { poster } : {})}
        alt={alt}
        camera-controls
        camera-orbit="0deg 60deg auto"
        touch-action="pan-y"
        shadow-intensity="1"
        {...VIEWER_LOOK}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="fixed"
        style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
      >
        <button
          slot="ar-button"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl bg-(--rf-ink) px-4 py-2.5 text-sm font-bold text-(--rf-paper) outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          View on table
        </button>
      </model-viewer>
    </div>
  );
}
