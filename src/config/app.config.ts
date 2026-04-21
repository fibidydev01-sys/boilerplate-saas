/**
 * Application Configuration
 *
 * Otak boilerplate. Semua behavior (selain branding) dikontrol dari sini.
 *
 * 4 area utama:
 * 1. modules  → toggle 8 boilerplate on/off
 * 2. auth     → role system, providers, redirect, role-based fallback
 * 3. payment  → Stripe mode & enablement
 * 4. locale   → i18n settings
 */

export const appConfig = {
  /**
   * 8 Boilerplate Modules.
   * Enable module yang dibutuhin, disable yang enggak.
   *
   * Tiap module idealnya self-contained di src/modules/<name>/.
   */
  modules: {
    admin: { enabled: true, path: "/admin" },
    saas: { enabled: false, path: "/workspace" },
    landing: { enabled: false, path: "/" },
    commerce: { enabled: false, path: "/shop" },
    blog: { enabled: false, path: "/blog" },
    project: { enabled: false, path: "/projects" },
    forum: { enabled: false, path: "/forum" },
    chat: { enabled: false, path: "/chat" },
  },

  /**
   * Auth configuration.
   *
   * providers      → auth method yang diaktifkan. LoginForm render tombol
   *                   sesuai list ini. Urutan di array = urutan render.
   * roles          → semua role yang valid di sistem (UserRole type).
   * adminRoles     → role yang punya akses admin panel (legacy compat;
   *                   permission sebenernya di permissions.config.ts).
   * defaultRole    → role otomatis saat user baru register.
   * postLoginRedirect  → fallback global kalau returnTo kosong & role
   *                      tidak punya override di roleRedirects.
   * roleRedirects  → per-role landing page setelah login. Admin-role →
   *                   /admin, role lain fallback ke postLoginRedirect.
   *                   Kalau ada returnTo param → returnTo menang.
   * postLogoutRedirect → kemana redirect setelah logout (juga = login page).
   */
  auth: {
    providers: ["email", "google", "magic-link"] as const,
    roles: ["super_admin", "admin", "editor", "viewer", "user"] as const,
    adminRoles: ["super_admin", "admin"] as const,
    defaultRole: "user" as const,
    postLoginRedirect: "/dashboard",
    postLogoutRedirect: "/login",
    roleRedirects: {
      super_admin: "/admin",
      admin: "/admin",
    } as Partial<Record<string, string>>,
  },

  /**
   * Payment (Stripe) configuration.
   *
   * enabled  → master switch, kalau false semua payment flow di-skip
   * mode     → "subscription" | "one-time" | "both"
   * provider → untuk sekarang cuma "stripe"
   */
  payment: {
    enabled: false,
    mode: "subscription" as "subscription" | "one-time" | "both",
    provider: "stripe" as const,
  },

  /**
   * Locale / i18n.
   *
   * default    → bahasa default aplikasi
   * available  → daftar bahasa yang di-support (harus ada file JSON-nya)
   */
  locale: {
    default: "id",
    available: ["id", "en"] as const,
  },
} as const;

export type AppConfig = typeof appConfig;
export type UserRole = (typeof appConfig.auth.roles)[number];
export type AdminRole = (typeof appConfig.auth.adminRoles)[number];
export type AuthProvider = (typeof appConfig.auth.providers)[number];
export type Locale = (typeof appConfig.locale.available)[number];
export type ModuleName = keyof typeof appConfig.modules;
export type PaymentMode = typeof appConfig.payment.mode;

/**
 * Helper: cek apakah role termasuk admin.
 *
 * LEGACY COMPAT: ini equivalent ke `can(role, "admin:access")` di sistem
 * permission baru. Tetap di-export karena masih dipake di beberapa tempat
 * (sidebar, mobile-nav). New code: pakai `can()` dari @/core/auth/lib.
 */
export function isAdminRole(role: string): boolean {
  return (appConfig.auth.adminRoles as readonly string[]).includes(role);
}

/**
 * Helper: cek apakah module enabled.
 */
export function isModuleEnabled(name: ModuleName): boolean {
  return appConfig.modules[name].enabled;
}

/**
 * Helper: ambil semua path module yang enabled.
 */
export function getEnabledModulePaths(): string[] {
  return Object.values(appConfig.modules)
    .filter((m) => m.enabled)
    .map((m) => m.path);
}

/**
 * Helper: tentuin destination redirect setelah login.
 *
 * Priority:
 *   1. returnTo (kalau valid path internal)
 *   2. roleRedirects[role] (admin → /admin, dst)
 *   3. postLoginRedirect (global fallback)
 *
 * returnTo di-validate: harus relative path ("/...") & bukan login/logout
 * (biar gak loop). External URL di-reject untuk cegah open-redirect.
 */
export function resolvePostLoginRedirect(
  role: string | undefined,
  returnTo?: string | null
): string {
  if (returnTo && isSafeInternalPath(returnTo)) {
    return returnTo;
  }
  if (role) {
    const roleDest = appConfig.auth.roleRedirects[role];
    if (roleDest) return roleDest;
  }
  return appConfig.auth.postLoginRedirect;
}

function isSafeInternalPath(path: string): boolean {
  if (typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  // Block protocol-relative (//evil.com) & backslash tricks
  if (path.startsWith("//") || path.startsWith("/\\")) return false;
  // Jangan redirect ke login/logout → cegah loop
  if (path.startsWith(appConfig.auth.postLogoutRedirect)) return false;
  return true;
}
