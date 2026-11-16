"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PlateRuler } from "@/components/measure/plate-ruler";
import { useReducedMotion } from "@/lib/use-reduced-motion";

export type StageDish = { name: string; glbUrl: string; plateCm: number };

type Props = {
  dishes: StageDish[];
  text: {
    trueSize: string;
    plate: string;
    loading: string;
  };
};

const CYCLE_MS = 7000;
const FADE_MS = 350;

/**
 * Hero visual: a phone camera looking at the table, with real 3D dishes from the
 * demo menu appearing one after another. For each dish, a ruler measures the plate:
 * the one animated moment on the landing page.
 */
export function HeroStage({ dishes, text }: Props) {
  const viewerRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  // Reduced motion: one dish, standing still.
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
    const globalConfig = window as unknown as {
      ModelViewerElement?: Record<string, string>;
    };
    globalConfig.ModelViewerElement = {
      ...globalConfig.ModelViewerElement,
      dracoDecoderLocation: "/draco/",
    };
    import("@google/model-viewer").catch(() => {});
  }, []);

  // Fade in once each model has loaded.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    // Ignore a late "load" from the previous dish.
    const onLoad = () => {
      const src = (viewer as unknown as { src?: string }).src ?? "";
      if (src === currentUrl.current || src.endsWith(currentUrl.current)) setVisible(true);
    };
    viewer.addEventListener("load", onLoad);
    return () => viewer.removeEventListener("load", onLoad);
  }, []);

  // Next dish CYCLE_MS after the current one is on screen.
  useEffect(() => {
    if (!visible || still || dishes.length < 2) return;
    let swap: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      setVisible(false);
      swap = setTimeout(() => setIndex((i) => (i + 1) % dishes.length), FADE_MS);
    }, CYCLE_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(swap);
    };
  }, [visible, still, dishes.length]);

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <div className="relative rounded-[46px] bg-(--rf-deep) p-3 shadow-[0_40px_80px_-30px_var(--rf-deep)] ring-1 ring-(--rf-dark-line)">
        <div className="relative aspect-[9/17] overflow-hidden rounded-[36px] bg-(--rf-ink)">
          {/* The table, as the camera sees it: an AR grid of dots in perspective. */}
          <div className="absolute inset-x-[-40%] bottom-[-10%] h-[130%] [transform:perspective(500px)_rotateX(62deg)] [transform-origin:bottom]">
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "radial-gradient(circle, var(--rf-accent) 1.6px, transparent 2px)",
                backgroundSize: "22px 22px",
                maskImage:
                  "linear-gradient(to top, black 30%, transparent 95%)",
              }}
            />
          </div>

          {/* AR corners: the camera has found the table */}
          {(
            [
              "left-4 top-16 border-l-[3px] border-t-[3px] rounded-tl-2xl",
              "right-4 top-16 border-r-[3px] border-t-[3px] rounded-tr-2xl",
              "left-4 bottom-28 border-l-[3px] border-b-[3px] rounded-bl-2xl",
              "right-4 bottom-28 border-r-[3px] border-b-[3px] rounded-br-2xl",
            ] as const
          ).map((pos) => (
            <span
              key={pos}
              aria-hidden
              className={`absolute size-9 border-(--rf-accent)/70 ${pos}`}
            />
          ))}

          {/* The dish, in 3D */}
          <model-viewer
            ref={viewerRef}
            src={dish.glbUrl}
            alt={dish.name}
            {...(still ? {} : { "auto-rotate": true })}
            rotation-per-second="24deg"
            camera-orbit="0deg 64deg auto"
            interaction-prompt="none"
            shadow-intensity="1.2"
            exposure="1.05"
            loading="eager"
            className="absolute inset-x-0 top-[20%] block aspect-square h-auto w-full transition-opacity"
            style={
              {
                opacity: visible ? 1 : 0,
                transitionDuration: `${FADE_MS}ms`,
                background: "transparent",
              } as CSSProperties
            }
          >
            <div slot="progress-bar" />
          </model-viewer>
          {!visible && (
            <span
              role="status"
              className="absolute top-[44%] left-1/2 size-10 -translate-x-1/2 animate-spin rounded-full border-4 border-(--rf-accent)/25 border-t-(--rf-accent) motion-reduce:animate-none"
            >
              <span className="sr-only">{text.loading}</span>
            </span>
          )}

          <p className="rf-serif absolute inset-x-0 top-7 px-6 text-center text-base text-(--rf-paper)">
            {dish.name}
          </p>

          {/* Ruler + size, replayed for every dish */}
          <div
            key={index}
            className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 px-9"
          >
            <PlateRuler cm={dish.plateCm} animate className="text-(--rf-accent)" />
            <span className="rf-pop rounded-full bg-(--rf-accent) px-3 py-1.5 text-xs font-bold text-(--rf-ink) tabular-nums">
              {text.trueSize}: {dish.plateCm}&nbsp;cm {text.plate}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
