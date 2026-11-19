import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { listRestaurants } from "@/lib/admin/data";
import { mediaUrl } from "@/lib/supabase/public";

export const metadata: Metadata = { title: "Restaurants" };

export default function RestaurantsPage() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="rf-serif text-3xl">Restaurants</h1>
        <Link href="/admin/restaurants/new" className="inline-flex h-11 items-center rounded-xl bg-(--rf-ink) px-5 text-sm font-bold text-(--rf-paper) outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Add restaurant
        </Link>
      </div>
      <Suspense fallback={<p className="mt-8 text-muted-foreground">Loading restaurants…</p>}>
        <RestaurantList />
      </Suspense>
    </>
  );
}

async function RestaurantList() {
  const restaurants = await listRestaurants();
  if (!restaurants.length) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="font-bold">No restaurants yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Add the first one to create its menu and QR cards.</p>
      </div>
    );
  }
  return (
    <ul className="mt-6 grid gap-3">
      {restaurants.map((r) => {
        const logo = mediaUrl(r.logo_path);
        return (
          <li key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-(--rf-card) p-4">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-muted">{logo && <Image src={logo} alt="" fill sizes="48px" className="object-cover" />}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/admin/restaurants/${r.id}`} className="rf-serif truncate text-xl underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                  {r.name}
                </Link>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${r.is_published ? "bg-(--rf-accent) text-(--rf-ink)" : "bg-muted text-muted-foreground"}`}>
                  {r.is_published ? "Live" : "Hidden"}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                /{r.slug}, {r.dishes} {r.dishes === 1 ? "dish" : "dishes"}, {r.withModel} in 3D
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-bold">
              <Link href={`/admin/restaurants/${r.id}/menu`} className="rounded-lg bg-muted px-3 py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                Menu
              </Link>
              <Link href={`/admin/restaurants/${r.id}/qr`} className="rounded-lg bg-muted px-3 py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                QR cards
              </Link>
              <a href={`/${r.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg px-3 py-2 underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                Open menu
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
