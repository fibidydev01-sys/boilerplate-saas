/**
 * Locale persistence endpoint.
 *
 * POST /api/locale
 *   Body : { "locale": "en" | "id" }
 *   200  : { ok: true, locale }       — cookie set
 *   400  : { error: "invalid_json" }  — body wasn't JSON
 *   400  : { error: "invalid_locale" } — value not in appConfig.locale.available
 *
 * Why POST (not GET):
 *   Setting a cookie is a state change. POST is the correct verb.
 *   SameSite=lax (set on the cookie) gives baseline CSRF protection;
 *   combined with same-origin fetch from the LocaleProvider, no token
 *   is needed.
 *
 * Why validate:
 *   `isValidLocale()` rejects values outside appConfig.locale.available.
 *   Catches typos, removed-but-still-cached locales, and arbitrary input.
 *
 * Why response.cookies.set (not cookies().set from next/headers):
 *   Attaching the cookie directly to the outgoing NextResponse is the
 *   most reliable pattern — independent of framework version quirks
 *   around the global mutable cookie store. Functionally identical for
 *   the happy path, but avoids edge cases where middleware response
 *   composition can drop or shadow Set-Cookie headers.
 *
 * Why this route is public (in routes.ts → PUBLIC_ROUTE_PREFIXES):
 *   Unauthenticated visitors on landing must be able to switch locale.
 *   Without the public exemption, proxy.ts redirects this POST to /login
 *   (since it's not a public route by default), the redirect strips the
 *   Set-Cookie header, and the locale never persists. Locale isn't
 *   sensitive data — public access here is safe.
 */

import { NextResponse } from "next/server";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_COOKIE_MAX_AGE,
  isValidLocale,
} from "@/core/i18n/locale-cookie";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const locale =
    typeof body === "object" && body !== null && "locale" in body
      ? (body as { locale: unknown }).locale
      : null;

  if (typeof locale !== "string" || !isValidLocale(locale)) {
    return NextResponse.json({ error: "invalid_locale" }, { status: 400 });
  }

  // Attach cookie directly to the outgoing response. This bypasses any
  // edge cases where the global cookies() store might not propagate
  // correctly through middleware composition.
  const response = NextResponse.json({ ok: true, locale });
  response.cookies.set({
    name: LOCALE_COOKIE_NAME,
    value: locale,
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

/**
 * Reject anything other than POST with a clear 405. Avoids accidental
 * use of GET for state changes (which would also bypass SameSite=lax
 * protections in some scenarios).
 */
export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}
