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
  "touch-action"?: "pan-y" | "pan-x" | "none";
  "shadow-intensity"?: string;
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
