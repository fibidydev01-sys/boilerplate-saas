/**
 * Subscriptions service.
 *
 * Query dari `commerce_subscriptions` (DB lokal, populated by webhook).
 * Actions (pause/resume/cancel) langsung hit LS API — hasil-nya auto
 * sync balik ke DB via webhook.
 *
 * Untuk feedback yang instant ke user, service ini juga upsert hasil
 * response LS API langsung ke DB, DAN re-select row biar return value
 * konsisten dengan DB state (bukan fake SubRow).
 */

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/core/types";
import { lsApi, LSClientError } from "../lib/ls-client";
import { escapeIlike } from "../lib/format";
import { getApiKeyForUser, touchLastUsed } from "./credentials.service";
import type {
  GetSubscriptionsResult,
  GetSubscriptionResult,
  SubscriptionActionResult,
  Subscription,
  LSSubscriptionAttributes,
  LSResource,
  SubscriptionAction,
} from "../types";

type Client = SupabaseClient<Database>;
type SubRow = Database["public"]["Tables"]["commerce_subscriptions"]["Row"];

const PROVIDER = "lemonsqueezy" as const;

// ====================================================================
// Read
// ====================================================================

export interface ListSubscriptionsOptions {
  limit?: number;
  offset?: number;
  status?: string;
  customerEmail?: string;
}

export async function listSubscriptionsForUser(
  supabase: Client,
  userId: string,
  options: ListSubscriptionsOptions = {}
): Promise<GetSubscriptionsResult & { count?: number }> {
  const { limit = 50, offset = 0, status, customerEmail } = options;

  let query = supabase
    .from("commerce_subscriptions")
    .select("*", { count: "exact" })
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER)
    .order("subscription_created_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (customerEmail) {
    query = query.ilike("customer_email", `%${escapeIlike(customerEmail)}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[listSubscriptionsForUser]", error.message);
    return { success: false, errorCode: "save_failed" };
  }

  return {
    success: true,
    subscriptions: (data ?? []).map(rowToSubscription),
    count: count ?? undefined,
  };
}

export async function getSubscriptionForUser(
  supabase: Client,
  userId: string,
  subId: string
): Promise<GetSubscriptionResult> {
  const { data, error } = await supabase
    .from("commerce_subscriptions")
    .select("*")
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER)
    .eq("provider_subscription_id", subId)
    .maybeSingle();

  if (error) return { success: false, errorCode: "save_failed" };
  if (!data) return { success: false, errorCode: "not_found" };
  return { success: true, subscription: rowToSubscription(data) };
}

// ====================================================================
// Actions
// ====================================================================

export async function executeSubscriptionAction(
  supabase: Client,
  userId: string,
  subId: string,
  action: SubscriptionAction,
  pauseOptions?: { mode?: "void" | "free"; resumesAt?: string | null }
): Promise<SubscriptionActionResult> {
  // Ownership check
  const { data: owned, error: ownErr } = await supabase
    .from("commerce_subscriptions")
    .select("provider_subscription_id, status")
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER)
    .eq("provider_subscription_id", subId)
    .maybeSingle();

  if (ownErr) return { success: false, errorCode: "save_failed" };
  if (!owned) return { success: false, errorCode: "not_found" };

  if (action === "cancel" && owned.status === "cancelled") {
    return { success: false, errorCode: "already_cancelled" };
  }

  const { apiKey, errorCode } = await getApiKeyForUser(supabase, userId);
  if (!apiKey) return { success: false, errorCode: errorCode ?? "not_connected" };

  try {
    let response;
    switch (action) {
      case "pause":
        response = await lsApi.pauseSubscription(
          apiKey,
          subId,
          pauseOptions?.mode ?? "void",
          pauseOptions?.resumesAt ?? null
        );
        break;
      case "resume":
        response = await lsApi.resumeSubscription(apiKey, subId);
        break;
      case "cancel":
        response = await lsApi.cancelSubscription(apiKey, subId);
        break;
      default:
        return { success: false, errorCode: "invalid_action" };
    }

    // Upsert + select balik biar dapet row asli dari DB (bukan fake)
    if (response?.data) {
      const row = subscriptionToRow(userId, response.data);
      const { data: fresh, error: upErr } = await supabase
        .from("commerce_subscriptions")
        .upsert(row, { onConflict: "provider,provider_subscription_id" })
        .select("*")
        .single();

      if (upErr) {
        console.error("[executeSubscriptionAction] upsert fail:", upErr.message);
      }

      touchLastUsed(supabase, userId).catch(() => { });

      return {
        success: true,
        subscription: fresh ? rowToSubscription(fresh as SubRow) : undefined,
      };
    }

    return { success: true };
  } catch (err) {
    if (err instanceof LSClientError) {
      return { success: false, errorCode: err.code };
    }
    console.error("[executeSubscriptionAction] unexpected:", err);
    return { success: false, errorCode: "api_error" };
  }
}

// ====================================================================
// Backfill
// ====================================================================

export async function backfillSubscriptions(
  supabase: Client,
  userId: string,
  options: { pages?: number; perPage?: number } = {}
): Promise<GetSubscriptionsResult & { synced?: number }> {
  const { apiKey, errorCode } = await getApiKeyForUser(supabase, userId);
  if (!apiKey) return { success: false, errorCode: errorCode ?? "not_connected" };

  const pages = options.pages ?? 1;
  const perPage = options.perPage ?? 100;

  let synced = 0;
  try {
    for (let p = 1; p <= pages; p++) {
      const response = await lsApi.listSubscriptions(apiKey, {
        perPage,
        pageNumber: p,
      });
      const rows = response.data.map((s) => subscriptionToRow(userId, s));
      if (rows.length === 0) break;

      const { error } = await supabase
        .from("commerce_subscriptions")
        .upsert(rows, { onConflict: "provider,provider_subscription_id" });

      if (error) {
        console.error("[backfillSubscriptions]", error.message);
        return { success: false, errorCode: "save_failed" };
      }

      synced += rows.length;
      if (rows.length < perPage) break;
    }

    touchLastUsed(supabase, userId).catch(() => { });
    return { success: true, synced };
  } catch (err) {
    if (err instanceof LSClientError) {
      return { success: false, errorCode: err.code };
    }
    return { success: false, errorCode: "api_error" };
  }
}

// ====================================================================
// Transformers
// ====================================================================

function rowToSubscription(row: SubRow): Subscription {
  return {
    id: row.id,
    providerSubscriptionId: row.provider_subscription_id,
    orderId: row.order_id,
    productId: row.product_id,
    variantId: row.variant_id,
    productName: row.product_name,
    variantName: row.variant_name,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerId: row.customer_id,
    storeId: row.store_id,
    status: row.status,
    statusLabel: row.status_formatted,
    pauseMode: row.pause_mode,
    pauseResumesAt: row.pause_resumes_at,
    cardBrand: row.card_brand,
    cardLastFour: row.card_last_four,
    trialEndsAt: row.trial_ends_at,
    renewsAt: row.renews_at,
    endsAt: row.ends_at,
    subscriptionCreatedAt: row.subscription_created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function subscriptionToRow(
  userId: string,
  raw: LSResource<LSSubscriptionAttributes>
): Database["public"]["Tables"]["commerce_subscriptions"]["Insert"] {
  const a = raw.attributes;
  return {
    owner_user_id: userId,
    provider: PROVIDER,
    provider_subscription_id: String(raw.id),
    order_id: a.order_id != null ? String(a.order_id) : null,
    order_item_id: a.order_item_id != null ? String(a.order_item_id) : null,
    product_id: a.product_id != null ? String(a.product_id) : null,
    variant_id: a.variant_id != null ? String(a.variant_id) : null,
    product_name: a.product_name ?? null,
    variant_name: a.variant_name ?? null,
    customer_email: a.user_email ?? null,
    customer_name: a.user_name ?? null,
    customer_id: a.customer_id != null ? String(a.customer_id) : null,
    store_id: a.store_id != null ? String(a.store_id) : null,
    status: a.status,
    status_formatted: a.status_formatted ?? null,
    pause_mode: a.pause?.mode ?? null,
    pause_resumes_at: a.pause?.resumes_at ?? null,
    card_brand: a.card_brand ?? null,
    card_last_four: a.card_last_four ?? null,
    trial_ends_at: a.trial_ends_at ?? null,
    billing_anchor: a.billing_anchor ?? null,
    renews_at: a.renews_at ?? null,
    ends_at: a.ends_at ?? null,
    subscription_created_at: a.created_at ?? null,
    // Two-step cast via unknown — konsisten dengan orders.service + webhooks.service
    raw_payload: { data: raw } as unknown as Json,
  };
}
