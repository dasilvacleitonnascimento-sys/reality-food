"use client";

import { useEffect } from "react";

type Props = { glbUrl: string; poster: string; alt: string };

/** A dish slowly turning in 3D at the top of a restaurant's website. */
export function HeroDish({ glbUrl, poster, alt }: Props) {
  useEffect(() => {
    // Self-hosted Draco decoder, same as the dish page.
    const globalConfig = window as unknown as {
      ModelViewerElement?: Record<string, string>;
    };
    globalConfig.ModelViewerElement = {
      ...globalConfig.ModelViewerElement,
      dracoDecoderLocation: "/draco/",
    };
    import("@google/model-viewer").catch(() => {
      // The poster image stays visible.
    });
  }, []);

  return (
    <model-viewer
      src={glbUrl}
      poster={poster}
      alt={alt}
      camera-controls
      disable-zoom
      auto-rotate
      rotation-per-second="18deg"
      camera-orbit="0deg 58deg auto"
      interaction-prompt="none"
      touch-action="pan-y"
      shadow-intensity="1"
      loading="eager"
      // h-auto: model-viewer sets height: 150px by default, which would beat aspect-square.
      className="block aspect-square h-auto w-full overflow-hidden rounded-3xl bg-transparent"
    >
      {/* Hides model-viewer's default grey loading bar; the poster shows while it loads. */}
      <div slot="progress-bar" />
    </model-viewer>
  );
}
