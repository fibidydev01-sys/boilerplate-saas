import { createClient } from "@/core/lib/supabase/server";
import {
  verifyProfile,
  logActivity,
  ActivityAction,
} from "@/core/auth/services";
import { getClientIP, getUserAgent } from "@/core/lib/request";
import { appConfig, resolvePostLoginRedirect } from "@/config";
import { ROUTES } from "@/core/constants";
import { NextResponse } from "next/server";

/**
 * OAuth / Magic Link / Password Recovery callback handler.
 *
 * Flow:
 *   1. Exchange `code` (PKCE) ke session
 *   2. Verify profile existence & active status
 *   3. Branch:
 *      - Recovery flow (next=/reset-password): redirect langsung, skip login log
 *      - Normal flow: log user.login + role-aware redirect
 *
 * Query params:
 *   - code : dari Supabase OAuth/OTP/recovery flow (required)
 *   - next : returnTo path, sama konvensi dengan proxy middleware.
 *            Kalau next === /reset-password, treated as recovery flow.
 *
 * Error handling — redirect ke login dengan error code:
 *   - auth_callback_error       : code missing atau exchange gagal
 *   - account_not_registered    : session OK tapi profile tidak ada
 *   - account_deactivated       : session OK, profile ada, tapi is_active=false
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
    if (forwardedHost)
      return NextResponse.redirect(`https://${forwardedHost}${path}`);
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

  // Verify profile — pake verifyProfile (bukan fetchActiveProfile) supaya
  // bisa bedain case "gak ada" vs "deactivated". Kalau pake fetchActiveProfile
  // yang filter is_active=true, deactivated user dapet pesan misleading
  // "account_not_registered".
  const verification = await verifyProfile(supabase, data.session.user.id);

  if (verification.error || !verification.exists) {
    await supabase.auth.signOut();
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?error=account_not_registered`
    );
  }

  if (!verification.isActive) {
    await supabase.auth.signOut();
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?error=account_deactivated`
    );
  }

  // Recovery flow — user dari /forgot-password ke sini.
  // Direct redirect ke /reset-password tanpa log "user.login" (bukan login
  // dalam arti sebenarnya — cuma exchange token untuk reset password).
  const isRecoveryFlow = !!next && next.startsWith(ROUTES.RESET_PASSWORD);
  if (isRecoveryFlow) {
    return buildRedirect(next);
  }

  // Normal login flow — log activity + role-aware redirect
  await logActivity(supabase, {
    action: ActivityAction.UserLogin,
    metadata: {
      provider: data.session.user.app_metadata?.provider ?? "unknown",
    },
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
  });

  const dest = resolvePostLoginRedirect(
    verification.role ?? undefined,
    next
  );
  return buildRedirect(dest);
}