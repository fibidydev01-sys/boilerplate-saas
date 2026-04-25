/**
 * Email OTP confirmation handler.
 *
 * Endpoint: GET /api/auth/confirm
 *
 * Dipakai untuk semua email-based auth confirmation:
 *   - Signup confirmation       (type=signup)
 *   - Magic link login          (type=magiclink)
 *   - Password recovery         (type=recovery)
 *   - Email address change      (type=email_change)
 *   - Invite acceptance         (type=invite)
 *
 * Link format dari email (dibangun di `shared/email/send-auth-email.tsx`):
 *   {SITE_URL}/api/auth/confirm?token_hash=xxx&type=signup&next=/dashboard
 *
 * Flow:
 *   1. Extract token_hash + type dari query
 *   2. supabase.auth.verifyOtp() → establish session
 *   3. Branch berdasarkan type:
 *      - recovery → redirect ke /reset-password
 *      - signup/magiclink/invite → verify profile + role-aware redirect
 *      - email_change → redirect ke profile atau dashboard
 *   4. Log activity (skip untuk recovery — bukan "login" sebenarnya)
 *
 * Berbeda dengan `/api/auth/callback`:
 *   - /callback   → OAuth PKCE (pake `exchangeCodeForSession` + `code` param)
 *   - /confirm    → Email OTP    (pake `verifyOtp` + `token_hash` param)
 *   Mereka GAK BISA di-merge karena API Supabase-nya beda.
 *
 * Chain unwrap (penting):
 *   Form-form (register/forgot-password/magic-link) set `emailRedirectTo`
 *   ke `/api/auth/callback?next=X` — pattern dari PKCE era. Supabase
 *   forward itu ke sini sebagai `next`. Kalau kita redirect mentah-mentah,
 *   user landing di /callback tanpa `code` → error loop. Solusi: unwrap
 *   dulu sebelum resolve — ambil inner `next`-nya aja. Non-invasive,
 *   form existing gak perlu diubah.
 *
 *   Kalau nanti form-form di-refactor set `emailRedirectTo` langsung ke
 *   dest final, unwrap ini jadi no-op dan aman di-remove.
 *
 * RLS dependency:
 *   verifyProfile() query ke user_profiles tunduk RLS. Policy admin
 *   harus pake public.is_admin() (SECURITY DEFINER) — kalau inline
 *   subquery, bakal 42P17 infinite recursion. Fix ada di setup.sql v2.
 */

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/core/lib/supabase/server";
import {
  verifyProfile,
  logActivity,
  ActivityAction,
} from "@/core/auth/services";
import { getClientIP, getUserAgent } from "@/core/lib/request";
import { appConfig, resolvePostLoginRedirect } from "@/config";
import { ROUTES } from "@/core/constants";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next");

  // Unwrap /api/auth/callback?next=X legacy chain sebelum resolve redirect.
  const next = unwrapCallbackNext(rawNext);

  // Helper: build absolute redirect URL — honor forwarded host di prod
  const buildRedirect = (path: string) => {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    if (isLocalEnv) return NextResponse.redirect(`${origin}${path}`);
    if (forwardedHost)
      return NextResponse.redirect(`https://${forwardedHost}${path}`);
    return NextResponse.redirect(`${origin}${path}`);
  };

  // 1. Validate params
  if (!token_hash || !type) {
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?error=auth_callback_error`
    );
  }

  // 2. Verify OTP — establish session kalau valid
  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash,
    type,
  });

  if (verifyError) {
    console.error("[confirm] verifyOtp failed:", verifyError.message);
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?error=auth_callback_error`
    );
  }

  // 3. Recovery flow — skip profile check + login log,
  //    langsung ke /reset-password
  if (type === "recovery") {
    const dest =
      next && next.startsWith(ROUTES.RESET_PASSWORD)
        ? next
        : ROUTES.RESET_PASSWORD;
    return buildRedirect(dest);
  }

  // 4. Other flows — get user + verify profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?error=auth_callback_error`
    );
  }

  const verification = await verifyProfile(supabase, user.id);

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

  // 5. Log activity — "login" untuk flow yang implicitly sign in user
  //    (signup confirm, magic link, invite). email_change tidak log
  //    karena user udah login sebelumnya.
  const shouldLogLogin =
    type === "signup" || type === "magiclink" || type === "invite";

  if (shouldLogLogin) {
    await logActivity(supabase, {
      action: ActivityAction.UserLogin,
      metadata: { provider: "email", confirmation_type: type },
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
    });
  }

  // 6. Role-aware redirect
  const dest = resolvePostLoginRedirect(
    verification.role ?? undefined,
    next
  );
  return buildRedirect(dest);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Unwrap `/api/auth/callback?next=X` → X.
 *
 * Kenapa perlu ini:
 *   Form auth existing (register/forgot-password/magic-link) set
 *   `emailRedirectTo` ke `/api/auth/callback?next=<finalDest>` — pattern
 *   dari era PKCE flow (pre-Send Email Hook). Dengan Send Email Hook aktif,
 *   email link-nya ke /api/auth/confirm, yang verifyOtp di sini, BUKAN
 *   lewat /callback lagi. Kalau kita redirect ke /callback tanpa `code`,
 *   dia auto-error → user stuck di login.
 *
 *   Unwrap recursive kalau di-wrap double (defensive). Recursion bounded
 *   karena tiap unwrap strip satu layer.
 *
 * Keeps paths yang udah aman (mulai dengan `/` dan bukan /callback)
 * apa adanya — `resolvePostLoginRedirect` nanti yang final-sanitize.
 */
function unwrapCallbackNext(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/api/auth/callback")) return raw;

  try {
    // Parse dengan dummy base karena string-nya relative
    const u = new URL(raw, "http://unwrap.local");
    const inner = u.searchParams.get("next");
    // Recurse kalau inner juga wrapped callback (shouldn't happen, tapi defensive)
    return unwrapCallbackNext(inner);
  } catch {
    return null;
  }
}