import { LOCALE_COOKIE, type Locale } from "./config";

/** Saves the diner's language choice. Returns false if cookies are blocked. */
export function saveLocale(locale: Locale): boolean {
  try {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    return document.cookie.includes(`${LOCALE_COOKIE}=${locale}`);
  } catch {
    return false;
  }
}
