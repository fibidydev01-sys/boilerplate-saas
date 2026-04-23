/**
 * Supabase Send Email Hook — receiver.
 *
 * Endpoint: POST /api/auth/hooks/send-email
 *
 * Dipanggil Supabase setiap kali ada auth email yang harus dikirim
 * (signup, magic link, recovery, dll). Supabase handle generasi token
 * & expiry; kita cuma render template + kirim via Resend.
 *
 * Flow:
 *   1. Read raw body (WAJIB sebelum parse — HMAC butuh bytes asli)
 *   2. Verify signature via standardwebhooks
 *   3. Dispatch ke sendAuthEmail()
 *   4. Return 200 kalau sukses, 401 kalau signature invalid, 500 kalau
 *      Resend fail (Supabase akan retry)
 *
 * IMPORTANT — status code semantics (Supabase retry behavior):
 *   200 → success / skipped deliberately → STOP retry
 *   400 → malformed payload → STOP retry
 *   401 → signature mismatch → STOP retry (config issue, bukan transient)
 *   500 → transient error (Resend down, timeout) → RETRY
 *
 * Setup checklist:
 *   - Env: RESEND_API_KEY, RESEND_FROM_EMAIL, SEND_EMAIL_HOOK_SECRET
 *   - Supabase Dashboard → Auth → Hooks → Send Email Hook:
 *     - URL: https://<yourdomain>/api/auth/hooks/send-email
 *     - Type: HTTPS
 *     - Copy generated secret ke SEND_EMAIL_HOOK_SECRET env
 *   - Domain Resend sudah verified
 *   - Kalau pakai dev tunnel (ngrok), URL hook pake URL tunnel
 */

import { NextResponse } from "next/server";
import { sendAuthEmail, verifyHookRequest } from "@/shared/email";

// Force dynamic — hook request gak cacheable
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 1. Read raw body first — HMAC verify needs bytes pre-parse
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!rawBody) {
    return NextResponse.json({ error: "empty_body" }, { status: 400 });
  }

  // 2. Verify signature
  const verification = verifyHookRequest(rawBody, request.headers);

  if (!verification.valid || !verification.payload) {
    // missing_secret → server config issue, treat as 500 supaya kita
    // aware (retry akan keep-failing tapi setidaknya observable).
    if (verification.reason === "missing_secret") {
      console.error(
        "[send-email-hook] SEND_EMAIL_HOOK_SECRET not set — rejecting all hook requests"
      );
      return NextResponse.json(
        { error: "server_misconfigured" },
        { status: 500 }
      );
    }

    // missing_headers / invalid_signature → bad request, stop retry
    return NextResponse.json(
      { error: verification.reason ?? "invalid_signature" },
      { status: 401 }
    );
  }

  // 3. Dispatch
  const result = await sendAuthEmail(verification.payload);

  if (result.skipped) {
    // Deliberate skip (unknown action type) — return 200 biar Supabase
    // stop retry. Log buat visibility.
    console.warn("[send-email-hook] skipped:", result.reason);
    return NextResponse.json({ skipped: true, reason: result.reason });
  }

  if (!result.sent) {
    // Send failed (Resend error, network, dll). Return 500 supaya
    // Supabase retry. Log error buat debugging.
    console.error("[send-email-hook] send failed:", result.error);
    return NextResponse.json(
      { error: "send_failed", detail: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    sent: true,
    messageId: result.providerMessageId ?? null,
  });
}

// Reject non-POST
export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}
