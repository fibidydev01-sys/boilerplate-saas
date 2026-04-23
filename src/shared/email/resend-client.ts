/**
 * Resend client — lazy singleton.
 *
 * Server-only. Cached across hot-reload supaya gak spam create client
 * tiap import.
 *
 * Required env:
 *   RESEND_API_KEY         — dari Resend dashboard → API Keys
 *   RESEND_FROM_EMAIL      — "My App <noreply@yourdomain.com>"
 *                            Domain HARUS udah verified di Resend.
 *
 * Optional env:
 *   NEXT_PUBLIC_APP_URL    — base URL untuk build callback link di template.
 *                            Kalau gak di-set, fallback ke VERCEL_URL atau
 *                            localhost:3000.
 */

import "server-only";
import { Resend } from "resend";

let cached: Resend | null = null;

export function getResendClient(): Resend {
  if (cached) return cached;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY not set. Get one from https://resend.com/api-keys"
    );
  }

  cached = new Resend(apiKey);
  return cached;
}

/**
 * Return from address untuk email. Format: "Name <email@domain>".
 *
 * Contoh valid:
 *   "MyApp <noreply@myapp.com>"
 *   "noreply@myapp.com"
 */
export function getFromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) {
    throw new Error(
      'RESEND_FROM_EMAIL not set. Example: "MyApp <noreply@myapp.com>"'
    );
  }
  return from;
}

/**
 * Resolve base URL aplikasi untuk build link absolut di email template.
 *
 * Priority:
 *   1. NEXT_PUBLIC_APP_URL (manual override, selalu menang)
 *   2. VERCEL_URL (auto-set di Vercel deployment)
 *   3. http://localhost:3000 (dev fallback)
 */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
