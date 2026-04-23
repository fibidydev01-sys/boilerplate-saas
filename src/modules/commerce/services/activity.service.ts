/**
 * Activity logging service.
 *
 * Central enum of trackable actions + helper untuk insert rows ke
 * activity_logs.
 */

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/core/types";

/**
 * Central enum semua action yang di-log.
 * Format: namespace.action (dot-separated).
 */
export enum ActivityAction {
  // Auth
  UserRegistered = "user.registered",
  UserLoggedIn = "user.logged_in",
  UserLoggedOut = "user.logged_out",
  UserPasswordResetRequested = "user.password_reset_requested",
  UserPasswordUpdated = "user.password_updated",
  UserProfileUpdated = "user.profile_updated",
  UserEmailChanged = "user.email_changed",

  // Admin
  AdminUserRoleChanged = "admin.user.role_changed",
  AdminUserDeactivated = "admin.user.deactivated",
  AdminUserReactivated = "admin.user.reactivated",

  // Commerce — Phase 1
  CommerceCredentialSaved = "commerce.credential.saved",
  CommerceCredentialVerified = "commerce.credential.verified",
  CommerceCredentialDeleted = "commerce.credential.deleted",

  // Commerce — Phase 2
  CommerceWebhookProvisioned = "commerce.webhook.provisioned",
  CommerceWebhookDeleted = "commerce.webhook.deleted",
  CommerceOrderSynced = "commerce.order.synced",
  CommerceSubscriptionPaused = "commerce.subscription.paused",
  CommerceSubscriptionResumed = "commerce.subscription.resumed",
  CommerceSubscriptionCancelled = "commerce.subscription.cancelled",
  CommerceCheckoutCreated = "commerce.checkout.created",
}

export interface LogActivityInput {
  action: ActivityAction | string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Insert row ke activity_logs. Best-effort — errors logged tapi gak
 * propagated (logging failure shouldn't break the actual operation).
 *
 * user_id di-derive dari current session via supabase.auth.getUser().
 * Kalau caller gak punya session (webhook ingestion), lewat service
 * role. Kasus tsb logging bisa di-skip atau set user_id manual.
 */
export async function logActivity(
  supabase: SupabaseClient<Database>,
  input: LogActivityInput
): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("activity_logs").insert({
      user_id: user?.id ?? null,
      action: input.action,
      resource_type: input.resourceType ?? null,
      resource_id: input.resourceId ?? null,
      metadata: (input.metadata ?? {}) as Json,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    });

    if (error) {
      console.error("[logActivity] insert failed:", error.message);
    }
  } catch (err) {
    console.error("[logActivity] unexpected:", err);
  }
}