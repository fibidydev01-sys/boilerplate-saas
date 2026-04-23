/**
 * Webhook Config API — user-facing, authenticated.
 *
 * Endpoints:
 *   GET    /api/commerce/webhooks/config → get current config status
 *   POST   /api/commerce/webhooks/config → provision (create or regenerate)
 *   DELETE /api/commerce/webhooks/config → delete config
 *
 * Body untuk POST (optional):
 *   { secret?: string, subscribedEvents?: string[], revealSecret?: boolean }
 *
 * Kalau `revealSecret: true` di POST response, server akan include
 * plaintext secret di response. INI CUMA SEKALI — abis itu secret
 * di-display via hint doang. User harus save manually.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/core/lib/supabase/server";
import {
  getWebhookConfigStatus,
  provisionWebhookConfig,
  revealWebhookSecretOnce,
  deleteWebhookConfig,
} from "@/modules/commerce/services";
import { logActivity, ActivityAction } from "@/core/auth/services";
import { getClientIP, getUserAgent } from "@/core/lib/request";

function getAppUrl(request: NextRequest): string {
  // Prefer env var, fallback ke request origin
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl;
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// ====================================================================
// GET
// ====================================================================

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const appUrl = getAppUrl(request);
  const config = await getWebhookConfigStatus(supabase, user.id, appUrl);
  return NextResponse.json({ config });
}

// ====================================================================
// POST — provision (create/regenerate)
// ====================================================================

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  let body: {
    secret?: string;
    subscribedEvents?: string[];
    revealSecret?: boolean;
  } = {};

  try {
    const raw = await request.text();
    if (raw) body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const appUrl = getAppUrl(request);

  const result = await provisionWebhookConfig(supabase, {
    userId: user.id,
    secret: body.secret ?? "",
    subscribedEvents: body.subscribedEvents,
    appUrl,
  });

  if (!result.success || !result.config) {
    return NextResponse.json(
      { error: result.errorCode ?? "provision_failed" },
      { status: 500 }
    );
  }

  await logActivity(supabase, {
    action: ActivityAction.CommerceWebhookProvisioned,
    metadata: {
      provider: "lemonsqueezy",
      events: result.config.subscribedEvents.length,
    },
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
  });

  // Reveal plaintext secret ONCE kalau di-request
  let plaintextSecret: string | undefined;
  if (body.revealSecret) {
    const reveal = await revealWebhookSecretOnce(supabase, user.id);
    if (reveal.secret) plaintextSecret = reveal.secret;
  }

  return NextResponse.json({
    config: result.config,
    ...(plaintextSecret ? { secret: plaintextSecret } : {}),
  });
}

// ====================================================================
// DELETE
// ====================================================================

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const result = await deleteWebhookConfig(supabase, user.id);
  if (!result.success) {
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }

  await logActivity(supabase, {
    action: ActivityAction.CommerceWebhookDeleted,
    metadata: { provider: "lemonsqueezy" },
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
  });

  return NextResponse.json({ success: true });
}