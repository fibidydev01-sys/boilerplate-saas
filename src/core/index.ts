/**
 * @/core — master barrel.
 *
 * Deep import tetap boleh & dianjurkan buat tree-shake optimal, misal:
 *   import { useAuthStore } from "@/core/auth/store";
 *   import { FullPageLoader } from "@/core/components";
 *
 * Barrel ini dipakai kalau butuh multiple symbol dari beberapa subdomain
 * sekaligus (umumnya di app-level wiring).
 *
 * Supabase clients TIDAK di-export di sini karena server/client/proxy
 * harus diimport dari file spesifik biar tree-shake-nya tepat.
 */

export * from "./auth";
export * from "./layout";
export * from "./components";
export { cn, getInitials, loginSchema, type LoginFormData } from "./lib";
export * from "./i18n";
export * from "./types";
export * from "./constants";
