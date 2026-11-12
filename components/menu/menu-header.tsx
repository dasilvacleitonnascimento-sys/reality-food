import Image from "next/image";
import { Suspense } from "react";
import type { Restaurant } from "@/lib/demo-data";
import { TableLabel } from "./table-label";

export function MenuHeader({ restaurant }: { restaurant: Restaurant }) {
  return (
    <header className="flex items-center gap-4 px-4 pt-6 pb-4">
      <Image
        src={restaurant.logo}
        alt={`${restaurant.name} logo`}
        width={56}
        height={56}
        unoptimized
        preload
        className="size-14 shrink-0 rounded-full"
      />
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight">
          {restaurant.name}
        </h1>
        <p className="text-sm text-muted-foreground">{restaurant.tagline}</p>
        {/* Reads ?table= on the client so the menu itself stays prerendered. */}
        <Suspense fallback={null}>
          <TableLabel />
        </Suspense>
      </div>
    </header>
  );
}
