/**
 * Send Auth Email — dispatcher.
 *
 * Dipanggil dari hook endpoint setelah HMAC verified. Tugasnya:
 *   1. Build verification URL dari token_hash + type + redirect_to
 *   2. Pilih template sesuai email_action_type
 *   3. Render → resend.emails.send()
 *
 * URL construction pattern (Supabase standard):
 *   {app_url}/api/auth/callback?token_hash={hash}&type={type}&next={redirect_to}
 *
 * Kita pake callback route yang sudah ada (`src/app/api/auth/callback/route.ts`)
 * — yang akan verifyOtp(token_hash) → establish session + route ke next.
 *
 * NOTE tentang `type` param:
 *   - signup / magiclink / recovery / email_change / invite / reauthentication
 *   - Callback route HARUS handle verifyOtp({token_hash, type}) — bukan
 *     cuma exchangeCodeForSession. Kalau belum, email verification gagal.
 *     Lihat action item di README.
 */

import "server-only";
import { render } from "@react-email/render";
import { getResendClient, getFromAddress, getAppUrl } from "./resend-client";
import { ConfirmSignupEmail } from "./templates/confirm-signup";
import { MagicLinkEmail } from "./templates/magic-link";
import { RecoveryEmail } from "./templates/recovery";
import { EmailChangeEmail } from "./templates/email-change";
import { ReauthEmail } from "./templates/reauthentication";
import { brandingConfig } from "@/config";
import type { SupabaseEmailHookPayload, EmailActionType } from "./types";

export interface SendAuthEmailResult {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
  providerMessageId?: string;
  error?: string;
}

/**
 * Build verification URL untuk di-embed di link email.
 *
 * Pakai callback route kita (`/api/auth/callback`) supaya session
 * exchange happens di server kita (bukan langsung Supabase default).
 * Ini penting karena callback kita juga handle:
 *   - Profile verification (exists + active)
 *   - Activity logging
 *   - Role-aware redirect
 */
function buildVerificationUrl(
  tokenHash: string,
  type: EmailActionType,
  redirectTo: string
): string {
  const base = getAppUrl();
  const url = new URL(`${base}/api/auth/confirm`);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", type);
  if (redirectTo) {
    url.searchParams.set("next", redirectTo);
  }
  return url.toString();
}

/**
 * Main entry. Caller: route handler di `/api/auth/hooks/send-email`.
 *
 * Selalu return hasil (gak throw) supaya route handler bisa decide
 * HTTP status code berdasarkan outcome.
 */
export async function sendAuthEmail(
  payload: SupabaseEmailHookPayload
): Promise<SendAuthEmailResult> {
  const { user, email_data } = payload;
  const type = email_data.email_action_type;

  const verificationUrl = buildVerificationUrl(
    email_data.token_hash,
    type,
    email_data.redirect_to
  );

  const userName =
    (user.user_metadata?.full_name as string | undefined) || undefined;

  // Pick template + subject berdasarkan action type
  let subject: string;
  let element: React.ReactElement;

  switch (type) {
    case "signup":
      // Bisa jadi 2 skenario:
      //   A. Email+password signup dengan verify required
      //   B. signInWithOtp dengan shouldCreateUser:true untuk email baru
      //      → ini sebenarnya magic link untuk user baru.
      //
      // Solusi: default ke MagicLinkEmail dengan isNewUser=true. Ini
      // cover 95% case (boilerplate pakai magic-link-or-signup mode)
      // dan UX-nya tetep masuk akal untuk email+password signup
      // (user baru klik link = langsung login, sama dengan magic link).
      //
      // Kalau nanti butuh pisahin strictly, detect via user metadata
      // atau tambah custom field di `options.data` saat signUp.
      subject = `Masuk ke ${brandingConfig.shortName}`;
      element = (
        <MagicLinkEmail
          magicUrl={verificationUrl}
          token={email_data.token}
          userName={userName}
          isNewUser={true}
        />
      );
      break;

    case "magiclink":
      subject = `Tautan masuk ${brandingConfig.shortName}`;
      element = (
        <MagicLinkEmail
          magicUrl={verificationUrl}
          token={email_data.token}
          userName={userName}
          isNewUser={false}
        />
      );
      break;

    case "recovery":
      subject = `Reset password ${brandingConfig.shortName}`;
      element = (
        <RecoveryEmail
          resetUrl={verificationUrl}
          token={email_data.token}
          userName={userName}
        />
      );
      break;

    case "invite":
      subject = `Kamu diundang ke ${brandingConfig.name}`;
      element = (
        <ConfirmSignupEmail
          confirmUrl={verificationUrl}
          token={email_data.token}
          userName={userName}
        />
      );
      break;

    case "email_change":
      subject = `Konfirmasi perubahan email ${brandingConfig.shortName}`;
      element = (
        <EmailChangeEmail
          confirmUrl={verificationUrl}
          token={email_data.token}
          newEmail={user.email}
          userName={userName}
        />
      );
      break;

    case "reauthentication":
      subject = `Kode verifikasi ${brandingConfig.shortName}`;
      element = <ReauthEmail token={email_data.token} userName={userName} />;
      break;

    default: {
      // Unknown type — skip daripada kirim email yang salah format.
      // Return `skipped: true` supaya hook tetep respond 200 ke Supabase
      // (gak retry endlessly).
      const unknownType: string = type;
      return {
        sent: false,
        skipped: true,
        reason: `unknown_email_action_type: ${unknownType}`,
      };
    }
  }

  // Render HTML + fallback text.
  // @react-email/render v0.0.12+ returns Promise<string>.
  const html = await render(element);
  const text = await render(element, { plainText: true });

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: user.email,
      subject,
      html,
      text,
    });

    if (error) {
      return {
        sent: false,
        error: `${error.name}: ${error.message}`,
      };
    }

    return {
      sent: true,
      providerMessageId: data?.id,
    };
  } catch (err) {
    return {
      sent: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
