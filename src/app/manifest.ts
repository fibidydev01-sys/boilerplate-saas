import type { MetadataRoute } from "next";
import { brandingConfig } from "@/config";

/**
 * Dynamic Web App Manifest.
 *
 * Next.js auto-exposes ini di /manifest.webmanifest (bukan /manifest.json).
 *
 * Icons array di-hardcode ke file yang BENERAN ada di public/branding/.
 * Naming-nya agak inconsistent karena hasil favicon generator standar:
 *   - favicon-32x32.png   (NxN suffix)
 *   - favicon-96x96.png   (NxN suffix)
 *   - favicon-128.png     (N suffix doang, no x128)
 *   - favicon-196x196.png (NxN suffix)
 *
 * Karena pattern-nya gak seragam, pakai array literal — bukan loop generator.
 *
 * PWA manifest spec minimum: 192x192. File 196x196 lo > 192, lolos.
 * 196x196 di-mark "any maskable" untuk Android adaptive icon —
 * pastikan design favicon punya safe zone (60% center) supaya gak ke-crop
 * di shape mask Android (circle, squircle, dll).
 *
 * Mau tambah size 256/384/512? Drop file ke public/branding/ dengan nama
 * konvensional (favicon-512x512.png) lalu append entry di array bawah.
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
        purpose: "any maskable",
      },
    ],
  };
}