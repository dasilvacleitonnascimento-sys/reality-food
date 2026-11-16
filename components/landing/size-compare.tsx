"use client";

import { useState } from "react";

export type CompareDish = { id: string; name: string; plateCm: number };

type Props = {
  dishes: CompareDish[];
  text: { pick: string; phone: string; plate: string };
};

// Everything below is drawn to the same scale: the box is SCENE_CM wide.
const SCENE_CM = 46; // the box is 46 x 38 cm
const PHONE_CM = { w: 7.15, h: 14.67 }; // a typical 6.1" phone
const pct = (cm: number) => `${(cm / SCENE_CM) * 100}%`;

/** Interactive "how big is it?" demo: a plate next to a phone, to scale. */
export function SizeCompare({ dishes, text }: Props) {
  const [selected, setSelected] = useState(dishes[0]);

  return (
    <div>
      <div role="group" aria-label={text.pick} className="flex flex-wrap gap-2">
        {dishes.map((dish) => {
          const active = dish.id === selected.id;
          return (
            <button
              key={dish.id}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(dish)}
              className={`h-11 rounded-full border px-4 text-sm font-bold outline-none transition-colors focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50 ${
                active
                  ? "border-(--rf-accent) bg-(--rf-accent) text-(--rf-ink)"
                  : "border-white/15 text-(--rf-paper) hover:border-(--rf-accent)"
              }`}
            >
              {dish.name}
            </button>
          );
        })}
      </div>

      <div className="relative mt-8 aspect-[46/38] w-full overflow-hidden rounded-3xl border border-white/10 bg-(--rf-panel)">
        {/* 1 cm grid, so the scale is visible */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(var(--rf-paper) 1px, transparent 1px), linear-gradient(90deg, var(--rf-paper) 1px, transparent 1px)",
            backgroundSize: `${100 / SCENE_CM}% ${100 / 38}%`,
          }}
          aria-hidden
        />

        {/* Plate */}
        <div
          className="absolute top-1/2 left-[34%] -translate-x-1/2 -translate-y-1/2"
          style={{
            width: pct(selected.plateCm),
            transition: "width 0.7s cubic-bezier(0.2,0.7,0.2,1)",
          }}
        >
          <div className="relative grid aspect-square place-items-center rounded-full bg-(--rf-paper) shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-[13%] rounded-full border-2 border-(--rf-ink)/10 bg-[radial-gradient(circle_at_40%_35%,#fff,var(--rf-paper))]" />
            <p className="relative px-[18%] text-center text-[clamp(10px,2.4vw,16px)] leading-tight font-bold text-(--rf-ink)">
              {selected.name}
            </p>
          </div>
          {/* Ruler under the plate */}
          <div className="mt-[6%] flex flex-col items-center gap-1">
            <div className="relative h-2.5 w-full border-x-2 border-(--rf-accent)">
              <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-(--rf-accent)" />
            </div>
            <span
              className="text-xs font-bold text-(--rf-accent) sm:text-sm"
              aria-live="polite"
            >
              {selected.plateCm} cm {text.plate} ·{" "}
              {(selected.plateCm / 2.54).toFixed(1)} in
            </span>
          </div>
        </div>

        {/* Phone, same scale */}
        <div
          className="absolute top-1/2 left-[80%] -translate-x-1/2 -translate-y-1/2"
          style={{ width: pct(PHONE_CM.w) }}
        >
          <div className="aspect-[7.15/14.67] rounded-[18%/9%] border-[3px] border-(--rf-paper)/80 bg-(--rf-ink) p-[6%]">
            <div className="h-full rounded-[14%/7%] bg-[linear-gradient(160deg,var(--rf-accent),var(--rf-accent-text))] opacity-80" />
          </div>
          <p className="mt-2 text-center text-[11px] leading-tight text-(--rf-paper)/75 sm:text-xs">
            {text.phone}
          </p>
        </div>
      </div>
    </div>
  );
}
