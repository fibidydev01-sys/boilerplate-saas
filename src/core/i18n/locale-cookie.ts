/**
 * Locale cookie helpers — server-side.
 *
 * Single source of truth for cookie name, max-age, and validation logic.
 * Imported by:
 *   - get-locale.ts (read cookie in server components)
 *   - /api/locale/route.ts (write cookie on user toggle)
 *
 * Cookie contract:
 *   name      : "app-locale"
 *   value     : one of appConfig.locale.available (e.g. "en" | "id")
 *   max-age   : 1 year
 *   path      : "/"
 *   sameSite  : "lax"        — baseline CSRF protection
 *   httpOnly  : false        — non-sensitive value; client provider can mirror
 *                              if needed (currently uses React state instead)
 *   secure    : true in prod — HTTPS-only in production
 */

import { cookies } from "next/headers";
import { appConfig, type Locale } from "@/config";

export const LOCALE_COOKIE_NAME = "app-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

/**
 * Type guard: is the input a valid locale per current appConfig?
 *
 * Used for both reading (defensive: cookie might hold a locale that was
 * removed from config since the user last set it) and writing (input
 * validation in the API route).
 */
export function isValidLocale(value: string): value is Locale {
  return (appConfig.locale.available as readonly string[]).includes(value);
}

/**
 * Read the user's selected locale from the cookie.
 *
 * Falls back to appConfig.locale.default when:
 *   - cookie is absent (first-time visitor)
 *   - cookie value is no longer in appConfig.locale.available
 *     (e.g., admin removed a locale from config after users had set it)
 *
 * Async because Next.js 15+ `cookies()` returns a promise.
 */
export async function readLocaleCookie(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE_NAME)?.value;
  if (value && isValidLocale(value)) return value;
  return appConfig.locale.default as Locale;
}
