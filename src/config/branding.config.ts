/**
 * Branding Configuration
 *
 * Single source of truth untuk semua yang berhubungan dengan identitas aplikasi.
 * Semua value di sini WAJIB bisa di-override via environment variable.
 *
 * Prinsip: ganti .env = ganti identitas. Zero code change.
 */

export const brandingConfig = {
  /**
   * Nama lengkap aplikasi. Muncul di:
   * - Browser tab title
   * - Meta tags
   * - PWA install prompt
   * - Welcome messages
   * - Legal & marketing content (interpolated via {appName} placeholder)
   */
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "My App",

  /**
   * Versi pendek dari nama. Muncul di:
   * - Sidebar logo text
   * - Header
   * - PWA short_name (home screen icon)
   * - Apple Web App title
   * - Inline button labels (e.g. "Get {shortName}")
   */
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME ?? "App",

  /**
   * Deskripsi aplikasi. Muncul di:
   * - Meta description (SEO)
   * - Login page subtitle
   * - PWA description
   */
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "A modern web application",

  /**
   * Tagline pendek untuk marketing/welcome.
   */
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE ?? "Welcome",

  /**
   * Contact email exposed pada legal pages, footer, dan halaman support.
   * Single source of truth — kalau diubah di .env, otomatis ke-update
   * di semua 5 dokumen legal + footer.
   */
  supportEmail:
    process.env.NEXT_PUBLIC_APP_SUPPORT_EMAIL ?? "admin@fibidy.com",

  /**
   * Governing law jurisdiction untuk License dan Terms of Service.
   * Free-form string — biasanya nama negara, bisa juga state/province
   * (e.g. "Delaware, United States", "Singapore", "England and Wales").
   *
   * Dipake di dua klausa: governing law + dispute resolution venue.
   */
  legalJurisdiction:
    process.env.NEXT_PUBLIC_APP_LEGAL_JURISDICTION ?? "Indonesia",

  /**
   * Asset paths. Replace file di public/branding/ untuk ganti.
   *
   * Required files (untuk PWA + fallback icons):
   *   /branding/logo.png              — 192x192 (main UI logo)
   *   /branding/logo-sm.png           — 96x96  (compact UI logo)
   *   /branding/favicon.ico           — multi-size favicon
   *   /branding/apple-touch-icon.png  — 180x180 (iOS home screen)
   *   /branding/icon-{48,72,96,144,192,512}.png — PWA manifest icons
   */
  assets: {
    logo: "/branding/logo.png",
    logoSmall: "/branding/logo-sm.png",
    favicon: "/branding/favicon.ico",
    appleTouchIcon: "/branding/apple-touch-icon.png",
  },

  /**
   * Theme colors & PWA display config.
   *
   * - primaryColor    : warna utama, di-reflect ke <meta theme-color>
   *                     (chrome bar warna di mobile browser)
   * - backgroundColor : warna splash screen PWA (saat app di-launch)
   * - themeColorMeta  : alias primaryColor untuk <meta> tags
   *
   * Warna UI di component pakai CSS variable --primary di globals.css.
   */
  theme: {
    primaryColor: process.env.NEXT_PUBLIC_APP_PRIMARY_COLOR ?? "#16a34a",
    backgroundColor: process.env.NEXT_PUBLIC_APP_BG_COLOR ?? "#ffffff",
    themeColorMeta: process.env.NEXT_PUBLIC_APP_PRIMARY_COLOR ?? "#16a34a",
  },

  /**
   * SEO & meta information.
   *
   * - keywords : comma-separated di env, di-parse ke array
   * - author   : nama pembuat (opsional, tampil di <meta name="author">)
   * - category : kategori PWA (productivity, social, education, dll)
   * - lang     : BCP-47 language tag untuk <html lang> & manifest lang
   *              Contoh: "id-ID", "en-US", "ja-JP"
   */
  meta: {
    keywords: (process.env.NEXT_PUBLIC_APP_KEYWORDS ?? "app,web,platform")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    author: process.env.NEXT_PUBLIC_APP_AUTHOR ?? "",
    category: process.env.NEXT_PUBLIC_APP_CATEGORY ?? "productivity",
    lang: process.env.NEXT_PUBLIC_APP_LANG ?? "id-ID",
  },
} as const;

export type BrandingConfig = typeof brandingConfig;
