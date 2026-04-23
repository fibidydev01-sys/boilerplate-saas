/**
 * Commerce Credentials API.
 *
 * Endpoints:
 *   GET    /api/commerce/credentials → status (safe, no key)
 *   POST   /api/commerce/credentials → { apiKey, isTestMode } → verify + save
 *   DELETE /api/commerce/credentials → remove credential
 *
 * Auth: user harus login (cek via supabase.auth.getUser).
 * RLS: Supabase policies enforce owner_user_id = auth.uid() — defense in depth.
 *
 * Activity logging: connect/disconnect success di-log via activity.service
 * dengan IP + user agent (server-side context).
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/core/lib/supabase/server";
import { lsApiKeySchema } from "@/core/lib/validators";
import { logActivity, ActivityAction } from "@/core/auth/services";
import { getClientIP, getUserAgent } from "@/core/lib/request";
import {
  getCredentialStatus,
  saveCredential,
  deleteCredential,
} from "@/modules/commerce/services";

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401 }
  );
}

// ====================================================================
// GET — get status
// ====================================================================

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  const status = await getCredentialStatus(supabase, user.id);
  return NextResponse.json({ status });
}

// ====================================================================
// POST — save (upsert) credential
// ====================================================================

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json" },
      { status: 400 }
    );
  }

  const parsed = lsApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  const result = await saveCredential(supabase, {
    userId: user.id,
    apiKey: parsed.data.apiKey,
    isTestMode: parsed.data.isTestMode,
  });

  if (!result.success) {
    // Map errorCode → HTTP status
    const httpStatus =
      result.errorCode === "invalid_credentials" ? 400 :
        result.errorCode === "forbidden" ? 403 :
          result.errorCode === "rate_limited" ? 429 :
            result.errorCode === "network_error" ? 502 :
              500;

    return NextResponse.json(
      { error: result.errorCode },
      { status: httpStatus }
    );
  }

  // Log activity — credential connected
  await logActivity(supabase, {
    action: ActivityAction.CommerceCredentialConnected,
    metadata: {
      provider: "lemonsqueezy",
      storeName: result.status?.storeName ?? null,
      isTestMode: result.status?.isTestMode ?? false,
    },
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
  });

  return NextResponse.json({ status: result.status });
}

// ====================================================================
// DELETE — remove credential
// ====================================================================

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return unauthorized();

  const result = await deleteCredential(supabase, user.id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.errorCode ?? "delete_failed" },
      { status: 500 }
    );
  }

  // Log activity — credential disconnected
  await logActivity(supabase, {
    action: ActivityAction.CommerceCredentialDisconnected,
    metadata: { provider: "lemonsqueezy" },
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request),
  });

  return NextResponse.json({ success: true });
}