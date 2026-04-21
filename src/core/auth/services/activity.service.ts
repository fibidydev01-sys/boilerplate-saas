/**
 * Activity Logging Service.
 *
 * Append-only writes ke `public.activity_logs`.
 *
 * Design:
 *   - Pure function, caller pass supabase client (browser atau server).
 *   - Fire-and-forget style: gagal log gak boleh break user flow.
 *   - Action key pakai dot-notation: "user.login", "profile.update".
 *
 * Usage client:
 *   import { createClient } from "@/core/lib/supabase/client";
 *   import { logActivity } from "@/core/auth/services";
 *
 *   const supabase = createClient();
 *   await logActivity(supabase, {
 *     action: "profile.update",
 *     resourceType: "user",
 *     resourceId: user.id,
 *     metadata: { fields: ["full_name"] },
 *   });
 *
 * Usage server (Route Handler):
 *   const ip = request.headers.get("x-forwarded-for") ?? undefined;
 *   const ua = request.headers.get("user-agent") ?? undefined;
 *   await logActivity(supabase, { action: "user.login", ipAddress: ip, userAgent: ua });
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ActivityLog, Json } from "@/core/types";

type Client = SupabaseClient<Database>;

export interface LogActivityInput {
  /** Dot-notation action key, e.g. "user.login", "admin.user.deactivate". */
  action: string;
  /** Optional — override current user (useful for admin actions on behalf). */
  userId?: string | null;
  /** Optional resource type: "user", "order", "post", etc. */
  resourceType?: string | null;
  /** Optional resource identifier (string-compatible: uuid, slug, number-as-string). */
  resourceId?: string | null;
  /** Free-form context. Keep small; for full payload use separate storage. */
  metadata?: Record<string, unknown>;
  /** Request IP — available on server only (from headers). */
  ipAddress?: string | null;
  /** Request UA — available on server only. */
  userAgent?: string | null;
}

export interface LogActivityResult {
  logged: boolean;
  id: string | null;
  error: Error | null;
}

/**
 * Insert activity log. Never throws — error returned via result.
 *
 * @returns {logged: true} kalau sukses insert, {logged: false} kalau gagal.
 *          Error detail ada di `result.error` untuk debugging, tapi caller
 *          biasanya tidak perlu act on it.
 */
export async function logActivity(
  supabase: Client,
  input: LogActivityInput
): Promise<LogActivityResult> {
  try {
    // Resolve user_id: explicit > session user > null
    let userId = input.userId ?? null;
    if (userId === undefined || userId === null) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userId = session?.user?.id ?? null;
    }

    const { data, error } = await supabase
      .from("activity_logs")
      .insert({
        user_id: userId,
        action: input.action,
        resource_type: input.resourceType ?? null,
        resource_id: input.resourceId ?? null,
        metadata: (input.metadata ?? {}) as Json,
        ip_address: input.ipAddress ?? null,
        user_agent: input.userAgent ?? null,
      })
      .select("id")
      .single();

    if (error) {
      // Log to console but don't throw — activity log failure must not
      // break the calling flow.
      if (process.env.NODE_ENV === "development") {
        console.warn("[logActivity] insert failed:", error.message);
      }
      return {
        logged: false,
        id: null,
        error: new Error(error.message),
      };
    }

    return { logged: true, id: data?.id ?? null, error: null };
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[logActivity] unexpected error:", err);
    }
    return {
      logged: false,
      id: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

// --------------------------------------------------------------------
// Query helpers (for admin UI)
// --------------------------------------------------------------------

export interface ListActivityOptions {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  limit?: number;
  offset?: number;
  /** Filter by date range (inclusive start, exclusive end). */
  from?: Date;
  to?: Date;
}

export interface ListActivityResult {
  rows: ActivityLog[];
  count: number | null;
  error: Error | null;
}

/**
 * Paginated list — untuk admin page. RLS auto-filter:
 *   - Regular user: cuma log-nya sendiri
 *   - Admin (policy `activity_logs_admin_select_all`): semua log
 */
export async function listActivity(
  supabase: Client,
  options: ListActivityOptions = {}
): Promise<ListActivityResult> {
  try {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      limit = 50,
      offset = 0,
      from,
      to,
    } = options;

    let query = supabase
      .from("activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (userId) query = query.eq("user_id", userId);
    if (action) query = query.eq("action", action);
    if (resourceType) query = query.eq("resource_type", resourceType);
    if (resourceId) query = query.eq("resource_id", resourceId);
    if (from) query = query.gte("created_at", from.toISOString());
    if (to) query = query.lt("created_at", to.toISOString());

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return { rows: [], count: null, error: new Error(error.message) };
    }

    return {
      rows: (data ?? []) as ActivityLog[],
      count: count ?? null,
      error: null,
    };
  } catch (err) {
    return {
      rows: [],
      count: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

// --------------------------------------------------------------------
// Common action key constants (convention, not enforced)
// --------------------------------------------------------------------

/**
 * Convention untuk action keys. Tidak di-enforce di type — tambah sesuai
 * kebutuhan modul. Format: "<domain>.<verb>" atau "<domain>.<subdomain>.<verb>".
 */
export const ActivityAction = {
  // User lifecycle
  UserLogin: "user.login",
  UserLogout: "user.logout",
  UserSignup: "user.signup",
  UserFailedLogin: "user.failed_login",

  // Profile
  ProfileUpdate: "profile.update",
  ProfileAvatarUpload: "profile.avatar_upload",

  // Admin
  AdminUserCreate: "admin.user.create",
  AdminUserDeactivate: "admin.user.deactivate",
  AdminUserActivate: "admin.user.activate",
  AdminUserRoleChange: "admin.user.role_change",
  AdminUserDelete: "admin.user.delete",
} as const;

export type ActivityActionKey = (typeof ActivityAction)[keyof typeof ActivityAction];
