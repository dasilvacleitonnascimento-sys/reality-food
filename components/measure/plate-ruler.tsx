import { cn } from "@/lib/utils";

type Props = {
  /** Length the ruler measures, in cm (usually the plate diameter). */
  cm: number;
  className?: string;
  /** Draws itself from left to right once (skipped with reduced motion). */
  animate?: boolean;
};

/**
 * Reality Food's measuring cue: a ruler with a tick every centimeter and a taller
 * one every 5 cm. Purely visual: always pair it with the size in text.
 */
export function PlateRuler({ cm, className, animate = false }: Props) {
  const whole = Math.floor(cm);
  const ticks = Array.from({ length: whole + 1 }, (_, i) => i);

  return (
    <svg
      viewBox={`0 0 ${cm} 10`}
      preserveAspectRatio="none"
      aria-hidden
      className={cn("block h-3 w-full overflow-visible text-(--brand-text)", animate && "rf-ruler", className)}
    >
      <g stroke="currentColor" vectorEffect="non-scaling-stroke" strokeLinecap="square">
        <line x1="0" y1="0.5" x2={cm} y2="0.5" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {ticks.map((i) => (
          <line
            key={i}
            x1={i}
            x2={i}
            y1="0.5"
            y2={i === 0 ? 10 : i % 5 === 0 ? 7 : 4}
            strokeWidth={i % 5 === 0 ? 2 : 1}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line x1={cm} x2={cm} y1="0.5" y2="10" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
