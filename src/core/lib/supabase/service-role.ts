/**
 * Service-role Supabase client.
 *
 * Server-only. Bypasses RLS — dipake HANYA untuk context yang gak punya
 * user session (webhook dari pihak luar, cron job, admin script).
 *
 * Jangan pernah di-import dari client component atau route handler yang
 * pake user session — pake @/core/lib/supabase/server instead.
 *
 * Required env:
 *   SUPABASE_SERVICE_ROLE_KEY — dari Supabase dashboard → Settings → API
 *   (service_role, bukan anon!)
 */

import "server-only";
import { createClient as createSbClient } from "@supabase/supabase-js";
import type { Database } from "@/core/types";

let cached: ReturnType<typeof createSbClient<Database>> | null = null;

export function createServiceRoleClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL not set");
  }
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY not set — required untuk webhook ingestion"
    );
  }

  cached = createSbClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cached;
}