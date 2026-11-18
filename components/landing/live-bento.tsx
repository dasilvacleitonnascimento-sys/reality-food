"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { Check, Smartphone } from "lucide-react";
import { PlateRuler } from "@/components/measure/plate-ruler";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type Lang = "en" | "es";

export type BentoText = {
  title: string;
  bilingual: { title: string; body: string };
  trueSize: { title: string; body: string };
  fast: { title: string; body: string; loading: string; ready: string };
};

type Props = {
  text: BentoText;
  /** One dish in both languages, for the bilingual demo. */
  bilingual: Record<Lang, { name: string; description: string }>;
  dish: { photo: string; name: string; price: number; plateCm: number };
};

const EASE = [0.2, 0.7, 0.2, 1] as const;

/** A card whose border lights up where the pointer is (mouse only). */
function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const box = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--x", `${e.clientX - box.left}px`);
    ref.current.style.setProperty("--y", `${e.clientY - box.top}px`);
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={`group relative overflow-hidden rounded-2xl bg-(--rf-dark-line) p-px ${className}`}
    >
      {/* Gold rim that follows the mouse */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(260px circle at var(--x, 50%) var(--y, 50%), var(--rf-accent), transparent 70%)" }}
      />
      <div className="relative h-full rounded-[calc(1rem-1px)] bg-(--rf-panel) p-6">{children}</div>
    </div>
  );
}

function CardTitle({ title, body }: { title: string; body: string }) {
  return (
    <>
      <h3 className="text-lg font-bold text-(--rf-paper)">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-(--rf-dark-muted)">{body}</p>
    </>
  );
}

export function LiveBento({ text, bilingual, dish }: Props) {
  return (
    <section aria-labelledby="bento-heading" className="bg-(--rf-ink) text-(--rf-paper)">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 id="bento-heading" className="rf-serif max-w-2xl text-3xl leading-[1.08] sm:text-5xl">
          {text.title}
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <BilingualDemo text={text.bilingual} dishes={bilingual} />
          </Card>
          <Card>
            <FastDemo text={text.fast} />
          </Card>
          <Card className="md:col-span-3">
            <TrueSizeDemo text={text.trueSize} dish={dish} />
          </Card>
        </div>
      </div>
    </section>
  );
}

// --- Demos -----------------------------------------------------------------------------

/** EN <-> ES: switches by itself while on screen, or with the buttons. */
function BilingualDemo({ text, dishes }: { text: BentoText["bilingual"]; dishes: Props["bilingual"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.6 });
  const still = useReducedMotion();
  const [lang, setLang] = useState<Lang>("en");
  const [auto, setAuto] = useState(true);
  useEffect(() => {
    if (!inView || !auto || still) return;
    const t = setInterval(() => setLang((l) => (l === "en" ? "es" : "en")), 2600);
    return () => clearInterval(t);
  }, [inView, auto, still]);
  const d = dishes[lang];
  return (
    <div ref={ref} className="grid h-full gap-6 sm:grid-cols-[1fr_1.1fr] sm:items-center">
      <div>
        <CardTitle {...text} />
        <div role="group" aria-label="EN / ES" className="mt-4 inline-flex rounded-full bg-(--rf-dark-muted-bg) p-1">
          {(["en", "es"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => {
                setAuto(false);
                setLang(l);
              }}
              className={`h-9 min-w-11 rounded-full px-3 text-sm font-bold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-(--rf-accent)/50 ${
                lang === l ? "bg-(--rf-accent) text-(--rf-ink)" : "text-(--rf-dark-muted) hover:text-(--rf-paper)"
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-(--rf-ink) p-4 ring-1 ring-(--rf-dark-line)" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={lang}
            lang={lang}
            initial={still ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={still ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <p className="rf-serif text-xl">{d.name}</p>
            <p className="mt-1 line-clamp-2 text-sm text-(--rf-dark-muted)">{d.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function TrueSizeDemo({ text, dish }: { text: BentoText["trueSize"]; dish: Props["dish"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const still = useReducedMotion();
  const drawn = inView || still;
  return (
    <div ref={ref} className="flex h-full flex-col">
      <CardTitle {...text} />
      <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-xl md:aspect-[3/1]">
        <Image src={dish.photo} alt="" fill sizes="(min-width: 1152px) 1100px, 95vw" className="object-cover" />
        <span className="absolute top-2 left-2 rounded-md bg-(--rf-accent) px-1.5 py-0.5 text-xs font-bold text-(--rf-ink)">3D</span>
        {/* The plate spans 20%-79% of the photo width at any card size (object-cover only crops top and bottom), so the ruler measures exactly the plate. */}
        <div className="absolute right-[21%] bottom-3 left-[20%] flex flex-col items-center gap-1.5">
          <motion.div className="w-full origin-left" initial={{ scaleX: still ? 1 : 0 }} animate={{ scaleX: drawn ? 1 : 0 }} transition={{ duration: 1, ease: EASE }}>
            <PlateRuler cm={dish.plateCm} className="h-2.5 text-(--rf-accent)" />
          </motion.div>
          <span className="rounded-full bg-(--rf-ink)/85 px-2.5 py-0.5 text-xs font-bold text-(--rf-accent) tabular-nums">Ø {dish.plateCm}&nbsp;cm</span>
        </div>
      </div>
    </div>
  );
}

function FastDemo({ text }: { text: BentoText["fast"] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const still = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setReady(true), still ? 0 : 1700);
    return () => clearTimeout(t);
  }, [inView, still]);
  return (
    <div ref={ref} className="flex h-full flex-col">
      <CardTitle title={text.title} body={text.body} />
      <div className="mt-auto pt-6">
        <div className="flex items-center gap-2 text-sm font-bold">
          {ready ? <Check className="size-4 text-(--rf-accent)" aria-hidden /> : <Smartphone className="size-4 text-(--rf-dark-muted)" aria-hidden />}
          <span aria-live="polite">{ready ? text.ready : text.loading}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-(--rf-dark-muted-bg)">
          <motion.div
            className="h-full origin-left rounded-full bg-(--rf-accent)"
            initial={{ scaleX: still ? 1 : 0 }}
            animate={{ scaleX: inView ? 1 : 0 }}
            transition={{ duration: still ? 0 : 1.6, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
