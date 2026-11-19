import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DishForm } from "@/components/admin/dish-form";
import { saveDish } from "@/lib/admin/actions";
import { getMenuData } from "@/lib/admin/data";

export const metadata: Metadata = { title: "New dish" };

export default function NewDishPage(props: PageProps<"/admin/restaurants/[id]/dishes/new">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <NewDish params={props.params} />
    </Suspense>
  );
}

async function NewDish({ params }: { params: PageProps<"/admin/restaurants/[id]/dishes/new">["params"] }) {
  const { id } = await params;
  const { restaurant, categories } = await getMenuData(id);
  return (
    <>
      <Link href={`/admin/restaurants/${id}/menu`} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
        {restaurant.name}: menu
      </Link>
      <h1 className="rf-serif mt-1 mb-6 text-3xl">New dish</h1>
      {!categories.length && (
        <p className="mb-6 max-w-xl rounded-xl border border-border bg-(--rf-card) p-4 text-sm">
          This menu has no categories yet. The dish will be saved but hidden until you{" "}
          <Link href={`/admin/restaurants/${id}/menu`} className="font-bold underline underline-offset-4">
            add a category
          </Link>{" "}
          and move it there.
        </p>
      )}
      <DishForm action={saveDish.bind(null, id, null)} restaurantId={id} categories={categories} />
    </>
  );
}
