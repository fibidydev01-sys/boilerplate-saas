/**
 * i18n — Lightweight translation helper.
 *
 * Architecture (post locale-switcher refactor):
 *
 *   index.ts (this file)        SERVER-SAFE module
 *     - Pure t() function        — works in server & client contexts
 *     - TranslationKey type      — derived from en.json shape
 *     - getAvailableLocales()    — config accessor
 *     - Re-exports useTranslation, useLocale, LocaleProvider from
 *       ./locale-provider for ergonomic single-import:
 *
 *         import { t, useTranslation } from "@/core/i18n";
 *
 *   locale-provider.tsx         CLIENT module ("use client")
 *     - LocaleProvider           — context provider, mounted in root layout
 *     - useLocale()              — read/set active locale
 *     - useTranslation()         — translate hook bound to active locale
 *
 *   get-locale.ts               SERVER-ONLY module (`server-only` import)
 *     - getServerLocale()        — read locale cookie, used by:
 *                                  • root layout (initial state)
 *                                  • generateMetadata() in server pages
 *                                  • any server component calling t()
 *
 *   locale-cookie.ts            SERVER module (uses next/headers)
 *     - LOCALE_COOKIE_NAME, LOCALE_COOKIE_MAX_AGE
 *     - isValidLocale()          — type guard for cookie value
 *     - readLocaleCookie()       — actual implementation
 *
 * Migration notes:
 *
 *   Removed: getCurrentLocale()
 *     The previous version always returned appConfig.locale.default,
 *     making locale switching impossible. It's gone — replaced by:
 *       • Server side: await getServerLocale() from ./get-locale
 *       • Client side: useLocale() from ./locale-provider (or via this file)
 *
 *   Changed: useTranslation() signature
 *     Old: useTranslation(locale?) — optional override arg
 *     New: useTranslation()        — locale comes from context
 *     No callsite in the codebase passes the optional arg, so this is
 *     a no-op migration in practice.
 *
 * Server-side usage:
 *
 *   import { t } from "@/core/i18n";
 *   import { getServerLocale } from "@/core/i18n/get-locale";
 *
 *   const locale = await getServerLocale();
 *   const title = t("common.login", undefined, locale);
 *
 * Client-side usage:
 *
 *   import { useTranslation } from "@/core/i18n";
 *
 *   const { t, locale } = useTranslation();
 *   <h1>{t("dashboard.welcomeMessage", { appName: "..." })}</h1>
 *
 * Validators / module-load t() calls:
 *
 *   src/core/lib/validators.ts calls t() at module load time, locking
 *   error messages to appConfig.locale.default. This is a known
 *   limitation — Zod schemas are static and validators evaluate once.
 *   Fixing it requires converting schemas to factory functions, which
 *   is out of scope for the locale switcher itself.
 */

import en from "./locales/en.json";
import id from "./locales/id.json";
import { appConfig, type Locale } from "@/config";

const locales = { en, id } as const;

/**
 * Source dictionary — en.json is the contract for type-safe keys.
 *
 * If a key exists in en but not in id, t() falls back to en at runtime.
 * Keys that exist in id but not en are unreachable via the typed API
 * (TS won't allow them) — they'd only resolve via the string overload.
 */
type Dict = typeof en;

/**
 * Recursive type that generates dotted keys from the JSON shape.
 *   { a: { b: "x" } } → "a.b"
 *   { a: "x", b: { c: "y" } } → "a" | "b.c"
 */
type NestedKey<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
  ? `${Prefix}${K}`
  : T[K] extends object
  ? NestedKey<T[K], `${Prefix}${K}.`>
  : never;
}[keyof T & string];

export type TranslationKey = NestedKey<Dict>;

function resolveKey(dict: unknown, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, dict);

  return typeof value === "string" ? value : undefined;
}

function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return Object.entries(params).reduce(
    (str, [key, value]) =>
      str.replace(new RegExp(`\\{${key}\\}`, "g"), String(value)),
    template
  );
}

/**
 * Translate a key with optional params and an optional locale override.
 *
 * Accepts `string` (not just TranslationKey) for graceful fallback in
 * dynamic-key cases (e.g. `roles.${user.role}`). Missing keys return
 * the key itself + a dev warning.
 *
 * Resolution order:
 *   1. Active locale (param or appConfig.locale.default)
 *   2. English fallback (always — source of truth)
 *   3. Return the key string verbatim + dev warning
 */
export function t(
  key: TranslationKey | string,
  params?: Record<string, string | number>,
  locale?: Locale
): string {
  const activeLocale = locale ?? (appConfig.locale.default as Locale);
  const dict = locales[activeLocale] ?? locales.en;

  const value = resolveKey(dict, key);

  // Fallback to English if the active locale lacks the key
  if (value === undefined && activeLocale !== "en") {
    const fallback = resolveKey(locales.en, key);
    if (fallback !== undefined) return interpolate(fallback, params);
  }

  if (value === undefined) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[i18n] Missing translation: "${key}"`);
    }
    return key;
  }

  return interpolate(value, params);
}

export function getAvailableLocales(): readonly Locale[] {
  return appConfig.locale.available;
}

/**
 * Re-exports from the client provider so consumers can do:
 *
 *   import { t, useTranslation } from "@/core/i18n";
 *
 * instead of importing from two paths. Server components can still
 * safely import `t` and `getAvailableLocales` from this file —
 * Next.js treats client exports as client references when imported
 * from server context.
 */
export {
  LocaleProvider,
  useLocale,
  useTranslation,
} from "./locale-provider";
