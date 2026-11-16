"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from "react";
import { Check, Languages, Smartphone } from "lucide-react";

export type StageDish = { name: string; glbUrl: string; plateCm: number };

type Props = {
  dishes: StageDish[];
  text: {
    trueSize: string;
    plate: string;
    loading: string;
    chips: [string, string, string];
  };
};

const CYCLE_MS = 7000;
const FADE_MS = 350;

/**
 * Hero visual: a phone "camera" finding the table, then real 3D dishes from the
 * demo menu appearing one after another at their real size.
 */
export function HeroStage({ dishes, text }: Props) {
  const viewerRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
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

  // Next dish CYCLE_MS after the current one is on screen (not with reduced motion).
  useEffect(() => {
    if (!visible || dishes.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let swap: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      setVisible(false);
      swap = setTimeout(() => setIndex((i) => (i + 1) % dishes.length), FADE_MS);
    }, CYCLE_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(swap);
    };
  }, [visible, dishes.length]);

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((event.clientY - box.top) / box.height - 0.5) * -8,
      y: ((event.clientX - box.left) / box.width - 0.5) * 10,
    });
  }

  const chipIcons = [Check, Smartphone, Languages];
  const chipPlaces = [
    "-left-2 top-[18%] sm:-left-10",
    "-right-2 top-[44%] sm:-right-12",
    "-left-1 bottom-[16%] sm:-left-8",
  ];

  return (
    <div
      className="rf-rise relative mx-auto w-full max-w-[320px] [perspective:1200px]"
      style={{ animationDelay: "300ms" }}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div
        className="relative rounded-[46px] bg-black p-3 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-out"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
      >
        <div className="relative aspect-[9/17] overflow-hidden rounded-[36px] bg-(--rf-ink)">
          {/* The table, as the camera sees it: an AR grid of dots in perspective. */}
          <div className="absolute inset-x-[-40%] bottom-[-10%] h-[130%] [transform:perspective(500px)_rotateX(62deg)] [transform-origin:bottom]">
            <div
              className="rf-dots absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "radial-gradient(circle, var(--rf-accent) 2px, transparent 2.4px)",
                backgroundSize: "22px 22px",
                maskImage:
                  "linear-gradient(to top, black 30%, transparent 95%)",
              }}
            />
          </div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,transparent_30%,rgba(0,0,0,0.65))]" />

          {/* Scanning line */}
          <div className="rf-scan absolute inset-x-6 h-0.5 rounded-full bg-(--rf-accent) shadow-[0_0_18px_4px_var(--rf-accent)]" />

          {/* AR corners */}
          {(
            [
              "left-4 top-16 border-l-4 border-t-4 rounded-tl-2xl",
              "right-4 top-16 border-r-4 border-t-4 rounded-tr-2xl",
              "left-4 bottom-24 border-l-4 border-b-4 rounded-bl-2xl",
              "right-4 bottom-24 border-r-4 border-b-4 rounded-br-2xl",
            ] as const
          ).map((pos, i) => (
            <span
              key={pos}
              className={`rf-pulse absolute size-10 border-(--rf-accent) ${pos}`}
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}

          {/* The dish, in 3D */}
          <model-viewer
            ref={viewerRef}
            src={dish.glbUrl}
            alt={dish.name}
            auto-rotate
            rotation-per-second="24deg"
            camera-orbit="0deg 64deg auto"
            interaction-prompt="none"
            shadow-intensity="1.2"
            exposure="1.05"
            loading="eager"
            className="absolute inset-x-0 top-[22%] block aspect-square h-auto w-full transition-opacity"
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
              className="absolute top-[44%] left-1/2 size-10 -translate-x-1/2 animate-spin rounded-full border-4 border-(--rf-accent)/25 border-t-(--rf-accent)"
            >
              <span className="sr-only">{text.loading}</span>
            </span>
          )}

          {/* Ruler + size label, replayed for every dish */}
          <div
            key={index}
            className="absolute inset-x-0 bottom-7 flex flex-col items-center gap-3 px-8"
          >
            <div className="rf-ruler relative h-3 w-full border-x-[3px] border-(--rf-accent)">
              <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 bg-(--rf-accent)" />
            </div>
            <span className="rf-pop rounded-full bg-(--rf-accent) px-3 py-1.5 text-xs font-bold text-(--rf-ink)">
              {text.trueSize} · {dish.plateCm} cm {text.plate}
            </span>
          </div>
          <p
            key={`n${index}`}
            className="rf-pop absolute inset-x-0 top-7 text-center text-sm font-bold text-(--rf-paper)"
            style={{ animationDelay: "200ms" }}
          >
            {dish.name}
          </p>
        </div>
      </div>

      {/* Floating feature chips */}
      {text.chips.map((chip, i) => {
        const Icon = chipIcons[i];
        return (
          <span
            key={chip}
            className={`rf-float absolute z-10 hidden items-center gap-1.5 rounded-full border border-white/10 bg-(--rf-panel)/90 px-3 py-2 text-xs font-bold text-(--rf-paper) shadow-xl backdrop-blur min-[400px]:inline-flex ${chipPlaces[i]}`}
            style={{ animationDelay: `${i * 0.8}s` }}
          >
            <Icon className="size-4 text-(--rf-accent)" aria-hidden />
            {chip}
          </span>
        );
      })}
    </div>
  );
}
