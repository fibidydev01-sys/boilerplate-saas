"use client";

import { useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/core/auth/store";
import { can as canFn, canAccessAdmin as canAccessAdminFn } from "@/core/auth/lib";
import { appConfig } from "@/config";
import type { Permission } from "@/config";

/**
 * useAuth — facade untuk typical consumer.
 *
 * Expose state + actions + permission helpers dalam satu object.
 * Auto-fetch user on mount kalau belum.
 *
 * Design:
 *   - Tiap field di-subscribe granular via useAuthStore(selector).
 *     React akan re-render component cuma kalau field yang dibaca berubah.
 *   - `can` & `canAccessAdmin` di-memoize per user.role biar referensi stabil.
 *
 * Performance escape hatch:
 *   - Kalau butuh granular subscription (misal cuma `isLoading`),
 *     tetap boleh pake `useAuthStore(s => s.isLoading)` langsung.
 *
 * @example
 *   const { user, isAuthenticated, can, logout } = useAuth();
 *   if (can("users:write")) { ... }
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const hasFetched = useAuthStore((state) => state.hasFetched);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  const storeLogout = useAuthStore((state) => state.logout);
  const router = useRouter();

  useEffect(() => {
    if (!hasFetched && !isLoading) {
      fetchUser();
    }
  }, [hasFetched, isLoading, fetchUser]);

  const logout = useCallback(async () => {
    await storeLogout();
    router.push(appConfig.auth.postLogoutRedirect);
  }, [storeLogout, router]);

  const role = user?.role;

  // Memoize permission checker — stable reference as long as role doesn't change
  const can = useCallback(
    (permission: Permission) => canFn(role, permission),
    [role]
  );

  const canAccessAdmin = useMemo(() => canAccessAdminFn(role), [role]);

  return {
    // State
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    hasFetched,
    // Actions
    fetchUser,
    logout,
    // Permission helpers
    can,
    canAccessAdmin,
  };
}
