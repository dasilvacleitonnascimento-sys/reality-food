import type { DetailedHTMLProps, HTMLAttributes } from "react";

// JSX typing for the <model-viewer> web component (only the attributes we use).
type ModelViewerAttributes = DetailedHTMLProps<
  HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  src?: string;
  "ios-src"?: string;
  poster?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "ar-scale"?: "auto" | "fixed";
  "camera-controls"?: boolean;
  "camera-orbit"?: string;
  "disable-zoom"?: boolean;
  "auto-rotate"?: boolean;
  "rotation-per-second"?: string;
  "interaction-prompt"?: "auto" | "none";
  exposure?: string;
  "touch-action"?: "pan-y" | "pan-x" | "none";
  "shadow-intensity"?: string;
  "shadow-softness"?: string;
  "environment-image"?: string;
  "tone-mapping"?: "auto" | "aces" | "agx" | "neutral" | "commerce" | "linear" | "reinhard" | "cineon";
  loading?: "auto" | "lazy" | "eager";
  reveal?: "auto" | "manual";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": ModelViewerAttributes;
    }
  }
}
