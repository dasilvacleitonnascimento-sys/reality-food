"use client";

import { useEffect, useRef } from "react";
import type { ViewerText } from "@/lib/i18n/dictionaries";

type Props = {
  text: ViewerText["guide"];
  onOpen: () => void;
  onCancel: () => void;
};

/** One-time tips before the camera opens, so diners don't get stuck on "Move iPhone to start". */
export function ArGuide({ text, onOpen, onCancel }: Props) {
  const openRef = useRef<HTMLButtonElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef(onCancel);

  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);

  // Focus the main action once when the guide opens.
  useEffect(() => {
    openRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelRef.current();
      // Keep keyboard focus inside the dialog (it has two buttons).
      if (e.key === "Tab") {
        const first = openRef.current;
        const last = cancelButtonRef.current;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center overscroll-contain bg-(--rf-deep)/70 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
      // Tapping outside the card closes it, like Escape.
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ar-guide-title"
        className="w-full max-w-sm rounded-2xl bg-background p-6 text-foreground shadow-xl"
      >
        {/* A phone sweeping slowly over a table. */}
        <div className="relative mx-auto mb-5 h-24 w-48" aria-hidden>
          <div className="absolute inset-x-0 bottom-2 h-3 rounded-full bg-muted" />
          <div className="ar-guide-phone absolute bottom-6 left-1/2 h-14 w-8 -translate-x-1/2 rounded-md border-2 border-foreground bg-background">
            <div className="mx-auto mt-1 h-1 w-3 rounded-full bg-foreground/40" />
          </div>
        </div>

        <h2 id="ar-guide-title" className="rf-serif text-2xl">
          {text.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{text.body}</p>
        <ul className="mt-4 space-y-2 text-sm">
          {text.tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-(--brand)" aria-hidden />
              {tip}
            </li>
          ))}
        </ul>

        <button
          ref={openRef}
          type="button"
          onClick={onOpen}
          className="mt-6 h-14 w-full rounded-xl bg-(--brand) text-base font-semibold text-(--brand-foreground) outline-none transition-[filter] hover:brightness-105 active:brightness-95 focus-visible:ring-4 focus-visible:ring-ring/50"
        >
          {text.open}
        </button>
        <button
          type="button"
          onClick={onCancel}
          ref={cancelButtonRef}
          className="mt-2 h-11 w-full rounded-xl text-sm font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {text.cancel}
        </button>
      </div>
    </div>
  );
}
