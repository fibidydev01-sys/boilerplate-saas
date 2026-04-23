/**
 * Webhooks service — orchestrate receive → verify → persist → apply.
 *
 * Server-only.
 *
 * Flow di route handler `/api/commerce/webhooks/[token]`:
 *   1. Extract token dari path, cari config → dapet owner_user_id + secret
 *   2. Read raw body (TEXT) + signature header
 *   3. Call ingestWebhook() yang akan:
 *      a. Verify HMAC signature
 *      b. Parse payload
 *      c. UPSERT ke commerce_webhook_events (idempotency via event_id)
 *         - Kalau udah exist: return {deduplicated: true}, 200 OK (jangan
 *           retry ke LS)
 *      d. Route ke handler per event_name → update orders/subscriptions
 *      e. Mark processed_at atau error
 *   4. Return 200 kalau sukses, 401 kalau sig invalid, 500 kalau
 *      processing error (LS akan retry)
 *
 * IMPORTANT: Semua akses DB di sini pake SERVICE ROLE client (bukan
 * user session), karena webhook request dari LS gak punya auth.uid().
 * Caller harus pass `supabase` yang dibuat via createServiceRoleClient().
 */

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/core/types";
import { decrypt, encrypt } from "@/core/lib/encryption";
import {
  verifyLSSignature,
  generateWebhookSecret,
  generateWebhookToken,
  getSecretHint,
} from "../lib/webhook-verify";
import type {
  LSWebhookPayload,
  LSOrderAttributes,
  LSSubscriptionAttributes,
  WebhookConfig,
  WebhookIngestResult,
  SaveWebhookConfigResult,
  SaveWebhookConfigInput,
  WEBHOOK_EVENTS,
} from "../types";
import { WEBHOOK_EVENTS as EVENTS_CONST } from "../types";

type Client = SupabaseClient<Database>;

const PROVIDER = "lemonsqueezy" as const;

// ====================================================================
// Config management (called via authenticated user route)
// ====================================================================

export async function getWebhookConfigStatus(
  supabase: Client,
  userId: string,
  appUrl: string
): Promise<WebhookConfig> {
  const { data, error } = await supabase
    .from("commerce_webhook_configs")
    .select(
      "webhook_token, secret_hint, subscribed_events, is_active, last_event_at"
    )
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER)
    .maybeSingle();

  if (error || !data) {
    return {
      connected: false,
      webhookUrl: null,
      webhookToken: null,
      secretHint: null,
      subscribedEvents: [],
      isActive: false,
      lastEventAt: null,
    };
  }

  return {
    connected: true,
    webhookUrl: buildWebhookUrl(appUrl, data.webhook_token),
    webhookToken: data.webhook_token,
    secretHint: data.secret_hint,
    subscribedEvents: data.subscribed_events ?? [],
    isActive: data.is_active,
    lastEventAt: data.last_event_at,
  };
}

/**
 * Create atau regenerate webhook config. Kalau user udah punya, secret
 * + token akan di-regenerate (user harus update di LS dashboard).
 */
export async function provisionWebhookConfig(
  supabase: Client,
  input: SaveWebhookConfigInput & { appUrl: string }
): Promise<SaveWebhookConfigResult> {
  const secret = input.secret || generateWebhookSecret();
  const token = generateWebhookToken();

  let encrypted: string;
  try {
    encrypted = encrypt(secret);
  } catch (err) {
    console.error("[provisionWebhookConfig] encrypt fail:", err);
    return { success: false, errorCode: "save_failed" };
  }

  const subscribedEvents = input.subscribedEvents ?? [...EVENTS_CONST];

  const { error } = await supabase
    .from("commerce_webhook_configs")
    .upsert(
      {
        owner_user_id: input.userId,
        provider: PROVIDER,
        encrypted_secret: encrypted,
        secret_hint: getSecretHint(secret),
        webhook_token: token,
        subscribed_events: subscribedEvents,
        is_active: true,
      },
      { onConflict: "owner_user_id,provider" }
    );

  if (error) {
    console.error("[provisionWebhookConfig] upsert fail:", error.message);
    return { success: false, errorCode: "save_failed" };
  }

  return {
    success: true,
    config: {
      connected: true,
      webhookUrl: buildWebhookUrl(input.appUrl, token),
      webhookToken: token,
      secretHint: getSecretHint(secret),
      subscribedEvents,
      isActive: true,
      lastEventAt: null,
    },
  };
}

/**
 * Return raw secret (plaintext) — dipake saat user lihat setup wizard
 * pertama kali. Setelah itu secret gak bisa di-retrieve lagi (cuma hint).
 */
export async function revealWebhookSecretOnce(
  supabase: Client,
  userId: string
): Promise<{ secret: string | null; errorCode?: string }> {
  const { data, error } = await supabase
    .from("commerce_webhook_configs")
    .select("encrypted_secret")
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER)
    .maybeSingle();

  if (error || !data) return { secret: null, errorCode: "not_connected" };

  try {
    return { secret: decrypt(data.encrypted_secret) };
  } catch {
    return { secret: null, errorCode: "decrypt_failed" };
  }
}

export async function deleteWebhookConfig(
  supabase: Client,
  userId: string
): Promise<{ success: boolean }> {
  const { error } = await supabase
    .from("commerce_webhook_configs")
    .delete()
    .eq("owner_user_id", userId)
    .eq("provider", PROVIDER);
  return { success: !error };
}

function buildWebhookUrl(appUrl: string, token: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/api/commerce/webhooks/${token}`;
}

// ====================================================================
// Ingestion (called from webhook route — no session)
// ====================================================================

interface IngestInput {
  token: string;
  rawBody: string;
  signature: string | null;
  eventIdHeader: string | null;
  eventNameHeader: string | null;
}

export async function ingestWebhook(
  supabase: Client,
  input: IngestInput
): Promise<WebhookIngestResult> {
  // 1. Resolve config by token
  const { data: config, error: configErr } = await supabase
    .from("commerce_webhook_configs")
    .select("owner_user_id, encrypted_secret, is_active")
    .eq("webhook_token", input.token)
    .eq("provider", PROVIDER)
    .maybeSingle();

  if (configErr || !config) {
    return {
      ok: false,
      deduplicated: false,
      reason: "unknown_token",
      httpStatus: 404,
    };
  }

  if (!config.is_active) {
    return {
      ok: false,
      deduplicated: false,
      reason: "config_inactive",
      httpStatus: 403,
    };
  }

  // 2. Decrypt secret
  let secret: string;
  try {
    secret = decrypt(config.encrypted_secret);
  } catch {
    return {
      ok: false,
      deduplicated: false,
      reason: "decrypt_failed",
      httpStatus: 500,
    };
  }

  // 3. Verify signature
  const verification = verifyLSSignature(input.rawBody, input.signature, secret);
  if (!verification.valid) {
    return {
      ok: false,
      deduplicated: false,
      reason: `signature_${verification.reason ?? "invalid"}`,
      httpStatus: 401,
    };
  }

  // 4. Parse payload
  let payload: LSWebhookPayload;
  try {
    payload = JSON.parse(input.rawBody) as LSWebhookPayload;
  } catch {
    return {
      ok: false,
      deduplicated: false,
      reason: "invalid_json",
      httpStatus: 400,
    };
  }

  const eventName =
    input.eventNameHeader || payload.meta?.event_name || "unknown";
  const eventId = input.eventIdHeader || extractEventId(payload);

  if (!eventId) {
    return {
      ok: false,
      deduplicated: false,
      reason: "missing_event_id",
      httpStatus: 400,
    };
  }

  // 5. Idempotent insert (UNIQUE provider,event_id)
  const { data: inserted, error: insertErr } = await supabase
    .from("commerce_webhook_events")
    .insert({
      owner_user_id: config.owner_user_id,
      provider: PROVIDER,
      event_id: eventId,
      event_name: eventName,
      payload: payload as unknown as Json,
      signature: input.signature,
      verified: true,
    })
    .select("id")
    .single();

  if (insertErr) {
    // 23505 = unique violation = duplicate event (LS retry)
    // Kita treat sebagai sukses (200) biar LS berhenti retry.
    if (insertErr.code === "23505") {
      return { ok: true, deduplicated: true, httpStatus: 200 };
    }
    console.error("[ingestWebhook] insert fail:", insertErr.message);
    return {
      ok: false,
      deduplicated: false,
      reason: "insert_failed",
      httpStatus: 500,
    };
  }

  // 6. Apply to business tables (best-effort — errors logged & recorded,
  //    tapi 200 dikembaliin kalau payload udah ke-persist)
  const applyResult = await applyEvent(
    supabase,
    config.owner_user_id,
    eventName,
    payload
  );

  await supabase
    .from("commerce_webhook_events")
    .update({
      processed_at: new Date().toISOString(),
      error: applyResult.ok ? null : applyResult.error ?? "apply_failed",
    })
    .eq("id", inserted.id);

  // Update last_event_at pada config
  await supabase
    .from("commerce_webhook_configs")
    .update({ last_event_at: new Date().toISOString() })
    .eq("owner_user_id", config.owner_user_id)
    .eq("provider", PROVIDER);

  return { ok: true, deduplicated: false, httpStatus: 200 };
}

function extractEventId(payload: LSWebhookPayload): string | null {
  // Beberapa webhook LS gak kirim X-Event-Id header di test mode.
  // Fallback: compose dari meta + data.id + timestamp
  const data = payload.data as { id?: string | number } | undefined;
  if (data?.id && payload.meta?.event_name) {
    return `${payload.meta.event_name}:${data.id}`;
  }
  return null;
}

// ====================================================================
// Event routing
// ====================================================================

interface ApplyResult {
  ok: boolean;
  error?: string;
}

async function applyEvent(
  supabase: Client,
  userId: string,
  eventName: string,
  payload: LSWebhookPayload
): Promise<ApplyResult> {
  try {
    switch (eventName) {
      case "order_created":
      case "order_refunded":
        return await applyOrderEvent(supabase, userId, payload);

      case "subscription_created":
      case "subscription_updated":
      case "subscription_cancelled":
      case "subscription_resumed":
      case "subscription_expired":
      case "subscription_paused":
      case "subscription_unpaused":
      case "subscription_payment_success":
      case "subscription_payment_failed":
      case "subscription_payment_recovered":
        return await applySubscriptionEvent(supabase, userId, payload);

      default:
        // Unknown event — kita simpen tapi gak apply. Gak dianggap error.
        return { ok: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[applyEvent] ${eventName} failed:`, msg);
    return { ok: false, error: msg };
  }
}

async function applyOrderEvent(
  supabase: Client,
  userId: string,
  payload: LSWebhookPayload
): Promise<ApplyResult> {
  const data = payload.data as {
    id: string;
    attributes: LSOrderAttributes;
  };
  if (!data?.id || !data?.attributes) {
    return { ok: false, error: "invalid_order_payload" };
  }

  const a = data.attributes;

  const { error } = await supabase.from("commerce_orders").upsert(
    {
      owner_user_id: userId,
      provider: PROVIDER,
      provider_order_id: String(data.id),
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
      raw_payload: payload as unknown as Json,
    },
    { onConflict: "provider,provider_order_id" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function applySubscriptionEvent(
  supabase: Client,
  userId: string,
  payload: LSWebhookPayload
): Promise<ApplyResult> {
  const data = payload.data as {
    id: string;
    attributes: LSSubscriptionAttributes;
  };
  if (!data?.id || !data?.attributes) {
    return { ok: false, error: "invalid_subscription_payload" };
  }

  const a = data.attributes;

  const { error } = await supabase.from("commerce_subscriptions").upsert(
    {
      owner_user_id: userId,
      provider: PROVIDER,
      provider_subscription_id: String(data.id),
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
      raw_payload: payload as unknown as Json,
    },
    { onConflict: "provider,provider_subscription_id" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}