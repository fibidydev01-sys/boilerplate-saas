"use client";

/**
 * Locale provider — client-side state + context for the active locale.
 *
 * Architecture:
 *   - Server resolves initial locale from cookie via getServerLocale()
 *     in the root layout.
 *   - That value is passed as `initialLocale` prop, hydrating the React
 *     state on first client render. No FOUC: server and client agree on
 *     the locale from frame 1.
 *   - User toggles locale → setLocale():
 *       1. Optimistic state update (client text changes immediately)
 *       2. POST /api/locale to persist cookie (server source of truth)
 *       3. router.refresh() to re-render server components with the new
 *          cookie value (page metadata, server-rendered text, etc.)
 *
 * Why useTransition:
 *   The fetch + router.refresh sequence is async. Wrapping it in a
 *   transition keeps the UI responsive (button stays clickable, no
 *   blocking suspense), and gives us `isPending` for a subtle visual
 *   cue on the switcher button.
 *
 * Why useTranslation lives here (not in i18n/index.ts):
 *   `i18n/index.ts` is server-safe. It exports the pure `t()` function
 *   used by route handlers, page metadata, and validators. If we put a
 *   React hook in there, the file would need `"use client"` and stop
 *   working from server contexts. Splitting client concerns into this
 *   file keeps the boundary clean.
 *
 *   `i18n/index.ts` re-exports `useTranslation` and `useLocale` from
 *   here as a convenience — existing callsites that do
 *   `import { useTranslation } from "@/core/i18n"` continue to work.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/config";
import { t as translate, type TranslationKey } from "./index";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  /** True while the cookie write + router.refresh is in flight. */
  isPending: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  children: ReactNode;
  /**
   * Initial locale resolved server-side via getServerLocale().
   * Required — there's no sensible client-side default.
   */
  initialLocale: Locale;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      // Optimistic — client text reflects new locale before the server
      // round-trip completes. If the POST fails, the next router.refresh
      // (or a hard reload) would revert to the cookie's actual value.
      setLocaleState(next);

      startTransition(async () => {
        try {
          const res = await fetch("/api/locale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: next }),
          });
          if (!res.ok && process.env.NODE_ENV === "development") {
            console.warn(
              `[LocaleProvider] persist failed: HTTP ${res.status}`
            );
          }
        } catch (err) {
          // Network / abort. Keep optimistic state — user retried action
          // will succeed; hard refresh would revert. Acceptable trade-off.
          if (process.env.NODE_ENV === "development") {
            console.warn("[LocaleProvider] persist error:", err);
          }
        }
        // Re-render server components with the new cookie value so that
        // server-rendered text (page metadata, server components calling
        // t() with getServerLocale()) follows the change.
        router.refresh();
      });
    },
    [router]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, isPending }}>
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * Read & control the active locale from any client component below
 * <LocaleProvider />. Throws if used outside the provider — a clear
 * error beats silent fallback.
 */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within <LocaleProvider />");
  }
  return ctx;
}

/**
 * Client translation hook. Reads active locale from context and binds
 * it to a curried `t` function.
 *
 * Returns:
 *   - t      : translate function with active locale pre-applied
 *   - locale : current locale code (for cases like `<html lang>`,
 *              date formatting, etc.)
 *
 * Existing call pattern stays the same:
 *
 *   const { t } = useTranslation();
 *   <h1>{t("dashboard.pageTitle")}</h1>
 *
 * Breaking change vs. previous version:
 *   The old hook accepted an optional `locale?` argument. The new one
 *   does not — locale comes from context. No callsites in the current
 *   codebase pass that argument, so this is a no-op migration in practice.
 */
export function useTranslation() {
  const { locale } = useLocale();
  return {
    locale,
    t: (
      key: TranslationKey | string,
      params?: Record<string, string | number>
    ) => translate(key, params, locale),
  };
}
