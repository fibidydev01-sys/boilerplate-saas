import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/core/lib/supabase/proxy";
import { appConfig } from "@/config";
import { ROUTES } from "@/core/constants";

/**
 * ⚠️  FILE INI REPLACE `src/proxy.ts` KAMU YANG LAMA.
 *
 * Perubahan:
 *   + Tambah `/api/auth/confirm` ke publicRoutes (email OTP verifier)
 *   + Tambah `/api/auth/hooks/send-email` ke publicRoutes (Supabase webhook)
 *   Logic lainnya tidak berubah.
 *
 * Public routes = accessible tanpa auth session.
 *
 * NOTE: `/reset-password` masuk public karena user akses halaman ini via
 * magic link SEBELUM session terbentuk sepenuhnya (link dari email dibuka
 * di browser yang belum login).
 *
 * NOTE: `/api/auth/confirm` + `/api/auth/hooks/send-email` harus public.
 * Confirm: user belum punya session sampai verifyOtp sukses.
 * Hook: dipanggil Supabase service-side, bukan pake user session.
 */
const publicRoutes = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  "/api/auth/callback",
  "/api/auth/confirm",
  "/api/auth/hooks/send-email",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Check authentication (silent refresh di dalam updateSession)
  const { supabaseResponse, user } = await updateSession(request);

  // Redirect to login if not authenticated — set returnTo untuk deep-link
  if (!user) {
    const loginUrl = new URL(appConfig.auth.postLogoutRedirect, request.url);

    // Jangan set returnTo kalau root atau target login itu sendiri
    if (
      pathname &&
      pathname !== "/" &&
      pathname !== appConfig.auth.postLogoutRedirect
    ) {
      loginUrl.searchParams.set("returnTo", pathname + request.nextUrl.search);
    }

    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};