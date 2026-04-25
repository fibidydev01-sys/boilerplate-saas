import type { MetadataRoute } from "next";
import { brandingConfig } from "@/config";

/**
 * Dynamic Web App Manifest.
 *
 * Next.js auto-exposes ini di /manifest.webmanifest (bukan /manifest.json).
 *
 * Icons array di-hardcode ke file yang BENERAN ada di public/branding/.
 * Naming-nya inconsistent karena hasil favicon generator standar:
 *   - favicon-32x32.png   (NxN suffix)
 *   - favicon-96x96.png   (NxN suffix)
 *   - favicon-128.png     (N suffix doang, no x128)
 *   - favicon-196x196.png (NxN suffix)
 *
 * Semua di-mark `purpose: "any"` (no maskable) karena:
 *   1. Chrome PWA install criteria butuh minimal 1 icon ≥192px dengan
 *      `purpose: "any"` (atau no purpose). `"any"` paling kompatibel.
 *   2. File favicon standar TIDAK didesain dengan maskable safe zone
 *      (60% center). Kalau di-mark "maskable", icon akan ke-crop weird
 *      di Android adaptive shape (circle/squircle).
 *   3. Mau aktifin maskable? Design icon dengan safe zone properly,
 *      simpan sebagai `/branding/icon-maskable-512.png`, lalu tambah
 *      entry baru dengan `purpose: "maskable"` (separate dari "any").
 *
 * 196x196 icon pas-pasan di atas threshold 192 → cukup untuk install
 * criteria + pinned shortcut Android Chrome.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: brandingConfig.name,
    short_name: brandingConfig.shortName,
    description: brandingConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: brandingConfig.theme.backgroundColor,
    theme_color: brandingConfig.theme.primaryColor,
    categories: [brandingConfig.meta.category],
    lang: brandingConfig.meta.lang,
    dir: "ltr",
    icons: [
      {
        src: "/branding/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/branding/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/branding/favicon-128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/branding/favicon-196x196.png",
        sizes: "196x196",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}