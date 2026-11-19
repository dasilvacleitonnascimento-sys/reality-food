import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RestaurantForm } from "@/components/admin/restaurant-form";
import { saveRestaurant } from "@/lib/admin/actions";
import { getMenuData } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Restaurant" };

export default function RestaurantPage(props: PageProps<"/admin/restaurants/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
      <Restaurant params={props.params} />
    </Suspense>
  );
}

async function Restaurant({ params }: { params: PageProps<"/admin/restaurants/[id]">["params"] }) {
  const { id } = await params;
  const { restaurant, dishes } = await getMenuData(id);
  const withModel = dishes.filter((d) => d.model_glb_path).length;
  return (
    <>
      <Link href="/admin" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
        Restaurants
      </Link>
      <h1 className="rf-serif mt-1 text-3xl">{restaurant.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground tabular-nums">
        {dishes.length} {dishes.length === 1 ? "dish" : "dishes"}, {withModel} in 3D
      </p>

      <nav aria-label="Restaurant" className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
        <Link href={`/admin/restaurants/${id}/menu`} className="rounded-xl bg-(--rf-ink) px-4 py-2.5 text-(--rf-paper) outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Edit menu
        </Link>
        <Link href={`/admin/restaurants/${id}/qr`} className="rounded-xl bg-muted px-4 py-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          QR cards
        </Link>
        <a href={`/${restaurant.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-muted px-4 py-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Open menu
        </a>
        <a href={`/${restaurant.slug}?table=1`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-muted px-4 py-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Test table 1
        </a>
      </nav>

      <h2 className="mt-10 mb-4 text-lg font-bold">Details</h2>
      <RestaurantForm action={saveRestaurant.bind(null, id)} restaurant={restaurant} />
    </>
  );
}
