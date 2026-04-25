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
   */
  supportEmail:
    process.env.NEXT_PUBLIC_APP_SUPPORT_EMAIL ?? "admin@fibidy.com",

  /**
   * Governing law jurisdiction untuk License dan Terms of Service.
   */
  legalJurisdiction:
    process.env.NEXT_PUBLIC_APP_LEGAL_JURISDICTION ?? "Indonesia",

  /**
   * Purchase URL — link checkout eksternal (Gumroad / Lemon Squeezy / dll).
   * Kosong = pricing button fallback ke "#pricing" anchor.
   */
  purchaseUrl: process.env.NEXT_PUBLIC_APP_PURCHASE_URL ?? "",

  /**
   * Asset paths — dipetakan ke file yang ADA di public/branding/.
   *
   * Folder lo punya hasil generator favicon standar:
   *   - favicon.ico
   *   - favicon-{16x16, 32x32, 96x96, 128, 196x196}.png
   *   - apple-touch-icon-{57,60,72,76,114,120,144,152}x{N}.png
   *   - mstile-{70,144,150,310,310x150}.png   (Windows pinned tile, opt-in)
   *
   * Mapping di sini:
   *   - `logo`           → favicon terbesar (196x196), dipake di slot UI 40-64px
   *                        (auth panel kiri, FinalCTA section).
   *   - `logoSmall`      → favicon 96x96, dipake di slot UI 32px
   *                        (sidebar, header dashboard, marketing header/footer).
   *   - `favicon`        → favicon.ico legacy (tab browser).
   *   - `appleTouchIcon` → apple-touch-icon-152x152.png (size terbesar yang lo
   *                        punya, dipake sebagai fallback `<link rel="apple-touch-icon">`).
   *
   * Catatan: nama property "logo" / "logoSmall" sengaja dipertahankan walau
   * file fisiknya favicon — UI component pakai property ini sebagai brand mark.
   * Selama image-nya square dan crisp di ukuran 32-64px, dia berfungsi sebagai
   * UI logo. Mau ganti ke vector logo asli nanti? Drop `logo.png` ke folder,
   * update path-nya di sini.
   *
   * Manifest icons + apple touch icon multi-size dilist eksplisit di
   * `src/app/manifest.ts` dan `src/app/layout.tsx` (icons metadata).
   *
   * authBackground:
   *   Background image untuk auth pages (50/50 split layout).
   *   Bisa pake remote URL (CDN) atau local path (/branding/auth-bg.jpg).
   *   Default: Cloudinary stock — buyer ganti ke brand-specific image.
   */
  assets: {
    logo: "/branding/favicon-196x196.png",
    logoSmall: "/branding/favicon-96x96.png",
    favicon: "/branding/favicon.ico",
    appleTouchIcon: "/branding/apple-touch-icon-152x152.png",
    authBackground:
      process.env.NEXT_PUBLIC_APP_AUTH_BG ??
      "https://res.cloudinary.com/dxxds8jkx/image/upload/v1777108648/background_h7lslb.jpg",
  },

  /**
   * Theme colors & PWA display config.
   */
  theme: {
    primaryColor: process.env.NEXT_PUBLIC_APP_PRIMARY_COLOR ?? "#16a34a",
    backgroundColor: process.env.NEXT_PUBLIC_APP_BG_COLOR ?? "#ffffff",
    themeColorMeta: process.env.NEXT_PUBLIC_APP_PRIMARY_COLOR ?? "#16a34a",
  },

  /**
   * SEO & meta information.
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