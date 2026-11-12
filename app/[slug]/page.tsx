import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { CategoryTabs } from "@/components/menu/category-tabs";
import { DishCard } from "@/components/menu/dish-card";
import { MenuHeader } from "@/components/menu/menu-header";
import { getRestaurant, getRestaurants } from "@/lib/demo-data";

export function generateStaticParams() {
  return getRestaurants().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata(
  props: PageProps<"/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const restaurant = getRestaurant(slug);
  if (!restaurant) return {};
  return {
    title: `${restaurant.name} menu`,
    description: restaurant.tagline,
  };
}

export default async function MenuPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  const restaurant = getRestaurant(slug);
  if (!restaurant) notFound();

  return (
    <main
      className="mx-auto w-full max-w-xl pb-16"
      style={{ "--brand": restaurant.primaryColor } as CSSProperties}
    >
      <MenuHeader restaurant={restaurant} />
      <CategoryTabs categories={restaurant.categories} />

      {restaurant.categories.map((category, categoryIndex) => {
        const dishes = restaurant.dishes.filter(
          (d) => d.category === category.id,
        );
        return (
          <section
            key={category.id}
            id={category.id}
            aria-labelledby={`${category.id}-heading`}
            className="scroll-mt-16 px-4 pt-6"
          >
            <h2
              id={`${category.id}-heading`}
              className="text-lg font-semibold tracking-tight"
            >
              {category.name}
            </h2>
            <div className="divide-y">
              {dishes.map((dish, dishIndex) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  href={`/${restaurant.slug}/dish/${dish.id}`}
                  preloadPhoto={categoryIndex === 0 && dishIndex < 2}
                />
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
