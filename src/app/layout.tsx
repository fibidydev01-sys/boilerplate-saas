import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/core/auth";
import {
  OfflineDetector,
  PWAInstallBanner,
  ServiceWorkerRegister,
} from "@/core/components";
import { LocaleProvider } from "@/core/i18n";
import { getServerLocale } from "@/core/i18n/get-locale";
import { brandingConfig } from "@/config";

export const metadata: Metadata = {
  title: {
    default: brandingConfig.name,
    template: `%s | ${brandingConfig.shortName}`,
  },
  description: brandingConfig.description,

  // Note: manifest tidak perlu explicit — Next.js auto-discover
  // `src/app/manifest.ts` dan expose di /manifest.webmanifest.

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: brandingConfig.shortName,
  },

  /**
   * Icons metadata — listing eksplisit ke file yang ADA di public/branding/.
   *
   * Folder boilerplate punya hasil favicon generator standar:
   *   - favicon-{16x16, 32x32, 96x96, 128, 196x196}.png + favicon.ico
   *   - apple-touch-icon-{57,60,72,76,114,120,144,152}x{N}.png  (8 sizes)
   *
   * Browser akan pilih icon paling cocok berdasarkan size hint + DPR device.
   */
  icons: {
    icon: [
      { url: brandingConfig.assets.favicon },
      { url: "/branding/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/branding/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/branding/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/branding/favicon-128.png", sizes: "128x128", type: "image/png" },
      { url: "/branding/favicon-196x196.png", sizes: "196x196", type: "image/png" },
    ],
    apple: [
      { url: "/branding/apple-touch-icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/branding/apple-touch-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/branding/apple-touch-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/branding/apple-touch-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/branding/apple-touch-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/branding/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/branding/apple-touch-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/branding/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },

  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  applicationName: brandingConfig.name,
  authors: brandingConfig.meta.author
    ? [{ name: brandingConfig.meta.author }]
    : undefined,
  keywords: brandingConfig.meta.keywords,
  category: brandingConfig.meta.category,
};

export const viewport: Viewport = {
  themeColor: brandingConfig.theme.themeColorMeta,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * Root layout — async to read the locale cookie at request time.
 *
 * Provider stack (outermost → innermost):
 *   LocaleProvider         — owns active locale + i18n t() context
 *   AuthProvider           — passthrough; placed inside Locale
 *   children               — page tree
 *   OfflineDetector        — sibling under AuthProvider; uses t()
 *   PWAInstallBanner       — sibling inside LocaleProvider (uses t());
 *                            mounted di sini supaya muncul di seluruh app
 *                            (marketing + auth + dashboard).
 *   Toaster                — locale-agnostic; sits outside the auth tree
 *   ServiceWorkerRegister  — null-renderer client component, registers
 *                            /sw.js after window.load (production only).
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Apple-touch-icon fallback tag (no-size) — iOS akan pakai ini kalau
            gak nemu match dari metadata.apple array di atas. */}
        <link
          rel="apple-touch-icon"
          href={brandingConfig.assets.appleTouchIcon}
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="default"
        />
        <meta
          name="apple-mobile-web-app-title"
          content={brandingConfig.shortName}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="msapplication-TileColor"
          content={brandingConfig.theme.themeColorMeta}
        />
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL}
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased">
        <LocaleProvider initialLocale={locale}>
          <AuthProvider>
            {children}
            <OfflineDetector />
          </AuthProvider>
          <PWAInstallBanner />
        </LocaleProvider>
        <Toaster position="top-center" richColors />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
