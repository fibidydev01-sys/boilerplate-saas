"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { brandingConfig } from "@/config";
import { useTranslation } from "@/core/i18n";
import { cn } from "@/core/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * PWA Install Banner — push user untuk install app sebagai PWA.
 *
 * Mounted di root layout. Logic:
 *
 * 1. Cek apakah app sudah di-install (PWA standalone mode) → skip kalau iya.
 * 2. Cek apakah user baru-baru ini dismiss → skip kalau dalam DISMISS_DAYS.
 * 3. Detect iOS Safari (gak punya beforeinstallprompt event) →
 *    tampilin banner mode "ios" dengan instruksi manual.
 * 4. Browser lain (Chrome/Edge/Android) → listen event beforeinstallprompt,
 *    capture dengan e.preventDefault(), simpan referensi event, render
 *    banner mode "promptable" dengan tombol Install yang trigger
 *    deferredPrompt.prompt() saat di-klik.
 * 5. Listen event "appinstalled" → hide banner kalau install berhasil.
 *
 * Catatan penting tentang Chrome behavior:
 *   - beforeinstallprompt fire setelah Chrome decide PWA "engaged enough"
 *     (heuristik: SW registered + manifest valid + user interaction).
 *   - Di production build pertama kali visit, event biasanya fire dalam
 *     beberapa detik. Banner muncul saat itu juga.
 *   - Di development (`pnpm dev`), SW gak register (lihat sw-register.tsx)
 *     → event gak fire → banner gak muncul. Test pake `pnpm build && pnpm start`.
 *
 * iOS Safari note:
 *   - Banner mode "ios" muncul langsung di first visit (no event needed).
 *   - User harus manual Tap Share → Add to Home Screen.
 *   - Setelah ditambah ke home screen, future visit dari home screen akan
 *     dideteksi sebagai standalone → banner gak muncul lagi.
 */

const STORAGE_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 3;
const DAY_MS = 86_400_000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

type Mode = "hidden" | "promptable" | "ios";

export function PWAInstallBanner() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("hidden");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Step 1: Already installed?
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari pre-PWA standalone flag
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (isStandalone) return;

    // Step 2: Recently dismissed?
    if (recentlyDismissed()) return;

    // Step 3: iOS detection (no beforeinstallprompt support)
    const ua = window.navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    if (isIOS) {
      setMode("ios");
      return;
    }

    // Step 4: Chrome/Edge/Android — listen for browser-fired install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode("promptable");
    };

    // Step 5: Handle successful install — hide banner
    const handleAppInstalled = () => {
      setMode("hidden");
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "dismissed") {
        // User said no via native dialog — record dismiss
        recordDismiss();
      }
    } catch (err) {
      console.error("[PWA] Install prompt failed:", err);
    } finally {
      setMode("hidden");
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    recordDismiss();
    setMode("hidden");
  };

  if (mode === "hidden") return null;

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
      className={cn(
        // Mobile: full-width sticky bottom with safe-area
        "fixed inset-x-2 z-[60] rounded-lg border bg-card text-card-foreground p-4 shadow-lg",
        "bottom-[max(0.5rem,env(safe-area-inset-bottom))]",
        // Desktop: bottom-right card
        "md:inset-x-auto md:left-auto md:right-4 md:bottom-4 md:max-w-sm",
        // Animation
        "animate-in slide-in-from-bottom-4 fade-in duration-300"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={brandingConfig.assets.logo}
            alt={brandingConfig.name}
            fill
            sizes="40px"
            className="object-contain p-1"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3
            id="pwa-install-title"
            className="text-sm font-semibold leading-tight"
          >
            {t("pwa.install.title", { appName: brandingConfig.name })}
          </h3>
          <p
            id="pwa-install-description"
            className="mt-0.5 text-xs leading-snug text-muted-foreground"
          >
            {t("pwa.install.description")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={t("pwa.install.dismiss")}
          className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {mode === "promptable" ? (
        <div className="mt-3">
          <Button onClick={handleInstall} size="sm" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            {t("pwa.install.button")}
          </Button>
        </div>
      ) : (
        <div className="mt-3 rounded-md bg-muted/60 p-2.5 text-xs">
          <p className="mb-1 font-medium">{t("pwa.install.iosTitle")}</p>
          <ol className="list-inside list-decimal space-y-0.5 text-muted-foreground">
            <li>{t("pwa.install.iosStep1")}</li>
            <li>{t("pwa.install.iosStep2")}</li>
          </ol>
        </div>
      )}
    </div>
  );
}

function recentlyDismissed(): boolean {
  try {
    const dismissedAt = window.localStorage.getItem(STORAGE_KEY);
    if (!dismissedAt) return false;
    const elapsedDays = (Date.now() - parseInt(dismissedAt, 10)) / DAY_MS;
    return elapsedDays < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function recordDismiss() {
  try {
    window.localStorage.setItem(STORAGE_KEY, Date.now().toString());
  } catch {
    // localStorage unavailable (private mode, etc.) — ignore
  }
}
