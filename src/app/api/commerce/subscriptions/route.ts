/**
 * Subscriptions API.
 *
 * GET  /api/commerce/subscriptions → list
 * POST /api/commerce/subscriptions → backfill
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/core/lib/supabase/server";
import {
  listSubscriptionsForUser,
  backfillSubscriptions,
} from "@/modules/commerce/services";

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

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const result = await listSubscriptionsForUser(supabase, user.id, {
    limit: parseInt(searchParams.get("limit") ?? "50", 10) || 50,
    offset: parseInt(searchParams.get("offset") ?? "0", 10) || 0,
    status: searchParams.get("status") ?? undefined,
    customerEmail: searchParams.get("email") ?? undefined,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.errorCode },
      { status: mapErrorStatus(result.errorCode) }
    );
  }

  return NextResponse.json({
    subscriptions: result.subscriptions ?? [],
    count: result.count ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const pages = Math.min(parseInt(searchParams.get("pages") ?? "1", 10) || 1, 10);

  const result = await backfillSubscriptions(supabase, user.id, { pages });
  if (!result.success) {
    return NextResponse.json(
      { error: result.errorCode },
      { status: mapErrorStatus(result.errorCode) }
    );
  }

  return NextResponse.json({ synced: result.synced ?? 0 });
}