import Image from "next/image";
import { Ruler } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Dish } from "@/lib/demo-data";
import { formatPrice } from "@/lib/format";

type Props = {
  dish: Dish;
  href: string;
  soldOutLabel: string;
  /** e.g. "28 cm plate", "16 oz glass" */
  sizeLabel?: string;
  preloadPhoto?: boolean;
};

export function DishCard({
  dish,
  href,
  soldOutLabel,
  sizeLabel,
  preloadPhoto = false,
}: Props) {
  const has3d = Boolean(dish.glbUrl);

  return (
    <Link
      href={href}
      className="group -mx-2 flex gap-4 rounded-xl px-2 py-4 outline-none transition-colors hover:bg-card active:bg-card focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="min-w-0 flex-1">
        <h3 className={cn("rf-serif text-[1.0625rem] leading-snug break-words", !dish.isAvailable && "text-muted-foreground")}>
          {dish.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {dish.description}
        </p>
        {sizeLabel && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-(--brand-text)">
            <Ruler className="size-3.5" aria-hidden />
            {sizeLabel}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className={cn("mr-1 font-bold tabular-nums", !dish.isAvailable && "text-muted-foreground line-through")}>
            {formatPrice(dish.price)}
          </span>
          {!dish.isAvailable && (
            <Badge variant="destructive">{soldOutLabel}</Badge>
          )}
          {dish.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* No photo yet (dish not scanned): a text-only card, like a printed menu. */}
      {dish.photo && (
        <div className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-muted">
          <Image
            src={dish.photo}
            alt={dish.name}
            fill
            sizes="112px"
            preload={preloadPhoto}
            // Sold out: only the photo fades, so the text keeps full contrast.
            className={cn("object-cover", !dish.isAvailable && "opacity-50 grayscale")}
          />
          {has3d && dish.isAvailable && (
            <span className="absolute top-1.5 left-1.5 rounded-md bg-(--rf-accent) px-1.5 py-0.5 text-xs font-bold text-(--rf-ink)">
              3D
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
