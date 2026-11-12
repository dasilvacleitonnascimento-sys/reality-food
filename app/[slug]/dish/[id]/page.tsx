import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/dish/back-button";
import { DishViewer } from "@/components/dish/dish-viewer";
import { Badge } from "@/components/ui/badge";
import { getDish, getRestaurant, getRestaurants } from "@/lib/demo-data";
import { formatPlateSize, formatPrice } from "@/lib/format";

export function generateStaticParams() {
  return getRestaurants().flatMap((r) =>
    r.dishes.map((d) => ({ slug: r.slug, id: d.id })),
  );
}

export async function generateMetadata(
  props: PageProps<"/[slug]/dish/[id]">,
): Promise<Metadata> {
  const { slug, id } = await props.params;
  const restaurant = getRestaurant(slug);
  const dish = restaurant && getDish(restaurant, id);
  if (!restaurant || !dish) return {};
  return {
    title: `${dish.name} | ${restaurant.name}`,
    description: dish.description,
  };
}

export default async function DishPage(props: PageProps<"/[slug]/dish/[id]">) {
  const { slug, id } = await props.params;
  const restaurant = getRestaurant(slug);
  const dish = restaurant && getDish(restaurant, id);
  if (!restaurant || !dish) notFound();

  return (
    <main
      className="mx-auto w-full max-w-xl pb-16"
      style={{ "--brand": restaurant.primaryColor } as CSSProperties}
    >
      <div className="px-2 py-2">
        <BackButton fallbackHref={`/${restaurant.slug}`} />
      </div>

      {dish.glbUrl ? (
        <DishViewer
          glbUrl={dish.glbUrl}
          usdzUrl={dish.usdzUrl}
          poster={dish.photo}
          alt={`3D model of ${dish.name}`}
          plateDiameterCm={dish.plateDiameterCm}
        />
      ) : (
        <div className="relative aspect-4/3 w-full bg-muted">
          <Image
            src={dish.photo}
            alt={dish.name}
            fill
            sizes="(max-width: 576px) 100vw, 576px"
            preload
            className="object-cover"
          />
        </div>
      )}

      <article className="px-4 pt-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">{dish.name}</h1>
          <p className="pt-1 text-lg font-semibold">{formatPrice(dish.price)}</p>
        </div>

        {(dish.tags.length > 0 || !dish.isAvailable) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {!dish.isAvailable && <Badge variant="destructive">Sold out</Badge>}
            {dish.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <p className="mt-3 text-muted-foreground">{dish.description}</p>
        <p className="mt-4 text-sm">
          Served on a {formatPlateSize(dish.plateDiameterCm)} plate
        </p>
      </article>
    </main>
  );
}
