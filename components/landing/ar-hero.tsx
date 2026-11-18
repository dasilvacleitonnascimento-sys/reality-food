"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { PlateRuler } from "@/components/measure/plate-ruler";
import { VIEWER_LOOK } from "@/lib/ar/viewer-look";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export type StageDish = { name: string; glbUrl: string; plateCm: number };

type Props = {
  dishes: StageDish[];
  text: {
    scanning: string;
    found: string;
    placed: string;
    loading: string;
    dragHint: string;
  };
};

type Phase = "scanning" | "found" | "placed";

const CYCLE_MS = 7000;
const FADE_MS = 350;
const EASE = [0.2, 0.7, 0.2, 1] as const;

/**
 * Home page hero: a phone camera's view of a table, the way our AR sees it.
 * On load, one sequence: the table grid is scanned, found, then a real 3D dish lands
 * on it and the ruler measures its plate. Dishes then rotate; dragging one stops that.
 */
export function ArHero({ dishes, text }: Props) {
  const still = useReducedMotion();
  const viewerRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<Phase>("scanning");
  const [autoPlay, setAutoPlay] = useState(true);
  const dish = dishes[index];
  const currentUrl = useRef(dish.glbUrl);
  useEffect(() => {
    currentUrl.current = dish.glbUrl;
  }, [dish.glbUrl]);

  // Load model-viewer in the browser only.
  useEffect(() => {
    const globalConfig = window as unknown as { ModelViewerElement?: Record<string, string> };
    globalConfig.ModelViewerElement = { ...globalConfig.ModelViewerElement, dracoDecoderLocation: "/draco/" };
    import("@google/model-viewer").catch(() => {});
  }, []);

  // The scan sequence (skipped with reduced motion).
  useEffect(() => {
    if (still) return;
    const found = setTimeout(() => setPhase((p) => (p === "scanning" ? "found" : p)), 1300);
    return () => clearTimeout(found);
  }, [still]);
  const shownPhase: Phase = still ? "placed" : phase === "found" && visible ? "placed" : phase;

  // Safety net: show the dish even if "load" never fires.
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 6000);
    return () => clearTimeout(t);
  }, [index]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const onLoad = () => {
      const src = (viewer as unknown as { src?: string }).src ?? "";
      if (src === currentUrl.current || src.endsWith(currentUrl.current)) setVisible(true);
    };
    const onCamera = (event: Event) => {
      if ((event as CustomEvent<{ source?: string }>).detail?.source === "user-interaction") setAutoPlay(false);
    };
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("camera-change", onCamera);
    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("camera-change", onCamera);
    };
  }, []);

  // Next dish a while after this one landed.
  useEffect(() => {
    if (shownPhase !== "placed" || !visible || !autoPlay || still || dishes.length < 2) return;
    let swap: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      setVisible(false);
      swap = setTimeout(() => setIndex((i) => (i + 1) % dishes.length), FADE_MS);
    }, CYCLE_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(swap);
    };
  }, [shownPhase, visible, autoPlay, still, dishes.length]);

  // The plate size counts up as the ruler draws.
  const size = useMotionValue(still ? dish.plateCm : 0);
  const sizeText = useTransform(size, (v) => v.toFixed(1));
  const inchText = useTransform(size, (v) => (v / 2.54).toFixed(1));
  useEffect(() => {
    if (shownPhase !== "placed") return;
    if (still) {
      size.set(dish.plateCm);
      return;
    }
    size.set(0);
    const controls = animate(size, dish.plateCm, { duration: 1, delay: 0.35, ease: EASE });
    return () => controls.stop();
  }, [shownPhase, dish.plateCm, still, size, index]);

  const status = shownPhase === "scanning" ? text.scanning : shownPhase === "found" ? text.found : text.placed;
  const placed = shownPhase === "placed";

  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-(--rf-deep) ring-1 ring-(--rf-dark-line)">
        {/* The table plane, as AR detects it: a grid in perspective. */}
        <div aria-hidden className="absolute inset-x-[-35%] bottom-[-8%] h-[78%] [perspective:640px]">
          <div
            className="h-full w-full [transform:rotateX(64deg)] [transform-origin:bottom]"
            style={{
              backgroundImage:
                "linear-gradient(color-mix(in srgb, var(--rf-accent) 22%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--rf-accent) 22%, transparent) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
              maskImage: "linear-gradient(to top, black 25%, transparent 92%)",
            }}
          />
        </div>
        {/* One scan sweep across the table. */}
        {!still && (
          <motion.div
            aria-hidden
            className="absolute inset-x-0 h-24 bg-[linear-gradient(to_bottom,transparent,color-mix(in_srgb,var(--rf-accent)_28%,transparent),transparent)]"
            initial={{ top: "100%", opacity: 0 }}
            animate={{ top: "30%", opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.3, ease: "easeInOut" }}
          />
        )}

        {/* Camera corners */}
        {(
          [
            "left-5 top-5 border-l-2 border-t-2 rounded-tl-xl",
            "right-5 top-5 border-r-2 border-t-2 rounded-tr-xl",
            "left-5 bottom-5 border-l-2 border-b-2 rounded-bl-xl",
            "right-5 bottom-5 border-r-2 border-b-2 rounded-br-xl",
          ] as const
        ).map((pos) => (
          <span key={pos} aria-hidden className={`absolute size-8 border-(--rf-paper)/60 ${pos}`} />
        ))}

        {/* Status */}
        <div className="absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-(--rf-ink)/80 px-3.5 py-1.5 text-xs font-bold text-(--rf-paper) backdrop-blur">
          <span
            aria-hidden
            className={`size-2 rounded-full ${placed ? "bg-(--rf-accent)" : "bg-(--rf-dark-muted)"} ${shownPhase === "scanning" && !still ? "animate-pulse" : ""}`}
          />
          <span>{status}</span>
        </div>

        {/* Placement reticle on the table */}
        <motion.div
          aria-hidden
          className="absolute bottom-[22%] left-1/2 h-[15%] w-[66%] -translate-x-1/2 rounded-[50%] border-2 border-(--rf-accent)/70"
          initial={still ? false : { opacity: 0, scale: 1.25 }}
          animate={shownPhase === "scanning" ? { opacity: 0, scale: 1.25 } : { opacity: placed ? 0.35 : 1, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        />

        {/* The dish, in 3D (drag to turn it) */}
        <model-viewer
          ref={viewerRef}
          src={dish.glbUrl}
          alt={dish.name}
          camera-controls
          disable-zoom
          {...(still ? {} : { "auto-rotate": true })}
          rotation-per-second="18deg"
          camera-orbit="0deg 66deg auto"
          interaction-prompt="none"
          touch-action="pan-y"
          shadow-intensity="1.2"
          {...VIEWER_LOOK}
          exposure="1.05"
          loading="eager"
          className="absolute inset-x-[4%] top-[14%] block aspect-square h-auto w-[92%]"
          style={
            {
              opacity: visible && placed ? 1 : 0,
              transform: visible && placed ? "none" : "translateY(-18px)",
              transition: still ? "none" : `opacity ${FADE_MS + 250}ms ease-out, transform ${FADE_MS + 250}ms ease-out`,
              background: "transparent",
            } as CSSProperties
          }
        >
          <div slot="progress-bar" />
        </model-viewer>
        {placed && !visible && (
          <span
            role="status"
            className="absolute top-[42%] left-1/2 size-10 -translate-x-1/2 animate-spin rounded-full border-4 border-(--rf-accent)/25 border-t-(--rf-accent) motion-reduce:animate-none"
          >
            <span className="sr-only">{text.loading}</span>
          </span>
        )}

        {/* Measurement: ruler + live readout */}
        <div className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-2.5 px-12">
          {placed && <PlateRuler key={`r-${index}`} cm={dish.plateCm} animate={!still} className="text-(--rf-accent)" />}
          <div className="flex items-baseline gap-2 rounded-full bg-(--rf-ink)/80 px-3.5 py-1.5 text-(--rf-paper) backdrop-blur">
            <span className="text-sm font-bold">{dish.name}</span>
            <span className={`text-sm font-bold text-(--rf-accent) tabular-nums transition-opacity duration-300 ${placed ? "" : "opacity-0"}`} aria-hidden>
              Ø <motion.span>{sizeText}</motion.span>&nbsp;cm
            </span>
            <span className={`text-xs text-(--rf-dark-muted) tabular-nums transition-opacity duration-300 ${placed ? "" : "opacity-0"}`} aria-hidden>
              (<motion.span>{inchText}</motion.span>&nbsp;in)
            </span>
            <span className="sr-only">{`${dish.plateCm} cm`}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-(--rf-dark-muted)">{text.dragHint}</p>
    </div>
  );
}
