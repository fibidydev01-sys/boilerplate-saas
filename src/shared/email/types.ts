/**
 * Supabase Send Email Hook — payload types.
 *
 * Ref: https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
 *
 * Shape ini DITENTUKAN Supabase — jangan diubah.
 *
 * Flow:
 *   1. User trigger auth action (signup, signInWithOtp, reset password, dll)
 *   2. Supabase generate token + compose payload ini
 *   3. POST ke endpoint hook kita dengan HMAC signature di headers
 *   4. Kita verify → dispatch ke template yang sesuai → resend.send()
 */

/**
 * Jenis-jenis email action yang bisa datang dari Supabase.
 *
 * - signup       : konfirmasi email setelah user register (email+password)
 *                  ATAU user baru yang dibuat via signInWithOtp dengan
 *                  shouldCreateUser: true
 * - magiclink    : magic link login untuk user yang udah exist
 * - recovery     : reset password (forgot password flow)
 * - invite       : admin invite user baru (dari dashboard / admin API)
 * - email_change : konfirmasi saat user ganti email address
 * - reauthentication : step-up auth (misal sebelum action sensitif)
 */
export type EmailActionType =
  | "signup"
  | "magiclink"
  | "recovery"
  | "invite"
  | "email_change"
  | "reauthentication";

export interface SupabaseEmailUser {
  id: string;
  aud: string;
  role: string;
  email: string;
  phone?: string;
  /** User metadata dari `options.data` saat signup */
  user_metadata?: {
    full_name?: string;
    [key: string]: unknown;
  };
  app_metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseEmailData {
  /**
   * 6-digit OTP code. Kita bisa embed ini di template sebagai alternatif
   * untuk user yang gak bisa klik link (copy-paste ke form).
   */
  token: string;

  /**
   * Hashed token yang dipakai di URL. INI YANG HARUS DI-EMBED DI LINK,
   * BUKAN `token` di atas.
   *
   * URL format: {site_url}/auth/verify?token_hash={token_hash}&type={type}&next={redirect_to}
   */
  token_hash: string;

  /**
   * Token baru (untuk flow email_change yang butuh konfirmasi dua sisi).
   * Umumnya sama dengan `token`.
   */
  token_new?: string;
  token_hash_new?: string;

  /** Tipe aksi — nentuin template mana yang dipakai */
  email_action_type: EmailActionType;

  /** Base URL Supabase project (bukan app kita) */
  site_url: string;

  /**
   * Redirect URL setelah verifikasi berhasil. Di-set dari parameter
   * `emailRedirectTo` saat trigger action dari client.
   */
  redirect_to: string;

  token_otp?: string;
}

export interface SupabaseEmailHookPayload {
  user: SupabaseEmailUser;
  email_data: SupabaseEmailData;
}
