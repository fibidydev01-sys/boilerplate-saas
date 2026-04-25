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
 *
 * IMPORTANT — t identity stability:
 *   `t` is wrapped in useCallback bound to `locale`, and the returned
 *   object is memoized via useMemo. This guarantees that as long as
 *   `locale` doesn't change, `t` keeps the same reference across renders.
 *
 *   This matters for consumers that put `t` in useCallback / useEffect
 *   dependency arrays (e.g. ProductsGrid uses `t` inside `mapErrorCode`,
 *   which feeds into `fetchProducts`, which feeds into a `useEffect`).
 *   Without identity stability, every render minted a new `t` →
 *   new `mapErrorCode` → new `fetchProducts` → effect re-fires →
 *   setState → render → infinite loop, observable as runaway requests
 *   in the Network tab.
 *
 *   Don't "fix" loops at the consumer by dropping `t` from deps — that
 *   masks bugs and fights eslint-plugin-react-hooks. Keep the fix here,
 *   one place, for every consumer.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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

  // Memoize the context value object so consumers using `useLocale()`
  // don't re-render on unrelated parent re-renders.
  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, isPending }),
    [locale, setLocale, isPending]
  );

  return (
    <LocaleContext.Provider value={value}>
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
 * it to a stable `t` function.
 *
 * Returns:
 *   - t      : translate function with active locale pre-applied.
 *              IDENTITY STABLE across renders as long as locale doesn't
 *              change — safe to use in useCallback/useEffect deps.
 *   - locale : current locale code (for cases like `<html lang>`,
 *              date formatting, etc.)
 *
 * Existing call pattern stays the same:
 *
 *   const { t } = useTranslation();
 *   <h1>{t("dashboard.pageTitle")}</h1>
 *
 * Breaking change vs. the original version:
 *   The old hook accepted an optional `locale?` argument. The new one
 *   does not — locale comes from context. No callsites in the current
 *   codebase pass that argument, so this is a no-op migration.
 */
export function useTranslation() {
  const { locale } = useLocale();

  // Stable t — only re-creates when locale changes. Critical for any
  // consumer that puts t in dependency arrays. See file header for the
  // bug class this prevents.
  const t = useCallback(
    (
      key: TranslationKey | string,
      params?: Record<string, string | number>
    ) => translate(key, params, locale),
    [locale]
  );

  // Memoize the returned object so destructuring patterns like
  // `const { t } = useTranslation()` get a stable reference, and so
  // that consumers comparing the whole object (rare but possible) see
  // referential equality across renders.
  return useMemo(() => ({ locale, t }), [locale, t]);
}