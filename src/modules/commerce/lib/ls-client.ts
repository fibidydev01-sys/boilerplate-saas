/**
 * Lemon Squeezy API client — Phase 1 + Phase 2.
 *
 * Server-only. Thin fetch wrapper + endpoint helpers.
 * Throws LSClientError dengan code yang bisa di-map ke i18n.
 *
 * Ref: https://docs.lemonsqueezy.com/api
 */

import "server-only";
import type {
  LSErrorCode,
  LSResponse,
  LSUser,
  LSStore,
  LSProduct,
  LSVariant,
  LSOrder,
  LSSubscription,
  LSCustomer,
  LSCheckout,
  LSWebhook,
  LSCheckoutProductOptions,
  LSCheckoutOptions,
  LSCheckoutData,
} from "../types";

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";
const DEFAULT_TIMEOUT_MS = 10_000;

export class LSClientError extends Error {
  constructor(
    public status: number,
    public code: LSErrorCode,
    message: string
  ) {
    super(message);
    this.name = "LSClientError";
  }
}

function mapStatusToCode(status: number): LSErrorCode {
  if (status === 401) return "invalid_credentials";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  return "api_error";
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function lsRequest<T>(
  apiKey: string,
  path: string,
  options?: RequestOptions
): Promise<T> {
  const url = `${LS_API_BASE}${path}`;
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${apiKey}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new LSClientError(
        response.status,
        mapStatusToCode(response.status),
        `LS API ${response.status}: ${body.slice(0, 200)}`
      );
    }

    // 204 No Content — return null-ish
    if (response.status === 204) {
      return null as T;
    }
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof LSClientError) throw err;
    if (
      err instanceof Error &&
      (err.name === "AbortError" || err.message.includes("fetch"))
    ) {
      throw new LSClientError(0, "network_error", `Network error: ${err.message}`);
    }
    throw new LSClientError(
      0,
      "network_error",
      `Unknown error: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    clearTimeout(timer);
  }
}

// ====================================================================
// Endpoint helpers
// ====================================================================

interface ListParams {
  storeId?: string;
  perPage?: number;
  pageNumber?: number;
}

function buildListQuery(
  params?: ListParams,
  filters?: Record<string, string | undefined>,
  include?: string
): string {
  const query = new URLSearchParams();
  if (params?.storeId) query.set("filter[store_id]", params.storeId);
  if (filters) {
    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined) query.set(`filter[${key}]`, val);
    }
  }
  if (params?.perPage) query.set("page[size]", String(params.perPage));
  if (params?.pageNumber) query.set("page[number]", String(params.pageNumber));
  if (include) query.set("include", include);
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const lsApi = {
  // ---- Phase 1 ----
  getMe: (apiKey: string) =>
    lsRequest<LSResponse<LSUser>>(apiKey, "/users/me"),

  listStores: (apiKey: string) =>
    lsRequest<LSResponse<LSStore[]>>(apiKey, "/stores"),

  listProducts: (apiKey: string, params?: ListParams) =>
    lsRequest<LSResponse<LSProduct[]>>(
      apiKey,
      `/products${buildListQuery(params, undefined, "variants")}`
    ),

  // ---- Phase 2: Orders ----

  listOrders: (
    apiKey: string,
    params?: ListParams & { status?: string; userEmail?: string }
  ) =>
    lsRequest<LSResponse<LSOrder[]>>(
      apiKey,
      `/orders${buildListQuery(params, {
        status: params?.status,
        user_email: params?.userEmail,
      })}`
    ),

  getOrder: (apiKey: string, orderId: string) =>
    lsRequest<LSResponse<LSOrder>>(apiKey, `/orders/${orderId}`),

  // ---- Phase 2: Subscriptions ----

  listSubscriptions: (
    apiKey: string,
    params?: ListParams & { status?: string; productId?: string }
  ) =>
    lsRequest<LSResponse<LSSubscription[]>>(
      apiKey,
      `/subscriptions${buildListQuery(params, {
        status: params?.status,
        product_id: params?.productId,
      })}`
    ),

  getSubscription: (apiKey: string, subId: string) =>
    lsRequest<LSResponse<LSSubscription>>(apiKey, `/subscriptions/${subId}`),

  /**
   * PATCH subscription. Gunakan helper methods di bawah untuk
   * pause/resume/cancel biar gak salah format body.
   */
  patchSubscription: (
    apiKey: string,
    subId: string,
    attributes: Record<string, unknown>
  ) =>
    lsRequest<LSResponse<LSSubscription>>(apiKey, `/subscriptions/${subId}`, {
      method: "PATCH",
      body: JSON.stringify({
        data: {
          type: "subscriptions",
          id: subId,
          attributes,
        },
      }),
    }),

  pauseSubscription: (
    apiKey: string,
    subId: string,
    mode: "void" | "free" = "void",
    resumesAt?: string | null
  ) =>
    lsApi.patchSubscription(apiKey, subId, {
      pause: { mode, resumes_at: resumesAt ?? null },
    }),

  resumeSubscription: (apiKey: string, subId: string) =>
    lsApi.patchSubscription(apiKey, subId, { pause: null }),

  /**
   * Cancel subscription. LS DELETE /subscriptions/{id} == cancel
   * (status jadi "cancelled", renews_at = null, ends_at = periode akhir).
   * Sub tetap accessible sampai ends_at.
   */
  cancelSubscription: (apiKey: string, subId: string) =>
    lsRequest<LSResponse<LSSubscription>>(apiKey, `/subscriptions/${subId}`, {
      method: "DELETE",
    }),

  // ---- Phase 2: Customers ----

  listCustomers: (apiKey: string, params?: ListParams & { email?: string }) =>
    lsRequest<LSResponse<LSCustomer[]>>(
      apiKey,
      `/customers${buildListQuery(params, { email: params?.email })}`
    ),

  getCustomer: (apiKey: string, customerId: string) =>
    lsRequest<LSResponse<LSCustomer>>(apiKey, `/customers/${customerId}`),

  // ---- Phase 2: Checkout ----

  /**
   * Create checkout link. LS mengembalikan `attributes.url` yang bisa
   * langsung dibuka di browser (atau di-embed via Lemon.js).
   */
  createCheckout: (
    apiKey: string,
    input: {
      storeId: string;
      variantId: string;
      customPrice?: number | null;
      productOptions?: LSCheckoutProductOptions;
      checkoutOptions?: LSCheckoutOptions;
      checkoutData?: LSCheckoutData;
      expiresAt?: string | null;
      testMode?: boolean;
    }
  ) =>
    lsRequest<LSResponse<LSCheckout>>(apiKey, "/checkouts", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            custom_price: input.customPrice ?? null,
            product_options: input.productOptions ?? {},
            checkout_options: input.checkoutOptions ?? {},
            checkout_data: input.checkoutData ?? {},
            expires_at: input.expiresAt ?? null,
            test_mode: input.testMode ?? false,
          },
          relationships: {
            store: {
              data: { type: "stores", id: String(input.storeId) },
            },
            variant: {
              data: { type: "variants", id: String(input.variantId) },
            },
          },
        },
      }),
    }),

  // ---- Phase 2: Webhooks (register auto di LS) ----

  listWebhooks: (apiKey: string, params?: ListParams) =>
    lsRequest<LSResponse<LSWebhook[]>>(
      apiKey,
      `/webhooks${buildListQuery(params)}`
    ),

  createWebhook: (
    apiKey: string,
    input: {
      storeId: string;
      url: string;
      events: string[];
      secret: string;
      testMode?: boolean;
    }
  ) =>
    lsRequest<LSResponse<LSWebhook>>(apiKey, "/webhooks", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "webhooks",
          attributes: {
            url: input.url,
            events: input.events,
            secret: input.secret,
            test_mode: input.testMode ?? false,
          },
          relationships: {
            store: {
              data: { type: "stores", id: String(input.storeId) },
            },
          },
        },
      }),
    }),

  deleteWebhook: (apiKey: string, webhookId: string) =>
    lsRequest<void>(apiKey, `/webhooks/${webhookId}`, {
      method: "DELETE",
    }),
};

/**
 * Type guard: resource dari included[] adalah variant.
 */
export function isVariantResource(resource: {
  type: string;
}): resource is { type: "variants" } & {
  id: string;
  attributes: LSVariant["attributes"];
} {
  return resource.type === "variants";
}