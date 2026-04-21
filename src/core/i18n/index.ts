/**
 * i18n — Lightweight translation helper.
 *
 * Design:
 * - Zero runtime dependency. Cuma JSON + function.
 * - Type-safe key lookup berdasarkan struktur id.json (source of truth).
 * - Support param interpolation: t("dashboard.welcomeMessage", { appName: "Acme" })
 * - Default locale diambil dari appConfig.locale.default.
 *
 * Usage:
 *   import { t } from "@/core/i18n";
 *   t("common.loading")
 *   t("dashboard.welcomeMessage", { appName: "Acme" })
 *   t("common.loading", undefined, "en")
 *
 * Kenapa gak pake next-intl / react-i18next?
 * - Boilerplate ini target: ringan, zero config, config-driven.
 * - Nanti kalau butuh locale switcher runtime + ICU format kompleks,
 *   baru migrate ke next-intl. API t() di sini udah kompatibel.
 */

import id from "./locales/id.json";
import en from "./locales/en.json";
import { appConfig, type Locale } from "@/config";

const locales = { id, en } as const;

/** Source dictionary — id.json jadi "contract" untuk key type safety. */
type Dict = typeof id;

/**
 * Recursive type yang generate semua dotted key dari nested JSON.
 * Contoh: "common.loading" | "auth.emailLabel" | "auth.validation.emailRequired"
 */
type NestedKey<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
  ? `${Prefix}${K}`
  : T[K] extends object
  ? NestedKey<T[K], `${Prefix}${K}.`>
  : never;
}[keyof T & string];

export type TranslationKey = NestedKey<Dict>;

/**
 * Resolve dotted path jadi string value dari object.
 * Kalau gak ketemu atau bukan string, return undefined.
 */
function resolveKey(dict: unknown, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return (acc as Record<string, unknown>)[segment];
    }
    return undefined;
  }, dict);

  return typeof value === "string" ? value : undefined;
}

/**
 * Replace {param} placeholder di string dengan value dari params object.
 */
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
 * Main translation function.
 *
 * @param key       Dotted path ke translation (type-safe).
 * @param params    Optional — untuk replace {placeholder} di string.
 * @param locale    Optional — override default locale dari appConfig.
 * @returns         Translated string, atau key itu sendiri kalau gak ketemu.
 */
export function t(
  key: TranslationKey,
  params?: Record<string, string | number>,
  locale?: Locale
): string {
  const activeLocale = locale ?? (appConfig.locale.default as Locale);
  const dict = locales[activeLocale] ?? locales.id;

  const value = resolveKey(dict, key);

  // Fallback ke id.json kalau locale aktif gak punya key-nya
  if (value === undefined && activeLocale !== "id") {
    const fallback = resolveKey(locales.id, key);
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

/**
 * Get current default locale dari config.
 */
export function getCurrentLocale(): Locale {
  return appConfig.locale.default as Locale;
}

/**
 * Get semua locale yang available.
 */
export function getAvailableLocales(): readonly Locale[] {
  return appConfig.locale.available;
}
