/**
 * Customers service.
 *
 * LS customer records derived dari orders. Kita sync terpisah (bukan
 * derived dari commerce_orders) biar bisa dapet `mrr`, `total_revenue`,
 * `status` yang LS compute sendiri.
 */

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/core/types";
import { lsApi, LSClientError } from "../lib/ls-client";
import { getApiKeyForUser, touchLastUsed } from "./credentials.service";
import type {
  GetCustomersResult,
  Customer,
  LSCustomerAttributes,
  LSResource,
} from "../types";

type Client = SupabaseClient<Database>;
type CustRow = Database["public"]["Tables"]["commerce_customers"]["Row"];

const PROVIDER = "lemonsqueezy" as const;

export interface ListCustomersOptions {
  limit?: number;
  offset?: number;
  email?: string;
}

export async function listCustomersForUser(
  supabase: Client,
  userId: string,
  options: ListCustomersOptions = {}
): Promise<GetCustomersResult & { count?: number }> {
  const { limit = 50, offset = 0, email } = options;

  let query = supabase
    .from("commerce_customers")
    .select("*", { count: "exact" })
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER)
    .order("mrr", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (email) query = query.ilike("email", `%${email}%`);

  const { data, error, count } = await query;
  if (error) return { success: false, errorCode: "save_failed" };

  return {
    success: true,
    customers: (data ?? []).map(rowToCustomer),
    count: count ?? undefined,
  };
}

export async function backfillCustomers(
  supabase: Client,
  userId: string,
  options: { pages?: number; perPage?: number } = {}
): Promise<GetCustomersResult & { synced?: number }> {
  const { apiKey, errorCode } = await getApiKeyForUser(supabase, userId);
  if (!apiKey) return { success: false, errorCode: errorCode ?? "not_connected" };

  const pages = options.pages ?? 1;
  const perPage = options.perPage ?? 100;

  let synced = 0;
  try {
    for (let p = 1; p <= pages; p++) {
      const response = await lsApi.listCustomers(apiKey, {
        perPage,
        pageNumber: p,
      });
      const rows = response.data.map((c) => customerToRow(userId, c));
      if (rows.length === 0) break;

      const { error } = await supabase
        .from("commerce_customers")
        .upsert(rows, { onConflict: "provider,provider_customer_id" });

      if (error) {
        console.error("[backfillCustomers]", error.message);
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

function rowToCustomer(row: CustRow): Customer {
  return {
    id: row.id,
    providerCustomerId: row.provider_customer_id,
    email: row.email,
    name: row.name,
    city: row.city,
    region: row.region,
    country: row.country,
    totalRevenueCurrency: row.total_revenue_currency,
    mrr: row.mrr,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function customerToRow(
  userId: string,
  raw: LSResource<LSCustomerAttributes>
): Database["public"]["Tables"]["commerce_customers"]["Insert"] {
  const a = raw.attributes;
  return {
    owner_user_id: userId,
    provider: PROVIDER,
    provider_customer_id: String(raw.id),
    email: a.email ?? null,
    name: a.name ?? null,
    city: a.city ?? null,
    region: a.region ?? null,
    country: a.country ?? null,
    total_revenue_currency: a.total_revenue_currency ?? 0,
    mrr: a.mrr ?? 0,
    status: a.status ?? null,
  };
}