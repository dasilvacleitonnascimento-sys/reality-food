import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import { BackButton } from "@/components/dish/back-button";
import { DishViewer } from "@/components/dish/dish-viewer";
import { LanguageSwitch } from "@/components/menu/language-switch";
import { PoweredBy } from "@/components/menu/powered-by";
import { PlateRuler } from "@/components/measure/plate-ruler";
import { Ruler } from "lucide-react";
import { DishSkeleton } from "@/components/menu/skeletons";
import { Badge } from "@/components/ui/badge";
import { getDish } from "@/lib/demo-data";
import { getDishParams, getMenu } from "@/lib/menu";
import { getPreview } from "@/lib/previews";
import { formatLength, formatPlateSize, formatPrice } from "@/lib/format";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary, getViewerText } from "@/lib/i18n/dictionaries";

export async function generateStaticParams() {
  return getDishParams();
}

export async function generateMetadata(props: PageProps<"/[lang]/[slug]/dish/[id]">): Promise<Metadata> {
  const { lang, slug, id } = await props.params;
  if (!isLocale(lang)) return {};
  const restaurant = await getMenu(slug, lang);
  const dish = restaurant && getDish(restaurant, id);
  if (!restaurant || !dish) return {};
  return {
    title: `${dish.name} | ${restaurant.name}`,
    ...(getPreview(slug) ? { robots: { index: false, follow: false } } : {}),
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
  const restaurant = await getMenu(slug, lang);
  const dish = restaurant && getDish(restaurant, id);
  if (!restaurant || !dish) notFound();
  const t = getDictionary(lang);
  const plateSize = formatPlateSize(dish.plateDiameterCm);

  // Start downloading the 3D model with the HTML, before model-viewer's JS arrives.
  if (dish.glbUrl) preload(dish.glbUrl, { as: "fetch", crossOrigin: "anonymous" });

  return (
    <main id="main" className="mx-auto w-full max-w-xl pb-16">
      <div className="flex items-center justify-between px-2 py-2">
        <BackButton fallbackHref={`/${lang}/${restaurant.slug}`} label={t.dish.back} />
        <LanguageSwitch current={lang} label={t.menu.language} />
      </div>

      {dish.glbUrl ? (
        <DishViewer
          glbUrl={dish.glbUrl}
          usdzUrl={dish.usdzUrl}
          poster={dish.photo}
          alt={t.dish.model3d(dish.name)}
          text={getViewerText(lang, t.dish.sizeShort(dish.servedIn?.kind ?? "plate", plateSize, dish.servedIn?.oz))}
        />
      ) : dish.photo ? (
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
      ) : null}

      <article className="px-4 pt-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="rf-serif min-w-0 text-[1.75rem] leading-tight break-words">{dish.name}</h1>
          <p className="shrink-0 pt-1 text-lg font-bold tabular-nums">{formatPrice(dish.price)}</p>
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

        <p className="mt-3 leading-relaxed text-muted-foreground">{dish.description}</p>
        <section aria-labelledby="size-heading" className="mt-6 rounded-2xl border border-border bg-card p-4">
          <h2 id="size-heading" className="flex items-center gap-2 text-sm font-bold text-(--brand-text)">
            <Ruler className="size-4 shrink-0" aria-hidden />
            {t.dish.sizeHeading}
          </h2>
          {/* The plate's width as a ruler, so "28 cm" reads as a length, not just a number. */}
          <div className="mt-4">
            <PlateRuler cm={dish.plateDiameterCm} />
            <div className="mt-1.5 flex justify-between text-xs font-medium text-muted-foreground tabular-nums" aria-hidden>
              <span>0</span>
              <span>{dish.plateDiameterCm} cm</span>
            </div>
          </div>
          <div className="mt-3 text-sm">
            {dish.portionCm && (
              <p className="mt-1">
                {t.dish.portion(
                  formatLength(dish.portionCm.width),
                  formatLength(dish.portionCm.depth),
                  formatLength(dish.portionCm.height),
                )}
              </p>
            )}
            <p className="mt-1">
              {dish.servedIn
                ? t.dish.servedIn(dish.servedIn.kind, plateSize, dish.servedIn.oz)
                : t.dish.servedOn(plateSize)}
            </p>
          </div>
        </section>
      </article>
      <PoweredBy label={t.menu.poweredBy} />
    </main>
  );
}
