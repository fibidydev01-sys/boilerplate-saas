/**
 * Lemon Squeezy webhook signature verification.
 *
 * Server-only. LS sign webhook body via HMAC-SHA256 dengan secret yang
 * di-set di dashboard LS. Signature di-pass via header `X-Signature`.
 *
 * CRITICAL: `rawBody` harus string MENTAH dari request, bukan hasil
 * JSON.parse → JSON.stringify (bisa beda ordering/whitespace). Selalu
 * read body sebagai text dulu, baru parse setelah verifikasi.
 *
 * Ref: https://docs.lemonsqueezy.com/help/webhooks/signing-requests
 */

import "server-only";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export interface VerifyResult {
  valid: boolean;
  reason?: "missing_signature" | "missing_secret" | "invalid_format" | "mismatch";
}

/**
 * Verify LS webhook signature.
 *
 * @param rawBody   Raw request body string (pre-parse)
 * @param signature Value dari header `X-Signature`
 * @param secret    Shared secret dari webhook config
 */
export function verifyLSSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | null | undefined
): VerifyResult {
  if (!signature) return { valid: false, reason: "missing_signature" };
  if (!secret) return { valid: false, reason: "missing_secret" };

  let expected: string;
  try {
    expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  } catch {
    return { valid: false, reason: "invalid_format" };
  }

  if (expected.length !== signature.length) {
    return { valid: false, reason: "mismatch" };
  }

  let match = false;
  try {
    match = timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return { valid: false, reason: "invalid_format" };
  }

  return match ? { valid: true } : { valid: false, reason: "mismatch" };
}

/**
 * Generate secret untuk webhook baru. 32 bytes random → hex string
 * (64 karakter). Aman untuk dipake sebagai HMAC secret.
 */
export function generateWebhookSecret(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generate URL-safe token untuk webhook path. 24 bytes base64url →
 * 32 karakter, tanpa padding.
 */
export function generateWebhookToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Mask secret buat display. Reveal 4 char terakhir.
 * Alias sama sama `getKeyHint` di `@/core/lib/encryption` tapi secret
 * kita keep di sini biar gak cross-module dep.
 */
export function getSecretHint(secret: string, chars = 4): string {
  if (secret.length <= chars) return "*".repeat(secret.length);
  const maskLen = Math.min(12, secret.length - chars);
  return "*".repeat(maskLen) + secret.slice(-chars);
}