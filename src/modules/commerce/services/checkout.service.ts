/**
 * Checkout service — generate checkout URL untuk variant.
 *
 * Flow:
 *   1. User pilih product + variant di UI
 *   2. Frontend POST /api/commerce/checkout dengan { variantId, email?, ... }
 *   3. Service fetch API key → call LS createCheckout → return URL
 *   4. Frontend redirect user ke URL atau open di tab baru
 *
 * Kenapa gak langsung pake `product.buy_now_url` dari LS product?
 *   - buy_now_url generic — gak pre-fill email/name/custom data
 *   - Gak support redirect_url custom (user bakal di-redirect ke default LS success page)
 *   - Gak bisa attach custom_data yang bakal muncul di webhook
 *
 * Custom data pattern:
 *   checkout_data.custom = { user_id: "<internal_id>" }
 *   → Payload webhook subscription/order bakal include `meta.custom_data`
 *   → Berguna buat match LS customer ke user lokal (kalau app kamu
 *     multi-user dan product di-jual ke end-users).
 */

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/core/types";
import { lsApi, LSClientError } from "../lib/ls-client";
import {
  getApiKeyForUser,
  getCredentialStatus,
  touchLastUsed,
} from "./credentials.service";
import type { CreateCheckoutInput, CreateCheckoutResult } from "../types";

type Client = SupabaseClient<Database>;

export async function createCheckoutLink(
  supabase: Client,
  userId: string,
  input: CreateCheckoutInput
): Promise<CreateCheckoutResult> {
  const { apiKey, errorCode } = await getApiKeyForUser(supabase, userId);
  if (!apiKey) return { success: false, errorCode: errorCode ?? "not_connected" };

  // Resolve store ID — utamain yang di input, fallback ke credential status
  let storeId = input.storeId;
  let testMode = false;
  if (!storeId) {
    const status = await getCredentialStatus(supabase, userId);
    if (!status.storeId) {
      return { success: false, errorCode: "not_connected" };
    }
    storeId = status.storeId;
    testMode = status.isTestMode;
  }

  // Build expiry
  let expiresAt: string | null = null;
  if (input.expiresInMinutes && input.expiresInMinutes > 0) {
    expiresAt = new Date(
      Date.now() + input.expiresInMinutes * 60_000
    ).toISOString();
  }

  try {
    const response = await lsApi.createCheckout(apiKey, {
      storeId,
      variantId: input.variantId,
      productOptions: {
        redirect_url: input.redirectUrl,
        receipt_thank_you_note: input.receiptThankYouNote,
      },
      checkoutOptions: {
        dark: input.darkMode ?? false,
        subscription_preview: input.subscriptionPreview ?? true,
        embed: false,
      },
      checkoutData: {
        email: input.email,
        name: input.name,
        discount_code: input.discountCode,
        custom: input.customData,
      },
      expiresAt,
      testMode,
    });

    touchLastUsed(supabase, userId).catch(() => { });

    return {
      success: true,
      checkoutUrl: response.data.attributes.url,
      expiresAt: response.data.attributes.expires_at,
    };
  } catch (err) {
    if (err instanceof LSClientError) {
      return { success: false, errorCode: err.code };
    }
    console.error("[createCheckoutLink] unexpected:", err);
    return { success: false, errorCode: "api_error" };
  }
}