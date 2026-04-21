"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/core/auth/store";
import { can as canFn } from "@/core/auth/lib";
import type { Permission } from "@/config";

/**
 * Cek apakah current user punya satu permission spesifik.
 *
 * @example
 *   const canEditUsers = usePermission("users:write");
 *   if (!canEditUsers) return <Forbidden />;
 */
export function usePermission(permission: Permission): boolean {
  const role = useAuthStore((state) => state.user?.role);
  return canFn(role, permission);
}

/**
 * Return permission checker function — reactive ke user role.
 *
 * Useful kalau component perlu cek banyak permission (hindari manggil
 * usePermission berkali-kali di render yang sama).
 *
 * @example
 *   const check = usePermissions();
 *   const canEdit = check("users:write");
 *   const canDelete = check("users:delete");
 */
export function usePermissions(): (permission: Permission) => boolean {
  const role = useAuthStore((state) => state.user?.role);
  return useCallback((permission: Permission) => canFn(role, permission), [role]);
}
