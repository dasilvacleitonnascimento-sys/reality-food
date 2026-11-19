import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DishForm } from "@/components/admin/dish-form";
import { ConfirmDelete } from "@/components/admin/menu-controls";
import { ModelPreview } from "@/components/admin/model-preview";
import { deleteDish, saveDish } from "@/lib/admin/actions";
import { getDish } from "@/lib/admin/data";
import { mediaUrl } from "@/lib/supabase/public";

export const metadata: Metadata = { title: "Dish" };

type Props = PageProps<"/admin/restaurants/[id]/dishes/[dishId]">;

export default function DishPage(props: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <Dish params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Dish({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { id, dishId } = await params;
  const { created } = await searchParams;
  const { menu, dish } = await getDish(id, dishId);
  const { restaurant, categories } = menu;
  const glb = mediaUrl(dish.model_glb_path);
  const photo = mediaUrl(dish.photo_path);
  const publicPath = `/${restaurant.slug}/dish/${dish.slug}`;

  return (
    <>
      <Link href={`/admin/restaurants/${id}/menu`} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
        {restaurant.name}: menu
      </Link>
      <h1 className="rf-serif mt-1 text-3xl">{dish.name.en}</h1>
      {created && (
        <p role="status" className="mt-3 max-w-xl rounded-xl border border-(--rf-accent-text) bg-(--rf-card) p-3 text-sm font-medium">
          Dish added. It&apos;s on the menu now{dish.category_id ? "" : " once it has a category"}.
        </p>
      )}

      <section aria-labelledby="ar-heading" className="mt-6 max-w-xl rounded-2xl border border-border bg-(--rf-card) p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="ar-heading" className="font-bold">
            3D and AR
          </h2>
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${glb ? "bg-(--rf-accent) text-(--rf-ink)" : "bg-muted text-muted-foreground"}`}>
            {glb ? (dish.model_usdz_path ? "Ready: Android + iPhone" : "Ready (iPhone file built on the phone)") : "No 3D yet"}
          </span>
        </div>
        {glb ? (
          <div className="mt-4 grid gap-3">
            <ModelPreview glbUrl={glb} usdzUrl={mediaUrl(dish.model_usdz_path)} poster={photo} alt={`3D model of ${dish.name.en}`} />
            <p className="text-sm text-muted-foreground tabular-nums">Shown at true size on a {dish.plate_diameter_cm} cm {dish.served_in}. Open this page on a phone to try “View on table”.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-2 text-sm">
            <p>Until a model is added, the menu shows only the photo (no “View on table” button).</p>
            <p className="text-muted-foreground">
              Process the scan on the computer (add-dish steps), then attach it to this dish:
            </p>
            <code className="block overflow-x-auto rounded-lg bg-muted p-3 text-xs whitespace-pre">
              npm run publish-model -- {restaurant.slug} {dish.slug} public/models/{restaurant.slug}/{dish.slug}.glb
            </code>
          </div>
        )}
        <a href={publicPath} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-bold underline underline-offset-4">
          Open the diner page
        </a>
      </section>

      <h2 className="mt-10 mb-4 text-lg font-bold">Details</h2>
      <DishForm action={saveDish.bind(null, id, dish.id)} restaurantId={id} categories={categories} dish={dish} />

      <div className="mt-12 max-w-xl border-t border-border pt-6">
        <ConfirmDelete what="dish" onConfirm={deleteDish.bind(null, id, dish.id)} />
      </div>
    </>
  );
}
