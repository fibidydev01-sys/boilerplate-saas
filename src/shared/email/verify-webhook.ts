/**
 * Supabase Send Email Hook — signature verification.
 *
 * Supabase pake Standard Webhooks spec (https://www.standardwebhooks.com/)
 * untuk sign payload. Kita verify pake package `standardwebhooks` resmi.
 *
 * Headers yang Supabase kirim:
 *   webhook-id        : unique event ID (dipakai untuk idempotency kalau mau)
 *   webhook-timestamp : unix epoch second
 *   webhook-signature : "v1,<base64-hmac>"
 *
 * Secret format yang disimpan di env:
 *   "v1,whsec_xxxxxxxxx"
 *
 * Important: verify butuh RAW body string, bukan hasil JSON.parse. Caller
 * harus `await request.text()` dulu, baru parse setelah verifikasi.
 */

import "server-only";
import { Webhook } from "standardwebhooks";
import type { SupabaseEmailHookPayload } from "./types";

export interface VerifyResult {
  valid: boolean;
  payload?: SupabaseEmailHookPayload;
  reason?: "missing_secret" | "missing_headers" | "invalid_signature";
}

export function verifyHookRequest(
  rawBody: string,
  headers: Headers
): VerifyResult {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!secret) {
    return { valid: false, reason: "missing_secret" };
  }

  const webhookId = headers.get("webhook-id");
  const webhookTimestamp = headers.get("webhook-timestamp");
  const webhookSignature = headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    return { valid: false, reason: "missing_headers" };
  }

  try {
    // `standardwebhooks` expects secret WITHOUT the "v1,whsec_" prefix
    // in some versions — but Supabase docs say include it. Library auto-handles
    // the "whsec_" prefix; kita strip manual prefix "v1," kalau ada.
    const normalizedSecret = secret.startsWith("v1,")
      ? secret.slice(3)
      : secret;

    const wh = new Webhook(normalizedSecret);
    const verified = wh.verify(rawBody, {
      "webhook-id": webhookId,
      "webhook-timestamp": webhookTimestamp,
      "webhook-signature": webhookSignature,
    }) as SupabaseEmailHookPayload;

    return { valid: true, payload: verified };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[verifyHookRequest] signature invalid:", err);
    }
    return { valid: false, reason: "invalid_signature" };
  }
}
