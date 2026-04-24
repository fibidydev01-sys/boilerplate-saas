import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/core/lib/supabase/proxy";
import { appConfig } from "@/config";
import { isPublicRoute, ROUTES } from "@/core/constants";

/**
 * Proxy (Next.js middleware).
 *
 * Three-phase routing decision:
 *
 *   1. Marketing root ("/") redirect for LOGGED-IN users:
 *      If a user is authenticated and lands on "/", bounce them to the
 *      post-login destination (dashboard / admin / role-specific target).
 *      Landing page is for unauthenticated prospects.
 *
 *   2. Public routes (landing, pricing, legal, auth pages, etc.):
 *      Refresh Supabase session (so logged-in users still see their
 *      session-aware header) but allow the request through.
 *
 *   3. Protected routes:
 *      Require an authenticated user. Unauthenticated users get redirected
 *      to /login with a returnTo param preserving their deep link.
 *
 * NOTE: `/reset-password` is public because users land there via magic link
 * BEFORE a session fully forms.
 *
 * NOTE: `/api/auth/confirm` and `/api/auth/hooks/send-email` are public.
 * Confirm: user has no session until verifyOtp succeeds.
 * Hook: called server-side by Supabase, not via a user session.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Phase 0: Refresh session for every request we're handling.
  // This keeps cookies fresh even for public pages.
  const { supabaseResponse, user } = await updateSession(request);

  // Phase 1: Logged-in user hitting "/" → bounce to dashboard.
  // Respects appConfig.auth.postLoginRedirect (currently "/dashboard").
  if (pathname === ROUTES.HOME && user) {
    const dashboardUrl = new URL(
      appConfig.auth.postLoginRedirect,
      request.url
    );
    return NextResponse.redirect(dashboardUrl);
  }

  // Phase 2: Public routes — allow through.
  if (isPublicRoute(pathname)) {
    return supabaseResponse;
  }

  // Phase 3: Protected routes — require auth.
  if (!user) {
    const loginUrl = new URL(appConfig.auth.postLogoutRedirect, request.url);

    // Preserve deep-link via returnTo (skip for trivial targets)
    if (
      pathname &&
      pathname !== ROUTES.HOME &&
      pathname !== appConfig.auth.postLogoutRedirect
    ) {
      loginUrl.searchParams.set(
        "returnTo",
        pathname + request.nextUrl.search
      );
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
     * - favicon.ico
     * - image files in public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};