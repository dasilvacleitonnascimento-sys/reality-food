import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Dish } from "@/lib/demo-data";
import { formatPrice } from "@/lib/format";

type Props = {
  dish: Dish;
  href: string;
  preloadPhoto?: boolean;
};

export function DishCard({ dish, href, preloadPhoto = false }: Props) {
  const has3d = Boolean(dish.glbUrl);

  return (
    <Link
      href={href}
      className={cn(
        "flex gap-4 rounded-xl py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        !dish.isAvailable && "opacity-60 grayscale",
      )}
    >
      <div className="min-w-0 flex-1">
        <h3 className="font-medium leading-snug">{dish.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {dish.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 font-semibold">{formatPrice(dish.price)}</span>
          {!dish.isAvailable && <Badge variant="destructive">Sold out</Badge>}
          {dish.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="relative size-28 shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image
          src={dish.photo}
          alt={dish.name}
          fill
          sizes="112px"
          preload={preloadPhoto}
          className="object-cover"
        />
        {has3d && (
          <span className="absolute top-1.5 left-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-white">
            3D
          </span>
        )}
      </div>
    </Link>
  );
}
