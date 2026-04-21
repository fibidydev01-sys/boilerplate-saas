import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/core/auth";
import { OfflineDetector } from "@/core/components";
import { appConfig, brandingConfig } from "@/config";

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

  icons: {
    icon: [
      { url: brandingConfig.assets.favicon },
      { url: brandingConfig.assets.logoSmall, sizes: "96x96", type: "image/png" },
      { url: brandingConfig.assets.logo, sizes: "192x192", type: "image/png" },
    ],
    apple: [
      {
        url: brandingConfig.assets.appleTouchIcon,
        sizes: "180x180",
        type: "image/png",
      },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={appConfig.locale.default} suppressHydrationWarning>
      <head>
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
        <AuthProvider>
          {children}
          <OfflineDetector />
        </AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}