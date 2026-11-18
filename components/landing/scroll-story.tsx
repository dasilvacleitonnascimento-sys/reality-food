"use client";

import Image from "next/image";
import { useRef, useState, type ReactNode } from "react";
import { motion, useMotionValue, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { PlateRuler } from "@/components/measure/plate-ruler";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useSectionProgress } from "./use-section-progress";

export type StoryDish = { name: string; price: string; photo: string; size: string; has3d: boolean };

type Props = {
  title: string;
  steps: readonly { title: string; body: string }[];
  restaurant: string;
  dishes: StoryDish[];
  /** QR code SVG markup (server-made) for the table card. */
  qrSvg: string;
  ar: { photo: string; plateCm: number; label: string };
  text: { scanHint: string; tableCard: string; trueSize: string; tabs: readonly [string, string] };
};

/** Which step a scroll position belongs to. */
const stepOf = (v: number) => (v < 0.34 ? 0 : v < 0.67 ? 1 : 2);

/**
 * "How it works" as one pinned scene: the phone scans the table's QR code, the menu
 * opens, and the dish lands on the table at true size. Scroll drives it.
 * Reduced motion: the three screens side by side, still.
 */
export function ScrollStory(props: Props) {
  const still = useReducedMotion();
  return still ? <StillStory {...props} /> : <PinnedStory {...props} />;
}

function PinnedStory({ title, steps, restaurant, dishes, qrSvg, ar, text }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useSectionProgress(sectionRef);
  const [step, setStep] = useState(0);
  useMotionValueEvent(progress, "change", (v) => setStep(stepOf(v)));

  const rotateX = useTransform(progress, [0, 0.18], [18, 0]);
  const scale = useTransform(progress, [0, 0.18], [0.9, 1]);

  return (
    <section ref={sectionRef} aria-labelledby="how-heading" id="how" className="relative h-[320vh] scroll-mt-0 bg-(--rf-paper)">
      {/* pt-16: room for the sticky site header, so the title is never under it. */}
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden pt-16">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-6 px-4 sm:px-6 md:grid-cols-[1fr_auto] md:gap-16">
          <div>
            <h2 id="how-heading" className="rf-serif text-3xl leading-[1.08] sm:text-5xl">
              {title}
            </h2>
            {/* Phones: only the current step. Larger screens: all three, current one lit. */}
            <ol className="mt-6 grid md:mt-10 md:gap-7">
              {steps.map((s, i) => (
                <li
                  key={s.title}
                  aria-current={i === step ? "step" : undefined}
                  className={`col-start-1 row-start-1 flex gap-4 transition-opacity duration-500 md:row-start-auto ${
                    i === step ? "opacity-100" : "pointer-events-none opacity-0 md:pointer-events-auto md:opacity-35"
                  }`}
                >
                  <span className="rf-serif w-8 shrink-0 text-4xl leading-none text-(--rf-accent-text) tabular-nums" aria-hidden>
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    <p className="mt-1 max-w-sm leading-relaxed text-(--rf-muted)">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            {/* Step progress */}
            <div aria-hidden className="mt-6 flex gap-1.5 md:mt-10">
              {steps.map((s, i) => (
                <span key={s.title} className="h-1 w-10 overflow-hidden rounded-full bg-(--rf-line)">
                  <span className={`block h-full bg-(--rf-accent-text) transition-transform duration-500 origin-left ${i <= step ? "scale-x-100" : "scale-x-0"}`} />
                </span>
              ))}
            </div>
          </div>

          <div className="[perspective:1200px]">
            <motion.div style={{ rotateX, scale }} className="mx-auto">
              <Phone>
                <Screen shown={step === 0}>
                  <ScanScreen progress={progress} animated qrSvg={qrSvg} text={text} />
                </Screen>
                <Screen shown={step === 1}>
                  <MenuScreen restaurant={restaurant} dishes={dishes} tabs={text.tabs} />
                </Screen>
                <Screen shown={step === 2}>
                  <ArScreen progress={progress} animated ar={ar} text={text} />
                </Screen>
              </Phone>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StillStory({ title, steps, restaurant, dishes, qrSvg, ar, text }: Props) {
  // Everything at its end state.
  const done = useMotionValue(1);
  const screens = [
    <ScanScreen key="scan" progress={done} animated={false} qrSvg={qrSvg} text={text} />,
    <MenuScreen key="menu" restaurant={restaurant} dishes={dishes} tabs={text.tabs} />,
    <ArScreen key="ar" progress={done} animated={false} ar={ar} text={text} />,
  ];
  return (
    <section aria-labelledby="how-heading" id="how" className="scroll-mt-20 bg-(--rf-paper) py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="how-heading" className="rf-serif text-3xl leading-[1.08] sm:text-5xl">
          {title}
        </h2>
        <ol className="mt-12 grid gap-12 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Phone small>{screens[i]}</Phone>
              <h3 className="mt-6 text-xl font-bold">
                <span className="text-(--rf-accent-text)">{i + 1}. </span>
                {s.title}
              </h3>
              <p className="mt-1 leading-relaxed text-(--rf-muted)">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// --- Phone and its screens ---------------------------------------------------------

function Phone({ children, small = false }: { children: ReactNode; small?: boolean }) {
  return (
    <div className={`relative mx-auto ${small ? "w-[13rem]" : "w-[min(15.5rem,58vw)] sm:w-[17rem]"}`}>
      <div className="aspect-[9/19.5] rounded-[2.6rem] bg-(--rf-ink) p-[0.4rem] shadow-[0_40px_70px_-30px_var(--rf-ink)] ring-1 ring-(--rf-dark-line)">
        <div className="relative h-full w-full overflow-hidden rounded-[2.2rem] bg-(--rf-deep)">
          <div aria-hidden className="absolute top-2 left-1/2 z-20 h-[1.1rem] w-[4.4rem] -translate-x-1/2 rounded-full bg-(--rf-ink)" />
          {children}
        </div>
      </div>
    </div>
  );
}

function Screen({ shown, children }: { shown: boolean; children: ReactNode }) {
  return (
    <div aria-hidden={!shown} className={`absolute inset-0 transition-opacity duration-500 ${shown ? "opacity-100" : "opacity-0"}`}>
      {children}
    </div>
  );
}

const Corners = ({ inset = "inset-[16%]" }: { inset?: string }) => (
  <div aria-hidden className={`pointer-events-none absolute ${inset}`}>
    {["left-0 top-0 border-l-2 border-t-2 rounded-tl-lg", "right-0 top-0 border-r-2 border-t-2 rounded-tr-lg", "left-0 bottom-0 border-l-2 border-b-2 rounded-bl-lg", "right-0 bottom-0 border-r-2 border-b-2 rounded-br-lg"].map((c) => (
      <span key={c} className={`absolute size-6 border-(--rf-accent) ${c}`} />
    ))}
  </div>
);

/** 1. The camera sees the table card's QR code; a scan line sweeps it. */
type ScreenProps = { progress: MotionValue<number>; animated: boolean; text: Props["text"] };

function ScanScreen({ progress, animated, qrSvg, text }: ScreenProps & { qrSvg: string }) {
  const scanY = useTransform(progress, [0.02, 0.3], ["0%", "100%"]);
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_50%_60%,var(--rf-panel),var(--rf-deep))] px-6">
      <div className="relative w-full max-w-[11rem] rounded-xl bg-(--rf-card) p-3 text-(--rf-ink) shadow-[0_20px_40px_-15px_var(--rf-deep)]">
        <div className="relative aspect-square text-(--rf-ink) [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <p className="mt-2 text-center text-[0.6rem] leading-tight font-bold">{text.tableCard}</p>
        {animated && (
          <motion.div aria-hidden style={{ top: scanY }} className="absolute inset-x-1 h-0.5 rounded-full bg-(--rf-accent) shadow-[0_0_14px_3px_var(--rf-accent)]" />
        )}
      </div>
      <Corners inset="inset-x-[12%] inset-y-[26%]" />
      <p className="absolute bottom-8 rounded-full bg-(--rf-ink)/80 px-3 py-1 text-[0.65rem] font-bold text-(--rf-paper)">{text.scanHint}</p>
    </div>
  );
}

/** 2. Our real menu, in miniature. */
function MenuScreen({ restaurant, dishes, tabs }: { restaurant: string; dishes: StoryDish[]; tabs: readonly [string, string] }) {
  return (
    <div className="h-full bg-(--rf-ink) px-3 pt-9 text-(--rf-paper)">
      <p className="rf-serif text-lg">{restaurant}</p>
      <div className="mt-2 flex gap-1.5">
        <span className="rounded-full bg-(--rf-accent) px-2.5 py-1 text-[0.6rem] font-bold text-(--rf-ink)">{tabs[0]}</span>
        <span className="rounded-full bg-(--rf-dark-muted-bg) px-2.5 py-1 text-[0.6rem]">{tabs[1]}</span>
      </div>
      <ul className="mt-2 divide-y divide-(--rf-dark-line)">
        {dishes.map((d, i) => (
          <li key={d.name} className={`flex items-center gap-2 py-2.5 ${i === dishes.length - 1 ? "rounded-lg bg-(--rf-panel) px-1.5 ring-1 ring-(--rf-accent)" : ""}`}>
            <div className="min-w-0 flex-1">
              <p className="rf-serif truncate text-[0.72rem]">{d.name}</p>
              <p className="text-[0.55rem] text-(--rf-accent)">{d.size}</p>
              <p className="text-[0.62rem] font-bold tabular-nums">{d.price}</p>
            </div>
            <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-(--rf-dark-muted-bg)">
              <Image src={d.photo} alt="" fill sizes="44px" className="object-cover" />
              {d.has3d && <span className="absolute top-0.5 left-0.5 rounded-sm bg-(--rf-accent) px-1 text-[0.45rem] font-bold text-(--rf-ink)">3D</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 3. The dish on the table at true size, measured. */
function ArScreen({ progress, animated, ar, text }: ScreenProps & { ar: Props["ar"] }) {
  const y = useTransform(progress, [0.67, 0.8], [-40, 0]);
  const opacity = useTransform(progress, [0.67, 0.76], [0, 1]);
  const ruler = useTransform(progress, [0.78, 0.92], [0, 1]);
  return (
    <div className="relative h-full">
      <motion.div style={animated ? { y, opacity } : undefined} className="absolute inset-0">
        <Image src={ar.photo} alt="" fill sizes="280px" className="scale-110 object-cover" />
      </motion.div>
      <Corners inset="inset-x-[8%] inset-y-[14%]" />
      <p className="absolute top-12 left-1/2 -translate-x-1/2 rounded-full bg-(--rf-ink)/80 px-3 py-1 text-[0.62rem] font-bold whitespace-nowrap text-(--rf-paper)">{text.trueSize}</p>
      <div className="absolute inset-x-[16%] bottom-[16%] flex flex-col items-center gap-1.5">
        <motion.div style={animated ? { scaleX: ruler } : undefined} className="w-full origin-left">
          <PlateRuler cm={ar.plateCm} className="h-2.5 text-(--rf-accent)" />
        </motion.div>
        <span className="rounded-full bg-(--rf-accent) px-2.5 py-0.5 text-[0.65rem] font-bold text-(--rf-ink) tabular-nums">{ar.label}</span>
      </div>
    </div>
  );
}
