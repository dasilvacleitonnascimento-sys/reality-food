import Image from "next/image";
import { Suspense } from "react";
import type { Restaurant } from "@/lib/demo-data";
import type { Locale } from "@/lib/i18n/config";
import { LanguageSwitch } from "./language-switch";
import { TableLabel } from "./table-label";

type Props = {
  restaurant: Restaurant;
  locale: Locale;
  text: { table: string; language: string };
};

export function MenuHeader({ restaurant, locale, text }: Props) {
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
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold tracking-tight">{restaurant.name}</h1>
        <p className="text-sm text-muted-foreground">{restaurant.tagline}</p>
        {/* Reads ?table= on the client so the menu itself stays prerendered. */}
        <Suspense fallback={null}>
          <TableLabel label={text.table} />
        </Suspense>
      </div>
      <LanguageSwitch current={locale} label={text.language} />
    </header>
  );
}
