"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/core/auth/hooks";
import { useAuthStore } from "@/core/auth/store";
import { createClient } from "@/core/lib/supabase/client";
import { FullPageLoader } from "@/core/components";
import { MobileBottomNav, AppSidebar, UserMenu } from "@/core/layout";
import { appConfig, brandingConfig } from "@/config";
import { t } from "@/core/i18n";

/**
 * DashboardLayout — auth guard + layout utama.
 *
 * Tanggung jawab:
 * 1. Fetch user saat mount (di-handle internal oleh useAuth)
 * 2. onAuthStateChange listener TUNGGAL untuk seluruh app
 * 3. Redirect ke login + set returnTo kalau tidak authenticated
 * 4. Render sidebar + header + mobile nav
 *
 * Migration note: sebelumnya pake granular selectors langsung dari
 * useAuthStore. Sekarang pake useAuth facade. Granular subscription
 * tetep terjadi karena facade di dalamnya pake selector per field —
 * jadi re-render behavior identik.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const authListenerSetup = useRef(false);

  const { user, isLoading, hasFetched, fetchUser } = useAuth();

  // Reset — akses langsung dari store (bukan action yang sering dipake)
  const reset = useAuthStore((state) => state.reset);

  // Auth state listener — satu-satunya di seluruh app
  useEffect(() => {
    if (authListenerSetup.current) return;
    authListenerSetup.current = true;

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        reset();
        router.push(appConfig.auth.postLogoutRedirect);
      } else if (event === "SIGNED_IN" && session) {
        const state = useAuthStore.getState();
        if (!state.user) {
          fetchUser();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      authListenerSetup.current = false;
    };
  }, [router, reset, fetchUser]);

  // Redirect guard — set returnTo supaya setelah login balik ke halaman asal
  useEffect(() => {
    if (hasFetched && !isLoading && !user) {
      const loginUrl = new URL(
        appConfig.auth.postLogoutRedirect,
        window.location.origin
      );
      if (pathname && pathname !== "/") {
        loginUrl.searchParams.set("returnTo", pathname);
      }
      router.push(loginUrl.pathname + loginUrl.search);
    }
  }, [hasFetched, isLoading, user, router, pathname]);

  if (!hasFetched) {
    return <FullPageLoader text={t("common.loading")} />;
  }

  if (isLoading) {
    return <FullPageLoader text={t("common.authenticating")} />;
  }

  if (!user) {
    return <FullPageLoader text={t("common.redirecting")} />;
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      <div className="flex flex-1 flex-col md:ml-64">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src={brandingConfig.assets.logoSmall}
                alt={brandingConfig.shortName}
                fill
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-sm md:text-base">
              {brandingConfig.shortName}
            </span>
          </Link>

          <div className="flex-1" />

          <UserMenu />
        </header>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <div className="container mx-auto p-4 md:p-6">{children}</div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
