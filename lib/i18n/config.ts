// Supported languages. Safe to import from the proxy, server and client.

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Remembers the diner's choice from the EN/ES switch. */
export const LOCALE_COOKIE = "rf-lang";

export function isLocale(value: string | undefined | null): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Picks the language: saved choice first, then the phone's language, then English. */
export function pickLocale(cookie: string | undefined, acceptLanguage: string | null): Locale {
  if (isLocale(cookie)) return cookie;
  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.split(";").map((x) => x.trim());
      const qParam = params.find((p) => /^qs*=/i.test(p));
      const q = qParam ? Number(qParam.split("=")[1]) : 1;
      return { lang: tag.toLowerCase().slice(0, 2), q };
    })
    // q=0 means "not acceptable".
    .filter((p) => p.lang && Number.isFinite(p.q) && p.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { lang } of preferred) {
    if (isLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}

/** "/es/demo-bistro" -> "/demo-bistro" (URLs shown to diners never carry the locale). */
export function stripLocale(pathname: string): string {
  for (const locale of LOCALES) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}
