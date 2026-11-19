import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CategoryForm, ConfirmDelete, MoveButtons, SoldOutSwitch } from "@/components/admin/menu-controls";
import { deleteCategory, move, saveCategory, setDishAvailable } from "@/lib/admin/actions";
import { getMenuData } from "@/lib/admin/data";
import { formatPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/supabase/public";
import type { DishRow } from "@/lib/supabase/database.types";

export const metadata: Metadata = { title: "Menu" };

type Props = PageProps<"/admin/restaurants/[id]/menu">;

export default function MenuEditorPage(props: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading the menu…</p>}>
      <MenuEditor params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function MenuEditor({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { id } = await params;
  const { deleted } = await searchParams;
  const { restaurant, categories, dishes } = await getMenuData(id);
  const uncategorized = dishes.filter((d) => !d.category_id || !categories.some((c) => c.id === d.category_id));

  return (
    <>
      <Link href={`/admin/restaurants/${id}`} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
        {restaurant.name}
      </Link>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h1 className="rf-serif text-3xl">Menu</h1>
        <div className="flex flex-wrap gap-2">
          <a href={`/${restaurant.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-xl bg-muted px-4 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Open menu
          </a>
          <Link href={`/admin/restaurants/${id}/dishes/new`} className="inline-flex h-11 items-center rounded-xl bg-(--rf-ink) px-5 text-sm font-bold text-(--rf-paper) outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Add dish
          </Link>
        </div>
      </div>
      {deleted && (
        <p role="status" className="mt-4 rounded-xl border border-border bg-(--rf-card) p-3 text-sm font-medium">
          Dish deleted. It&apos;s gone from the menu.
        </p>
      )}

      {categories.map((category, ci) => {
        const inCategory = dishes.filter((d) => d.category_id === category.id);
        return (
          <section key={category.id} aria-labelledby={`cat-${category.id}`} className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id={`cat-${category.id}`} className="rf-serif mr-auto text-2xl">
                {category.name.en}
                {category.name.es && <span className="ml-2 text-base text-muted-foreground" lang="es">{category.name.es}</span>}
              </h2>
              <MoveButtons label={category.name.en} first={ci === 0} last={ci === categories.length - 1} onMove={move.bind(null, "categories", id, category.id)} />
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-bold text-muted-foreground">Rename or delete</summary>
              <div className="mt-3 grid gap-3">
                <CategoryForm action={saveCategory.bind(null, id, category.id)} nameEn={category.name.en} nameEs={category.name.es} submitLabel="Rename" />
                <ConfirmDelete what="category" onConfirm={deleteCategory.bind(null, id, category.id)} />
                <p className="text-xs text-muted-foreground">Dishes in it are kept and listed under “No category”.</p>
              </div>
            </details>
            <DishList restaurantId={id} dishes={inCategory} />
          </section>
        );
      })}

      {uncategorized.length > 0 && (
        <section aria-labelledby="cat-none" className="mt-8">
          <h2 id="cat-none" className="rf-serif text-2xl">
            No category
          </h2>
          <p className="text-sm text-muted-foreground">Not shown on the menu until they’re in a category.</p>
          <DishList restaurantId={id} dishes={uncategorized} />
        </section>
      )}

      <section aria-labelledby="new-category" className="mt-10 rounded-2xl border border-dashed border-border p-4">
        <h2 id="new-category" className="mb-3 font-bold">
          Add a category
        </h2>
        <CategoryForm action={saveCategory.bind(null, id, null)} submitLabel="Add category" />
      </section>
    </>
  );
}

function DishList({ restaurantId, dishes }: { restaurantId: string; dishes: DishRow[] }) {
  if (!dishes.length) return <p className="mt-3 text-sm text-muted-foreground">No dishes yet.</p>;
  return (
    <ul className="mt-3 grid gap-2">
      {dishes.map((dish, i) => {
        const photo = mediaUrl(dish.photo_path);
        return (
          <li key={dish.id} className="grid grid-cols-[3.5rem_1fr] items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-(--rf-card) p-3 sm:grid-cols-[3.5rem_1fr_auto]">
            <div className="relative size-14 overflow-hidden rounded-xl bg-muted">{photo && <Image src={photo} alt="" fill sizes="56px" className="object-cover" />}</div>
            <div className="min-w-0">
              <Link href={`/admin/restaurants/${restaurantId}/dishes/${dish.id}`} className="font-bold underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                {dish.name.en}
              </Link>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground tabular-nums">
                <span>{formatPrice(dish.price_cents / 100)}</span>
                <span aria-hidden>·</span>
                <span>
                  {dish.plate_diameter_cm} cm {dish.served_in}
                </span>
                {dish.model_glb_path ? (
                  <span className="rounded-md bg-(--rf-accent) px-1.5 py-0.5 text-xs font-bold whitespace-nowrap text-(--rf-ink)">3D</span>
                ) : (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-bold whitespace-nowrap">No 3D yet</span>
                )}
              </p>
            </div>
            <div className="col-span-2 flex items-center justify-between gap-3 border-t border-border pt-2 sm:col-span-1 sm:border-0 sm:pt-0">
              <SoldOutSwitch label={dish.name.en} available={dish.is_available} onChange={setDishAvailable.bind(null, restaurantId, dish.id)} />
              <MoveButtons label={dish.name.en} first={i === 0} last={i === dishes.length - 1} onMove={move.bind(null, "dishes", restaurantId, dish.id)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
