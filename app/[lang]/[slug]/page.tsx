import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CategoryTabs } from "@/components/menu/category-tabs";
import { DishCard } from "@/components/menu/dish-card";
import { MenuHeader } from "@/components/menu/menu-header";
import { MenuSkeleton } from "@/components/menu/skeletons";
import { PoweredBy } from "@/components/menu/powered-by";
import { formatPlateSize } from "@/lib/format";
import { getMenu, getMenuSlugs } from "@/lib/menu";
import { getPreview } from "@/lib/previews";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export async function generateStaticParams() {
  return (await getMenuSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/[lang]/[slug]">): Promise<Metadata> {
  const { lang, slug } = await props.params;
  if (!isLocale(lang)) return {};
  const restaurant = await getMenu(slug, lang);
  if (!restaurant) return {};
  return {
    title: getDictionary(lang).menu.title(restaurant.name),
    description: restaurant.tagline,
    // Sales previews aren't the restaurant's official menu yet: keep them out of search.
    ...(getPreview(slug) ? { robots: { index: false, follow: false } } : {}),
  };
}

// The page shell renders instantly; the menu streams in (Next 16 instant navigation).
export default function MenuPage(props: PageProps<"/[lang]/[slug]">) {
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <Menu params={props.params} />
    </Suspense>
  );
}

async function Menu({ params }: { params: PageProps<"/[lang]/[slug]">["params"] }) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const restaurant = await getMenu(slug, lang);
  if (!restaurant) notFound();
  const dict = getDictionary(lang);
  const t = dict.menu;
  const preview = getPreview(slug);

  return (
    <main
      className="mx-auto w-full max-w-xl pb-16"
    >
      {preview && (
        <p className="border-b border-border px-4 py-2 text-center text-[11px] text-muted-foreground">{t.preview(restaurant.name)}</p>
      )}
      <MenuHeader
        restaurant={restaurant}
        locale={lang}
        text={{ table: t.table, language: t.language }}
        logo={preview ? { src: preview.logo, wide: preview.wide } : undefined}
      />
      <CategoryTabs categories={restaurant.categories} label={t.categories} />

      {restaurant.categories.map((category, categoryIndex) => {
        const dishes = restaurant.dishes.filter((d) => d.category === category.id);
        return (
          <section
            key={category.id}
            id={category.id}
            aria-labelledby={`${category.id}-heading`}
            className="scroll-mt-16 px-4 pt-6"
          >
            <h2 id={`${category.id}-heading`} className="text-lg font-semibold tracking-tight">
              {category.name}
            </h2>
            <div className="divide-y">
              {dishes.map((dish, dishIndex) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  // Keeps the diner's language even if cookies are blocked.
                  href={`/${lang}/${restaurant.slug}/dish/${dish.id}`}
                  soldOutLabel={t.soldOut}
                  sizeLabel={dict.dish.sizeShort(dish.servedIn?.kind ?? "plate", formatPlateSize(dish.plateDiameterCm).split(" (")[0], dish.servedIn?.oz)}
                  preloadPhoto={categoryIndex === 0 && dishIndex < 2}
                />
              ))}
            </div>
          </section>
        );
      })}
      <PoweredBy label={t.poweredBy} />
    </main>
  );
}
