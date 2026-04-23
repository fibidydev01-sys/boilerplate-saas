/**
 * Commerce Webhook Receiver.
 *
 * Endpoint: POST /api/commerce/webhooks/[token]
 *
 * Token di-generate saat user setup webhook config. Setiap user punya
 * URL unik biar bisa multi-tenant.
 *
 * LS webhook behavior:
 *   - Retry up to 3x dengan backoff (60s, 5m, 30m) kalau non-2xx
 *   - Headers: X-Signature (HMAC), X-Event-Id (unique), X-Event-Name
 *   - Payload: { meta: {event_name, test_mode, ...}, data: {...} }
 *
 * Response contract:
 *   200 → LS stop retry (success atau duplicate handled)
 *   400 → LS stop retry (malformed, no point retrying)
 *   401 → LS stop retry (signature invalid — probably misconfig)
 *   404 → LS stop retry (token unknown)
 *   500 → LS retry (transient server error)
 *
 * Kenapa body harus di-read sebagai TEXT, bukan json()?
 *   HMAC dihitung dari raw bytes. Kalau kita json() dulu, ada risk
 *   JSON.stringify re-ordering key — signature gak match walaupun
 *   content sama.
 */

import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/core/lib/supabase/service-role";
import { ingestWebhook } from "@/modules/commerce/services";

// Force dynamic — webhook gak cacheable
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;

  if (!token || token.length < 16) {
    return NextResponse.json({ error: "invalid_token" }, { status: 404 });
  }

  // Read raw body FIRST — required for HMAC verification
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!rawBody) {
    return NextResponse.json({ error: "empty_body" }, { status: 400 });
  }

  const signature = request.headers.get("x-signature");
  const eventIdHeader = request.headers.get("x-event-id");
  const eventNameHeader = request.headers.get("x-event-name");

  const supabase = createServiceRoleClient();

  const result = await ingestWebhook(supabase, {
    token,
    rawBody,
    signature,
    eventIdHeader,
    eventNameHeader,
  });

  if (result.ok) {
    return NextResponse.json(
      { received: true, deduplicated: result.deduplicated },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { error: result.reason ?? "ingest_failed" },
    { status: result.httpStatus }
  );
}

// Reject other methods
export async function GET() {
  return NextResponse.json(
    { error: "method_not_allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}