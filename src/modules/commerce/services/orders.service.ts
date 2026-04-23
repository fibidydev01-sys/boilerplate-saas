/**
 * Orders service.
 *
 * Design: orders utamanya di-sync ke DB lokal via webhook. Service ini
 * query dari `commerce_orders` (bukan LS API live) biar cepat + filtering
 * bisa pake SQL.
 *
 * Backfill: ada `backfillOrders()` buat initial sync / manual refresh.
 */

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/core/types";
import { lsApi, LSClientError } from "../lib/ls-client";
import { escapeIlike } from "../lib/format";
import { getApiKeyForUser, touchLastUsed } from "./credentials.service";
import type {
  GetOrdersResult,
  GetOrderResult,
  Order,
  LSOrderAttributes,
  LSResource,
} from "../types";

type Client = SupabaseClient<Database>;
type OrderRow = Database["public"]["Tables"]["commerce_orders"]["Row"];

const PROVIDER = "lemonsqueezy" as const;

// ====================================================================
// Read (from local DB)
// ====================================================================

export interface ListOrdersOptions {
  limit?: number;
  offset?: number;
  status?: string;
  customerEmail?: string;
}

export async function listOrdersForUser(
  supabase: Client,
  userId: string,
  options: ListOrdersOptions = {}
): Promise<GetOrdersResult & { count?: number }> {
  const { limit = 50, offset = 0, status, customerEmail } = options;

  let query = supabase
    .from("commerce_orders")
    .select("*", { count: "exact" })
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER)
    .order("order_created_at", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (customerEmail) {
    query = query.ilike("customer_email", `%${escapeIlike(customerEmail)}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[listOrdersForUser]", error.message);
    return { success: false, errorCode: "save_failed" };
  }

  return {
    success: true,
    orders: (data ?? []).map(rowToOrder),
    count: count ?? undefined,
  };
}

export async function getOrderForUser(
  supabase: Client,
  userId: string,
  orderId: string
): Promise<GetOrderResult> {
  const { data, error } = await supabase
    .from("commerce_orders")
    .select("*")
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER)
    .eq("provider_order_id", orderId)
    .maybeSingle();

  if (error) return { success: false, errorCode: "save_failed" };
  if (!data) return { success: false, errorCode: "not_found" };
  return { success: true, order: rowToOrder(data) };
}

// ====================================================================
// Backfill (manual sync from LS)
// ====================================================================

export async function backfillOrders(
  supabase: Client,
  userId: string,
  options: { pages?: number; perPage?: number } = {}
): Promise<GetOrdersResult & { synced?: number }> {
  const { apiKey, errorCode } = await getApiKeyForUser(supabase, userId);
  if (!apiKey) return { success: false, errorCode: errorCode ?? "not_connected" };

  const pages = options.pages ?? 1;
  const perPage = options.perPage ?? 100;

  let synced = 0;
  try {
    for (let p = 1; p <= pages; p++) {
      const response = await lsApi.listOrders(apiKey, {
        perPage,
        pageNumber: p,
      });
      const rows = response.data.map((o) => orderToRow(userId, o));
      if (rows.length === 0) break;

      const { error } = await supabase
        .from("commerce_orders")
        .upsert(rows, { onConflict: "provider,provider_order_id" });

      if (error) {
        console.error("[backfillOrders] upsert:", error.message);
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
    console.error("[backfillOrders] unexpected:", err);
    return { success: false, errorCode: "api_error" };
  }
}

// ====================================================================
// Transformers
// ====================================================================

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    providerOrderId: row.provider_order_id,
    orderNumber: row.order_number,
    identifier: row.identifier,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerId: row.customer_id,
    storeId: row.store_id,
    status: row.status,
    statusLabel: row.status_formatted,
    currency: row.currency,
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    refundedAmount: row.refunded_amount,
    subtotalFormatted: row.subtotal_formatted,
    totalFormatted: row.total_formatted,
    taxFormatted: row.tax_formatted,
    refundedAt: row.refunded_at,
    orderCreatedAt: row.order_created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function orderToRow(
  userId: string,
  raw: LSResource<LSOrderAttributes>
): Database["public"]["Tables"]["commerce_orders"]["Insert"] {
  const a = raw.attributes;
  return {
    owner_user_id: userId,
    provider: PROVIDER,
    provider_order_id: String(raw.id),
    order_number: a.order_number ?? null,
    identifier: a.identifier ?? null,
    customer_email: a.user_email ?? null,
    customer_name: a.user_name ?? null,
    customer_id: a.customer_id != null ? String(a.customer_id) : null,
    store_id: a.store_id != null ? String(a.store_id) : null,
    status: a.status,
    status_formatted: a.status_formatted ?? null,
    currency: a.currency,
    subtotal: a.subtotal ?? 0,
    tax: a.tax ?? 0,
    total: a.total ?? 0,
    refunded_amount: a.refunded ? a.total : 0,
    subtotal_formatted: a.subtotal_formatted ?? null,
    total_formatted: a.total_formatted ?? null,
    tax_formatted: a.tax_formatted ?? null,
    refunded_at: a.refunded_at ?? null,
    order_created_at: a.created_at ?? null,
    // Two-step cast: LSResource.relationships typed `unknown` jadi TS gak
    // bisa prove direct compat ke Json. `as unknown as Json` sama dengan
    // pattern di webhooks.service.ts — konsisten.
    raw_payload: { data: raw } as unknown as Json,
  };
}
