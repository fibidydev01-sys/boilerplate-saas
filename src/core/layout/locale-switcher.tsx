"use client";

/**
 * LocaleSwitcher — dropdown to toggle the active locale.
 *
 * Mount points (already wired in the layouts):
 *   - Dashboard header  : <LocaleSwitcher variant="compact" />  (icon only)
 *   - Marketing header  : <LocaleSwitcher variant="full" />     (icon + EN/ID)
 *
 * Adding a new locale:
 *   1. Drop a JSON file in src/core/i18n/locales/ matching en.json structure.
 *   2. Add the locale code to appConfig.locale.available.
 *   3. Add the matching entry to LOCALE_LABELS below — TS will require it
 *      because LOCALE_LABELS is typed as Record<Locale, ...>.
 */

import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale, useTranslation } from "@/core/i18n";
import { appConfig, type Locale } from "@/config";
import { cn } from "@/core/lib/utils";

/**
 * Display metadata per locale. Typed as Record<Locale, ...> so adding
 * a locale to appConfig WITHOUT adding it here is a compile error —
 * prevents shipping a half-configured switcher.
 */
const LOCALE_LABELS: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇬🇧" },
  id: { label: "Bahasa Indonesia", flag: "🇮🇩" },
};

interface LocaleSwitcherProps {
  /**
   * - "compact" : icon-only square button. Use in space-tight headers
   *               (dashboard, mobile).
   * - "full"    : icon + uppercase locale code (e.g. "EN"). Use in roomy
   *               headers (marketing desktop, mobile sheet).
   */
  variant?: "compact" | "full";
}

export function LocaleSwitcher({ variant = "compact" }: LocaleSwitcherProps) {
  const { locale, setLocale, isPending } = useLocale();
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "compact" ? "icon" : "sm"}
          className={cn(isPending && "opacity-60")}
          aria-label={t("localeSwitcher.ariaLabel")}
          disabled={isPending}
        >
          <Globe className="size-4" />
          {variant === "full" && (
            <span className="ml-2 text-sm font-medium uppercase">{locale}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {appConfig.locale.available.map((loc) => {
          const item = LOCALE_LABELS[loc];
          const isActive = locale === loc;
          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => setLocale(loc)}
              className="cursor-pointer"
            >
              <span className="mr-2">{item.flag}</span>
              <span className="flex-1">{item.label}</span>
              {isActive && <Check className="size-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
