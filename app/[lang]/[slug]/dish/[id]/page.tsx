import type { Metadata } from "next";
import { Suspense, type CSSProperties } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { BackButton } from "@/components/dish/back-button";
import { DishViewer } from "@/components/dish/dish-viewer";
import { LanguageSwitch } from "@/components/menu/language-switch";
import { DishSkeleton } from "@/components/menu/skeletons";
import { Badge } from "@/components/ui/badge";
import { getDish, getRestaurant, getRestaurants } from "@/lib/demo-data";
import { formatLength, formatPlateSize, formatPrice } from "@/lib/format";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary, getViewerText } from "@/lib/i18n/dictionaries";

export function generateStaticParams() {
  return getRestaurants().flatMap((r) => r.dishes.map((d) => ({ slug: r.slug, id: d.id })));
}

export async function generateMetadata(props: PageProps<"/[lang]/[slug]/dish/[id]">): Promise<Metadata> {
  const { lang, slug, id } = await props.params;
  if (!isLocale(lang)) return {};
  const restaurant = getRestaurant(slug, lang);
  const dish = restaurant && getDish(restaurant, id);
  if (!restaurant || !dish) return {};
  return {
    title: `${dish.name} | ${restaurant.name}`,
    description: dish.description,
  };
}

// The page shell renders instantly; the dish streams in (Next 16 instant navigation).
export default function DishPage(props: PageProps<"/[lang]/[slug]/dish/[id]">) {
  return (
    <Suspense fallback={<DishSkeleton />}>
      <Dish params={props.params} />
    </Suspense>
  );
}

async function Dish({ params }: { params: PageProps<"/[lang]/[slug]/dish/[id]">["params"] }) {
  const { lang, slug, id } = await params;
  if (!isLocale(lang)) notFound();
  const restaurant = getRestaurant(slug, lang);
  const dish = restaurant && getDish(restaurant, id);
  if (!restaurant || !dish) notFound();
  const t = getDictionary(lang);
  const plateSize = formatPlateSize(dish.plateDiameterCm);

  // Start downloading the 3D model with the HTML, before model-viewer's JS arrives.
  if (dish.glbUrl) preload(dish.glbUrl, { as: "fetch", crossOrigin: "anonymous" });

  return (
    <main
      className="mx-auto w-full max-w-xl pb-16"
      style={{ "--brand": restaurant.primaryColor } as CSSProperties}
    >
      <div className="flex items-center justify-between px-2 py-2">
        <BackButton fallbackHref={`/${restaurant.slug}`} label={t.dish.back} />
        <LanguageSwitch current={lang} label={t.menu.language} />
      </div>

      {dish.glbUrl ? (
        <DishViewer
          glbUrl={dish.glbUrl}
          usdzUrl={dish.usdzUrl}
          poster={dish.photo}
          alt={t.dish.model3d(dish.name)}
          text={getViewerText(lang, plateSize)}
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
            {!dish.isAvailable && <Badge variant="destructive">{t.menu.soldOut}</Badge>}
            {dish.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <p className="mt-3 text-muted-foreground">{dish.description}</p>
        {dish.portionCm && (
          <p className="mt-4 text-sm font-medium">
            {t.dish.portion(
              formatLength(dish.portionCm.width),
              formatLength(dish.portionCm.depth),
              formatLength(dish.portionCm.height),
            )}
          </p>
        )}
        <p className={dish.portionCm ? "mt-1 text-sm" : "mt-4 text-sm"}>{t.dish.servedOn(plateSize)}</p>
      </article>
    </main>
  );
}
