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
 *
 *   // Client component pattern (juga support):
 *   import { useTranslation } from "@/core/i18n";
 *   const { t } = useTranslation();
 */

import id from "./locales/id.json";
import en from "./locales/en.json";
import { appConfig, type Locale } from "@/config";

const locales = { id, en } as const;

/** Source dictionary — id.json jadi "contract" untuk key type safety. */
type Dict = typeof id;

/**
 * Recursive type yang generate semua dotted key dari nested JSON.
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
 * Main translation function.
 *
 * Accept `string` juga (bukan cuma TranslationKey) untuk graceful fallback.
 * Kalau key gak valid, return key itu sendiri + warn di dev.
 */
export function t(
  key: TranslationKey | string,
  params?: Record<string, string | number>,
  locale?: Locale
): string {
  const activeLocale = locale ?? (appConfig.locale.default as Locale);
  const dict = locales[activeLocale] ?? locales.id;

  const value = resolveKey(dict, key);

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

export function getCurrentLocale(): Locale {
  return appConfig.locale.default as Locale;
}

export function getAvailableLocales(): readonly Locale[] {
  return appConfig.locale.available;
}

/**
 * Hook untuk client components. Return `t` function + current locale.
 *
 * Kenapa hook? Biar konsisten dengan pattern React (useTranslation dari
 * react-i18next). Internal cuma re-export `t` — gak ada state atau
 * subscription. Locale diambil dari config yang locked di module load.
 */
export function useTranslation(locale?: Locale) {
  const activeLocale = locale ?? getCurrentLocale();
  return {
    t: (
      key: TranslationKey | string,
      params?: Record<string, string | number>
    ) => t(key, params, activeLocale),
    locale: activeLocale,
  };
}