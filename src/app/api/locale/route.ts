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
 *   Without `isValidLocale()`, an attacker could set
 *   `app-locale=<script>` and although httpOnly=false the value never
 *   reaches a DOM sink — but defense in depth is cheap. Also catches
 *   legitimate bugs (typo in client code, locale removed from config).
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

  const store = await cookies();
  store.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ ok: true, locale });
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
