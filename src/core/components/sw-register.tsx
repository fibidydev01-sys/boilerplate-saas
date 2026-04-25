"use client";

import { useEffect } from "react";

/**
 * Service Worker registration.
 *
 * Mounted di root layout (`src/app/layout.tsx`). Register `/sw.js` setelah
 * `window.load` di production. Di dev: skip — biar gak conflict sama HMR
 * / Fast Refresh / dev cache.
 *
 * Kenapa SW perlu di-register?
 *   PWA install criteria Chrome:
 *     1. Manifest valid + icon ≥192px purpose:any  ✓ sudah
 *     2. Service worker ACTIVE dengan fetch handler   ← butuh registration ini
 *     3. HTTPS (atau localhost di dev)                ✓
 *   Tanpa step 2, browser gak nampilin install prompt — meski file sw.js
 *   ada di public/, browser gak akan auto-execute kalau gak di-register.
 *
 * Mau test PWA install di dev?
 *   1. Comment baris `if (process.env.NODE_ENV !== "production") return;`
 *   2. Hard refresh (Ctrl+Shift+R) supaya SW lama gak nyangkut di cache
 *   3. DevTools → Application → Service Workers → cek registration aktif
 *   4. DevTools → Application → Manifest → klik "Install" preview
 *   5. Restore `if` setelah selesai test
 *
 * Kenapa pake `useEffect` + `window.load` (bukan langsung di module top-level)?
 *   - Module-level execution akan run saat hydration, sebelum critical render.
 *     SW registration agak berat (parse + install + activate) → bisa block paint.
 *   - `window.load` event = semua resource udah loaded → registration gak
 *     ganggu first-paint experience.
 *   - `useEffect` ensures hanya jalan client-side, gak SSR.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        // Production: keep error visible buat debugging via remote logs.
        console.error("[SW] Registration failed:", err);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}