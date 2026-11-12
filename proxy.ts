import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, LOCALE_COOKIE, pickLocale } from "@/lib/i18n/config";

// Diners always see clean URLs (/demo-bistro), so printed QR codes never change.
// Behind the scenes we rewrite to /en/... or /es/... based on the saved choice
// or the phone's language. Pages stay prerendered per language, so it's fast.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;

  const locale = pickLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals and any file with an extension (images, models, decoders).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
