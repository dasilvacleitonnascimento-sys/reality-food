import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RestaurantForm } from "@/components/admin/restaurant-form";
import { saveRestaurant } from "@/lib/admin/actions";
import { requireReadyAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Add restaurant" };

export default function NewRestaurantPage() {
  return (
    <>
      <Link href="/admin" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
        Restaurants
      </Link>
      <h1 className="rf-serif mt-1 mb-6 text-3xl">Add restaurant</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Guarded />
      </Suspense>
    </>
  );
}

async function Guarded() {
  await requireReadyAdmin();
  return <RestaurantForm action={saveRestaurant.bind(null, null)} />;
}
