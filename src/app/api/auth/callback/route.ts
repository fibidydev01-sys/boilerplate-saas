import { createClient } from "@/core/lib/supabase/server";
import { fetchActiveProfile } from "@/core/auth/services";
import { appConfig, resolvePostLoginRedirect } from "@/config";
import { NextResponse } from "next/server";

/**
 * OAuth / Magic Link callback handler.
 *
 * Flow:
 *   1. Exchange `code` ke session
 *   2. Fetch profile untuk dapet role
 *   3. Resolve redirect destination: `next` (returnTo) > role-based > global
 *
 * Query params:
 *   - code : dari Supabase OAuth/OTP flow (required)
 *   - next : returnTo path, sama konvensi dengan proxy middleware
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  // Base redirect helper — hormati forwarded host di production
  const buildRedirect = (path: string) => {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";

    if (isLocalEnv) return NextResponse.redirect(`${origin}${path}`);
    if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${path}`);
    return NextResponse.redirect(`${origin}${path}`);
  };

  if (!code) {
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?error=auth_callback_error`
    );
  }

  const supabase = await createClient();
  const { error: exchangeError, data } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.session) {
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?error=auth_callback_error`
    );
  }

  // Ambil profile untuk role-based redirect
  const { profile } = await fetchActiveProfile(supabase, data.session.user.id);

  // Kalau profile gak ada atau non-active — sign out & kirim balik ke login
  if (!profile) {
    await supabase.auth.signOut();
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?error=account_not_registered`
    );
  }

  const dest = resolvePostLoginRedirect(profile.role, next);
  return buildRedirect(dest);
}
