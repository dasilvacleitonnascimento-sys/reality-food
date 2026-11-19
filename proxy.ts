import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { LOCALES, LOCALE_COOKIE, pickLocale } from "@/lib/i18n/config";

// Diners always see clean URLs (/demo-bistro), so printed QR codes never change.
// Behind the scenes we rewrite to /en/... or /es/... based on the saved choice
// or the phone's language. Pages stay prerendered per language, so it's fast.
// /admin (the Reality Food panel, English only) is left alone, except that its
// Supabase login session is refreshed on every request.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return refreshAdminSession(request);

  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return;

  const locale = pickLocale(request.cookies.get(LOCALE_COOKIE)?.value, request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

/** Keeps the admin's Supabase session fresh (rotated tokens are written back as cookies). */
async function refreshAdminSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Skip Next internals and any file with an extension (images, models, decoders).
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
