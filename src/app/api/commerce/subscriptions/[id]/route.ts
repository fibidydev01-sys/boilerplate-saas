/**
 * Subscription detail + actions.
 *
 * GET   /api/commerce/subscriptions/[id]       → detail
 * PATCH /api/commerce/subscriptions/[id]       → pause|resume|cancel
 *
 * PATCH body:
 *   { action: "pause" | "resume" | "cancel",
 *     pauseMode?: "void" | "free",
 *     resumesAt?: ISO string | null }
 *
 * `id` = LS provider_subscription_id.
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/core/lib/supabase/server";
import {
  getSubscriptionForUser,
  executeSubscriptionAction,
} from "@/modules/commerce/services";
import { logActivity, ActivityAction } from "@/core/auth/services";
import { getClientIP, getUserAgent } from "@/core/lib/request";
import type { SubscriptionAction } from "@/modules/commerce/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function mapErrorStatus(code: string | undefined): number {
  switch (code) {
    case "not_connected":
      return 409;
    case "not_found":
      return 404;
    case "invalid_credentials":
      return 401;
    case "forbidden":
      return 403;
    case "rate_limited":
      return 429;
    case "network_error":
      return 502;
    case "invalid_action":
    case "already_cancelled":
      return 400;
    default:
      return 500;
  }
}

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const result = await getSubscriptionForUser(supabase, user.id, id);
  if (!result.success) {
    return NextResponse.json(
      { error: result.errorCode },
      { status: mapErrorStatus(result.errorCode) }
    );
  }

  return NextResponse.json({ subscription: result.subscription });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  let body: {
    action?: SubscriptionAction;
    pauseMode?: "void" | "free";
    resumesAt?: string | null;
  } = {};

  try {
    const raw = await request.text();
    if (raw) body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body.action || !["pause", "resume", "cancel"].includes(body.action)) {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const result = await executeSubscriptionAction(
    supabase,
    user.id,
    id,
    body.action,
    body.action === "pause"
      ? { mode: body.pauseMode, resumesAt: body.resumesAt }
      : undefined
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.errorCode },
      { status: mapErrorStatus(result.errorCode) }
    );
  }

  // Log activity
  const actionMap = {
    pause: ActivityAction.CommerceSubscriptionPaused,
    resume: ActivityAction.CommerceSubscriptionResumed,
    cancel: ActivityAction.CommerceSubscriptionCancelled,
  };

  await logActivity(supabase, {
    action: actionMap[body.action],
    resourceType: "commerce_subscription",
    resourceId: id,
    metadata: {
      provider: "lemonsqueezy",
      action: body.action,
    },
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
  });

  return NextResponse.json({
    success: true,
    subscription: result.subscription,
  });
}