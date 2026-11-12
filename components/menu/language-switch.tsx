"use client";

import { LOCALES, stripLocale, type Locale } from "@/lib/i18n/config";
import { saveLocale } from "@/lib/i18n/save-locale";
import { cn } from "@/lib/utils";

export function LanguageSwitch({ current, label }: { current: Locale; label: string }) {
  function choose(locale: Locale) {
    if (locale === current) return;
    const saved = saveLocale(locale);
    const { pathname, search } = window.location;
    const clean = stripLocale(pathname);
    // With the cookie saved, keep the clean URL; otherwise put the language in the URL.
    const next = saved ? clean : `/${locale}${clean === "/" ? "" : clean}`;
    window.location.replace(`${next}${search}`);
  }

  return (
    <div role="group" aria-label={label} className="inline-flex shrink-0 rounded-full bg-muted p-1">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          aria-pressed={locale === current}
          onClick={() => choose(locale)}
          className={cn(
            "h-9 min-w-11 rounded-full px-3 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            locale === current ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
