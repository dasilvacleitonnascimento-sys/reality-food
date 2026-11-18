"use client";

import { useEffect, useRef, useState } from "react";
import { Ruler } from "lucide-react";
import { PlateRuler } from "@/components/measure/plate-ruler";
import { VIEWER_LOOK } from "@/lib/ar/viewer-look";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export type ShowcaseDish = { id: string; name: string; glbUrl: string; sizeLabel: string; plateCm: number };

type Props = {
  dishes: ShowcaseDish[];
  text: { pick: string; dragHint: string; loading: string };
};

const CYCLE_MS = 8000;
const FADE_MS = 350;

/**
 * The restaurant's dishes in 3D, big and centered, one after another.
 * Diners can pick a dish or drag to turn it; auto-play stops once they do.
 */
export function DishShowcase({ dishes, text }: Props) {
  const viewerRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  // Reduced motion: no auto-rotate and no auto-play.
  const still = useReducedMotion();
  const dish = dishes[index];
  const currentUrl = useRef(dish.glbUrl);
  useEffect(() => {
    currentUrl.current = dish.glbUrl;
  }, [dish.glbUrl]);

  // Safety net: show the dish after a few seconds even if "load" never arrives.
  useEffect(() => {
    const fallback = setTimeout(() => setVisible(true), 6000);
    return () => clearTimeout(fallback);
  }, [index]);

  useEffect(() => {
    const globalConfig = window as unknown as { ModelViewerElement?: Record<string, string> };
    globalConfig.ModelViewerElement = { ...globalConfig.ModelViewerElement, dracoDecoderLocation: "/draco/" };
    import("@google/model-viewer").catch(() => {});
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    // Ignore a late "load" from the previous dish.
    const onLoad = () => {
      const src = (viewer as unknown as { src?: string }).src ?? "";
      if (src === currentUrl.current || src.endsWith(currentUrl.current)) setVisible(true);
    };
    // Dragging the dish counts as "I'm looking at this one".
    const onInteract = (event: Event) => {
      if ((event as CustomEvent<{ source?: string }>).detail?.source === "user-interaction") setAutoPlay(false);
    };
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("camera-change", onInteract);
    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("camera-change", onInteract);
    };
  }, []);

  // Next dish CYCLE_MS after the current one is on screen (slow phones never skip a dish).
  useEffect(() => {
    if (!visible || !autoPlay || still || dishes.length < 2) return;
    let swap: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      setVisible(false);
      swap = setTimeout(() => setIndex((i) => (i + 1) % dishes.length), FADE_MS);
    }, CYCLE_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(swap);
    };
  }, [visible, autoPlay, still, dishes.length]);

  function pick(i: number) {
    setAutoPlay(false);
    if (i === index) return;
    setVisible(false);
    setTimeout(() => setIndex(i), FADE_MS);
  }

  return (
    <div className="relative">
      <div className="relative mx-auto aspect-square w-full max-w-[560px]">
        {/* Warm light on the table under the dish */}
        <div aria-hidden className="absolute inset-x-[18%] bottom-[16%] h-[16%] rounded-[50%] bg-(--rf-accent) opacity-15 blur-3xl" />

        <model-viewer
          ref={viewerRef}
          src={dish.glbUrl}
          alt={dish.name}
          camera-controls
          disable-zoom
          {...(still ? {} : { "auto-rotate": true })}
          rotation-per-second="20deg"
          camera-orbit="0deg 60deg auto"
          interaction-prompt="none"
          touch-action="pan-y"
          shadow-intensity="1.2"
          {...VIEWER_LOOK}
          exposure="1.05"
          loading="eager"
          className="relative block aspect-square h-auto w-full bg-transparent transition-[opacity,transform] ease-out"
          style={{ opacity: visible ? 1 : 0, transitionDuration: `${FADE_MS + 250}ms` }}
        >
          <div slot="progress-bar" />
        </model-viewer>
        {!visible && (
          <span role="status" className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-4 border-(--rf-accent)/20 border-t-(--rf-accent)">
            <span className="sr-only">{text.loading}</span>
          </span>
        )}

      </div>

      {/* The one moment on this page: a ruler draws the plate's width, then the size appears. Replayed per dish. */}
      <div key={dish.id} className="mx-auto -mt-4 flex max-w-[340px] flex-col items-center gap-2.5 px-6">
        <PlateRuler cm={dish.plateCm} animate className="text-(--rf-accent)" />
        <span className="rf-pop inline-flex items-center gap-1.5 rounded-full bg-(--rf-accent) px-3.5 py-1.5 text-sm font-bold text-(--rf-ink)" style={{ animationDelay: "1.4s" }}>
          <Ruler className="size-4" aria-hidden />
          {dish.sizeLabel}
        </span>
      </div>

      <p className="rf-serif mt-3 text-center text-xl" aria-live="polite">
        {dish.name}
      </p>
      <p className="mt-0.5 text-center text-sm text-muted-foreground">{text.dragHint}</p>

      <div role="group" aria-label={text.pick} className="mt-5 flex flex-wrap justify-center gap-2">
        {dishes.map((d, i) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={i === index}
            onClick={() => pick(i)}
            className={`relative h-10 overflow-hidden rounded-full border px-4 text-sm font-bold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50 ${
              i === index ? "border-(--rf-accent) bg-(--rf-accent) text-(--rf-ink)" : "border-border hover:border-(--rf-accent)"
            }`}
          >
            {d.name}
            {/* Auto-play countdown */}
            {i === index && autoPlay && !still && visible && (
              <span key={`bar-${index}`} aria-hidden className="rf-countdown absolute inset-x-0 bottom-0 h-0.5 bg-(--rf-ink)/40" style={{ animationDuration: `${CYCLE_MS}ms` }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
