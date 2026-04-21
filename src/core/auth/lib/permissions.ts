/**
 * Permission utilities — pure, framework-agnostic.
 *
 * Tidak punya dependency ke React/Zustand. Bisa dipake di:
 *   - Client components (via useAuth/usePermission hooks)
 *   - Server components & Route Handlers
 *   - Edge middleware
 *   - Unit tests
 *
 * Semua function di sini pure: same input → same output.
 */

import { permissionMatrix, type Permission } from "@/config";
import type { UserRole } from "@/config";

/**
 * Cek apakah role punya permission tertentu.
 *
 * Wildcard semantics:
 *   - "*" owned → match apapun
 *   - "users:*" owned → match "users:read", "users:write", "users:anything"
 *   - "commerce:orders:*" owned → match "commerce:orders:read", dst
 *
 * @param role       User role (string) — kalau undefined/invalid, return false
 * @param permission Permission yang dicek (e.g. "admin:access")
 * @returns          true kalau role punya permission
 *
 * @example
 *   can("admin", "users:read")     // true  (punya "users:*")
 *   can("admin", "billing:read")   // false (gak ada "billing:*")
 *   can("super_admin", "any:thing") // true  (punya "*")
 *   can("viewer", "content:write") // false
 */
export function can(
  role: string | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  if (!permission || typeof permission !== "string") return false;

  const owned = (permissionMatrix as Record<string, readonly string[]>)[role];
  if (!owned) return false;

  // Global wildcard → always allow
  if (owned.includes("*")) return true;

  // Exact match
  if (owned.includes(permission)) return true;

  // Segmented wildcard match:
  // For each owned "a:b:*", check if permission starts with "a:b:"
  for (const pattern of owned) {
    if (!pattern.endsWith(":*")) continue;
    const prefix = pattern.slice(0, -1); // "users:*" → "users:"
    if (permission.startsWith(prefix)) return true;
  }

  return false;
}

/**
 * Cek apakah role punya SEMUA permission di list.
 */
export function canAll(
  role: string | null | undefined,
  permissions: readonly Permission[]
): boolean {
  if (!role || permissions.length === 0) return false;
  return permissions.every((p) => can(role, p));
}

/**
 * Cek apakah role punya SETIDAKNYA SATU permission di list.
 */
export function canAny(
  role: string | null | undefined,
  permissions: readonly Permission[]
): boolean {
  if (!role || permissions.length === 0) return false;
  return permissions.some((p) => can(role, p));
}

/**
 * Shortcut: cek akses admin panel.
 *
 * Convention: admin panel gate = "admin:access".
 * Semua admin-role di appConfig.adminRoles otomatis punya ini di matrix.
 */
export function canAccessAdmin(role: string | null | undefined): boolean {
  return can(role, "admin:access");
}

/**
 * Ambil list lengkap permission untuk role (untuk debugging/audit).
 * Raw values, termasuk wildcard patterns.
 */
export function getPermissionsForRole(
  role: UserRole | string
): readonly string[] {
  return (
    (permissionMatrix as Record<string, readonly string[]>)[role] ?? []
  );
}
