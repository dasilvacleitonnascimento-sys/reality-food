"use client";

import { useEffect, useLayoutEffect, type RefObject } from "react";
import { useMotionValue, type MotionValue } from "motion/react";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Scroll progress (0 -> 1) through a tall section: 0 when its top meets the top
 * of the screen, 1 when its bottom meets the bottom. Read with requestAnimationFrame
 * and passive listeners, so scrolling never waits on React.
 * (Pattern adapted from 21st.dev "Phone Scroll Hero" by ruixen.ui.)
 */
export function useSectionProgress(ref: RefObject<HTMLElement | null>, enabled = true): MotionValue<number> {
  const progress = useMotionValue(0);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      progress.set(Math.min(1, Math.max(0, -rect.top / travel)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled, progress, ref]);

  return progress;
}
