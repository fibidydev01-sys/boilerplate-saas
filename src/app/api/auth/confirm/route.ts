/**
 * DIAGNOSTIC confirm route — temporary replacement buat debug.
 *
 * Log semua step biar keliatan di mana patahnya:
 *   1. verifyOtp result (error / success)
 *   2. User dari getUser()
 *   3. JWT claims (cek auth.uid() pas query RLS)
 *   4. RLS query result (apa yang user liat pake session mereka)
 *   5. Service-role query result (apa yang sebenarnya ada di DB — bypass RLS)
 *
 * Kalau #4 kosong tapi #5 ada → CONFIRMED RLS issue.
 * Kalau #4 dan #5 kosong → profile beneran gak ada (trigger gagal).
 * Kalau #3 null → session gak ke-establish properly.
 *
 * Setelah masalah ketemu, balikin ke versi normal yang gw kasih
 * sebelumnya (yang ada unwrapCallbackNext).
 *
 * Butuh env tambahan:
 *   SUPABASE_SERVICE_ROLE_KEY  — dari Supabase Dashboard → Settings → API
 *                                 → service_role secret. JANGAN expose ke client.
 */

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { createClient } from "@/core/lib/supabase/server";
import { appConfig } from "@/config";
import { ROUTES } from "@/core/constants";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next");

  console.log("\n========== [CONFIRM DIAGNOSTIC] ==========");
  console.log("[1] Query params:", {
    token_hash: token_hash?.slice(0, 20) + "...",
    type,
    next: rawNext,
    origin,
  });

  const buildRedirect = (path: string) => {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    if (isLocalEnv) return NextResponse.redirect(`${origin}${path}`);
    if (forwardedHost)
      return NextResponse.redirect(`https://${forwardedHost}${path}`);
    return NextResponse.redirect(`${origin}${path}`);
  };

  if (!token_hash || !type) {
    console.log("[FAIL] missing token_hash or type");
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?error=missing_params`
    );
  }

  // -------------------------------------------------------------
  // 2. verifyOtp
  // -------------------------------------------------------------
  const supabase = await createClient();
  const verifyResult = await supabase.auth.verifyOtp({
    token_hash,
    type,
  });

  console.log("[2] verifyOtp result:", {
    error: verifyResult.error
      ? {
        name: verifyResult.error.name,
        status: verifyResult.error.status,
        message: verifyResult.error.message,
      }
      : null,
    hasSession: !!verifyResult.data?.session,
    hasUser: !!verifyResult.data?.user,
    userIdFromVerify: verifyResult.data?.user?.id ?? null,
  });

  if (verifyResult.error) {
    console.log("[FAIL] verifyOtp error — redirect with auth_callback_error");
    console.log("==========================================\n");
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?error=verifyotp_${verifyResult.error.message.replace(/\s+/g, "_")}`
    );
  }

  // -------------------------------------------------------------
  // 3. getUser + getSession
  // -------------------------------------------------------------
  const [userRes, sessionRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);

  const user = userRes.data.user;
  const session = sessionRes.data.session;

  console.log("[3] Session state post-verifyOtp:", {
    userFromGetUser: user
      ? {
        id: user.id,
        email: user.email,
        role: user.role,
        aud: user.aud,
        email_confirmed_at: user.email_confirmed_at,
      }
      : null,
    hasSession: !!session,
    sessionUserId: session?.user?.id ?? null,
    accessTokenStart: session?.access_token?.slice(0, 40) + "..." ?? null,
  });

  if (!user) {
    console.log("[FAIL] getUser returned null after verifyOtp succeeded");
    console.log("==========================================\n");
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?error=no_user_after_verify`
    );
  }

  // -------------------------------------------------------------
  // 4. RLS query — apa yang user session bisa liat
  // -------------------------------------------------------------
  const rlsQuery = await supabase
    .from("user_profiles")
    .select("id, email, role, is_active, created_at")
    .eq("id", user.id)
    .maybeSingle();

  console.log("[4] RLS query (with user session):", {
    queriedUserId: user.id,
    foundRow: rlsQuery.data,
    error: rlsQuery.error
      ? {
        code: rlsQuery.error.code,
        message: rlsQuery.error.message,
        details: rlsQuery.error.details,
        hint: rlsQuery.error.hint,
      }
      : null,
  });

  // -------------------------------------------------------------
  // 5. Service-role query — bypass RLS, ground truth
  // -------------------------------------------------------------
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    console.log(
      "[5] SKIP service-role comparison — SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL not set"
    );
  } else {
    const adminClient = createAnonClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const adminQuery = await adminClient
      .from("user_profiles")
      .select("id, email, role, is_active, created_at")
      .eq("id", user.id)
      .maybeSingle();

    console.log("[5] Service-role query (bypass RLS):", {
      queriedUserId: user.id,
      foundRow: adminQuery.data,
      error: adminQuery.error
        ? {
          code: adminQuery.error.code,
          message: adminQuery.error.message,
        }
        : null,
    });

    // Diagnosis summary
    const rlsHas = !!rlsQuery.data;
    const adminHas = !!adminQuery.data;
    console.log("[DIAGNOSIS]", {
      rlsHas,
      adminHas,
      verdict:
        rlsHas && adminHas
          ? "ALL_GOOD_but_logic_somewhere_else_fails"
          : !rlsHas && adminHas
            ? "RLS_BLOCKS_USER_FROM_OWN_PROFILE ← check user_profiles RLS policies"
            : !rlsHas && !adminHas
              ? "PROFILE_DOES_NOT_EXIST ← check handle_new_user trigger"
              : "weird_state_rls_has_but_admin_does_not",
    });
  }

  console.log("==========================================\n");

  // Kasih info yang visible di browser supaya gampang debug tanpa
  // liat terminal. Kalau RLS fail, redirect ke login dengan detail error.
  if (!rlsQuery.data) {
    const params = new URLSearchParams({
      error: "diagnostic_rls_empty",
      user_id: user.id,
      email: user.email ?? "",
    });
    return buildRedirect(
      `${appConfig.auth.postLogoutRedirect}?${params.toString()}`
    );
  }

  // Kalau ke sini, RLS ok — redirect ke next atau dashboard
  const safeNext =
    rawNext && rawNext.startsWith("/")
      ? rawNext
      : ROUTES.DASHBOARD ?? "/dashboard";

  return buildRedirect(safeNext);
}