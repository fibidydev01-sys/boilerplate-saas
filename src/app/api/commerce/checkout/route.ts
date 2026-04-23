/**
 * Checkout API.
 *
 * POST /api/commerce/checkout
 *
 * Body: CreateCheckoutInput
 *   { variantId, storeId?, email?, name?, discountCode?,
 *     customData?, redirectUrl?, receiptThankYouNote?,
 *     darkMode?, subscriptionPreview?, expiresInMinutes? }
 *
 * Returns: { checkoutUrl, expiresAt }
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/core/lib/supabase/server";
import { createCheckoutLink } from "@/modules/commerce/services";
import { logActivity, ActivityAction } from "@/core/auth/services";
import { getClientIP, getUserAgent } from "@/core/lib/request";
import type { CreateCheckoutInput } from "@/modules/commerce/types";

function mapErrorStatus(code: string | undefined): number {
  switch (code) {
    case "not_connected":
      return 409;
    case "invalid_credentials":
      return 401;
    case "forbidden":
      return 403;
    case "rate_limited":
      return 429;
    case "network_error":
      return 502;
    default:
      return 500;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let input: CreateCheckoutInput;
  try {
    input = (await request.json()) as CreateCheckoutInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!input.variantId) {
    return NextResponse.json({ error: "missing_variant_id" }, { status: 400 });
  }

  const result = await createCheckoutLink(supabase, user.id, input);
  if (!result.success) {
    return NextResponse.json(
      { error: result.errorCode },
      { status: mapErrorStatus(result.errorCode) }
    );
  }

  await logActivity(supabase, {
    action: ActivityAction.CommerceCheckoutCreated,
    resourceType: "commerce_variant",
    resourceId: input.variantId,
    metadata: {
      provider: "lemonsqueezy",
      has_email: Boolean(input.email),
      has_custom_data: Boolean(input.customData),
    },
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
  });

  return NextResponse.json({
    checkoutUrl: result.checkoutUrl,
    expiresAt: result.expiresAt,
  });
}