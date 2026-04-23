/**
 * Commerce Products Service.
 *
 * Server-only: ambil products dari LS API untuk user tertentu.
 *
 * Flow:
 *   1. Get decrypted API key via credentials service
 *   2. Call LS API /products (include variants)
 *   3. Transform raw LS shapes → flat Product[] yang siap render di UI
 *   4. Update last_used_at (non-blocking)
 */

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/core/types";
import { lsApi, LSClientError, isVariantResource } from "../lib/ls-client";
import { getApiKeyForUser, getCredentialStatus, touchLastUsed } from "./credentials.service";
import type {
  Product,
  Variant,
  GetProductsResult,
  LSProduct,
  LSVariantAttributes,
  LSResource,
} from "../types";

type Client = SupabaseClient<Database>;

export async function listProductsForUser(
  supabase: Client,
  userId: string
): Promise<GetProductsResult> {
  // 1. Get API key
  const { apiKey, errorCode: keyError } = await getApiKeyForUser(
    supabase,
    userId
  );
  if (!apiKey) {
    return { success: false, errorCode: keyError ?? "not_connected" };
  }

  // 2. Get store id dari credential status (cached)
  const status = await getCredentialStatus(supabase, userId);
  const storeId = status.storeId ?? undefined;

  // 3. Call LS API
  try {
    const response = await lsApi.listProducts(apiKey, { storeId, perPage: 100 });

    // 4. Build variants lookup dari included
    const variantsByProductId = new Map<number, Variant[]>();
    if (response.included) {
      for (const resource of response.included) {
        if (!isVariantResource(resource)) continue;
        const variantResource = resource as LSResource<LSVariantAttributes>;
        const variant = transformVariant(variantResource);
        const productId = variantResource.attributes.product_id;
        const existing = variantsByProductId.get(productId) ?? [];
        existing.push(variant);
        variantsByProductId.set(productId, existing);
      }
    }

    // 5. Transform products, attach variants, sort variants by .sort
    const products: Product[] = response.data.map((raw) => {
      const rawId = Number(raw.id);
      const variants = (variantsByProductId.get(rawId) ?? []).sort(
        (a, b) => a.sort - b.sort
      );
      return transformProduct(raw, variants);
    });

    // 6. Touch last_used_at (non-blocking)
    touchLastUsed(supabase, userId).catch(() => {
      // Swallow — non-critical
    });

    return { success: true, products };
  } catch (err) {
    if (err instanceof LSClientError) {
      return { success: false, errorCode: err.code };
    }
    console.error("[listProductsForUser] unexpected error:", err);
    return { success: false, errorCode: "api_error" };
  }
}

// ====================================================================
// Transformers
// ====================================================================

function transformProduct(raw: LSProduct, variants: Variant[]): Product {
  const a = raw.attributes;
  return {
    id: raw.id,
    name: a.name,
    slug: a.slug,
    description: a.description,
    status: a.status,
    statusLabel: a.status_formatted,
    thumbUrl: a.thumb_url,
    largeThumbUrl: a.large_thumb_url,
    price: a.price,
    priceFormatted: a.price_formatted,
    fromPrice: a.from_price,
    toPrice: a.to_price,
    buyNowUrl: a.buy_now_url,
    variants,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  };
}

function transformVariant(raw: LSResource<LSVariantAttributes>): Variant {
  const a = raw.attributes;
  return {
    id: raw.id,
    name: a.name,
    slug: a.slug,
    price: a.price,
    isSubscription: a.is_subscription,
    interval: a.interval,
    intervalCount: a.interval_count,
    status: a.status,
    statusLabel: a.status_formatted,
    sort: a.sort,
  };
}
