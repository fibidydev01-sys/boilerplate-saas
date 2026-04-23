/**
 * Commerce Products API.
 *
 * Endpoints:
 *   GET /api/commerce/products → list products from LS for current user
 *
 * Auth: user harus login.
 * Flow: route → service.listProductsForUser → decrypt key → LS API → transform → return.
 *
 * Caching: Phase 1 pass-through (no cache). Phase 3+ bisa tambah Redis / Next cache.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/core/lib/supabase/server";
import { listProductsForUser } from "@/modules/commerce/services";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await listProductsForUser(supabase, user.id);

  if (!result.success) {
    const httpStatus =
      result.errorCode === "not_connected" ? 409 :
      result.errorCode === "invalid_credentials" ? 401 :
      result.errorCode === "forbidden" ? 403 :
      result.errorCode === "rate_limited" ? 429 :
      result.errorCode === "decrypt_failed" ? 500 :
      result.errorCode === "network_error" ? 502 :
      500;

    return NextResponse.json(
      { error: result.errorCode },
      { status: httpStatus }
    );
  }

  return NextResponse.json({ products: result.products ?? [] });
}
