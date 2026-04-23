/**
 * Order detail API.
 *
 * GET /api/commerce/orders/[id]
 *
 * `id` = LS provider_order_id (bukan DB UUID).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/core/lib/supabase/server";
import { getOrderForUser } from "@/modules/commerce/services";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await getOrderForUser(supabase, user.id, id);
  if (!result.success) {
    const status = result.errorCode === "not_found" ? 404 : 500;
    return NextResponse.json({ error: result.errorCode }, { status });
  }

  return NextResponse.json({ order: result.order });
}