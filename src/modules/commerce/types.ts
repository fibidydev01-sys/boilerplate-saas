/**
 * Commerce module types — Phase 1 + Phase 2.
 *
 * Split:
 *   - LS API response shapes (raw dari Lemon Squeezy JSON:API)
 *   - Internal types (transformed, flat, ready-to-use di UI)
 *   - Service result types
 *   - Webhook event types
 */

// ====================================================================
// LS JSON:API envelope (shared)
// ====================================================================

export interface LSResource<TAttributes, TRelationships = unknown> {
  type: string;
  id: string;
  attributes: TAttributes;
  relationships?: TRelationships;
  links?: Record<string, string>;
}

export interface LSResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  included?: LSResource<unknown>[];
  links?: Record<string, string>;
}

// ====================================================================
// Phase 1 types (retained)
// ====================================================================

export interface LSUserAttributes {
  name: string;
  email: string;
  color: string;
  avatar_url: string | null;
  has_custom_avatar: boolean;
  createdAt: string;
  updatedAt: string;
}
export type LSUser = LSResource<LSUserAttributes>;

export interface LSStoreAttributes {
  name: string;
  slug: string;
  domain: string | null;
  url: string;
  avatar_url: string | null;
  plan: string;
  country: string;
  country_nicename: string;
  currency: string;
  total_sales: number;
  total_revenue: number;
  thirty_day_sales: number;
  thirty_day_revenue: number;
  created_at: string;
  updated_at: string;
}
export type LSStore = LSResource<LSStoreAttributes>;

export interface LSProductAttributes {
  store_id: number;
  name: string;
  slug: string;
  description: string;
  status: "draft" | "published";
  status_formatted: string;
  thumb_url: string | null;
  large_thumb_url: string | null;
  price: number;
  price_formatted: string;
  from_price: number | null;
  to_price: number | null;
  pay_what_you_want: boolean;
  buy_now_url: string;
  created_at: string;
  updated_at: string;
}
export type LSProduct = LSResource<LSProductAttributes>;

export interface LSVariantAttributes {
  product_id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  is_subscription: boolean;
  interval: string | null;
  interval_count: number | null;
  has_free_trial: boolean;
  trial_interval: string | null;
  trial_interval_count: number | null;
  pay_what_you_want: boolean;
  min_price: number;
  suggested_price: number;
  has_license_keys: boolean;
  license_activation_limit: number;
  license_length_unit: string | null;
  license_length_value: number | null;
  is_license_length_unlimited: boolean;
  sort: number;
  status: "pending" | "draft" | "published";
  status_formatted: string;
  created_at: string;
  updated_at: string;
}
export type LSVariant = LSResource<LSVariantAttributes>;

// ====================================================================
// Phase 2 LS shapes — Order
// ====================================================================

export interface LSOrderAttributes {
  store_id: number;
  customer_id: number;
  identifier: string;
  order_number: number;
  user_name: string;
  user_email: string;
  currency: string;
  currency_rate: string;
  subtotal: number;
  discount_total: number;
  tax: number;
  total: number;
  subtotal_usd: number;
  discount_total_usd: number;
  tax_usd: number;
  total_usd: number;
  tax_name: string | null;
  tax_rate: string | null;
  status: "pending" | "paid" | "void" | "refunded" | "partial_refund";
  status_formatted: string;
  refunded: boolean;
  refunded_at: string | null;
  subtotal_formatted: string;
  discount_total_formatted: string;
  tax_formatted: string;
  total_formatted: string;
  first_order_item: {
    id: number;
    order_id: number;
    product_id: number;
    variant_id: number;
    product_name: string;
    variant_name: string;
    price: number;
    created_at: string;
    updated_at: string;
    test_mode: boolean;
  } | null;
  urls: {
    receipt: string;
  };
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}
export type LSOrder = LSResource<LSOrderAttributes>;

// ====================================================================
// Phase 2 LS shapes — Subscription
// ====================================================================

export interface LSSubscriptionPause {
  mode: "void" | "free";
  resumes_at: string | null;
}

export interface LSSubscriptionAttributes {
  store_id: number;
  customer_id: number;
  order_id: number;
  order_item_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  variant_name: string;
  user_name: string;
  user_email: string;
  status:
  | "on_trial"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "cancelled"
  | "expired";
  status_formatted: string;
  card_brand: string | null;
  card_last_four: string | null;
  pause: LSSubscriptionPause | null;
  cancelled: boolean;
  trial_ends_at: string | null;
  billing_anchor: number | null;
  urls: {
    update_payment_method: string;
    customer_portal: string;
  };
  renews_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}
export type LSSubscription = LSResource<LSSubscriptionAttributes>;

// ====================================================================
// Phase 2 LS shapes — Customer
// ====================================================================

export interface LSCustomerAttributes {
  store_id: number;
  name: string;
  email: string;
  status:
  | "subscribed"
  | "unsubscribed"
  | "archived"
  | "requires_verification"
  | "invalid_email"
  | "bounced";
  city: string | null;
  region: string | null;
  country: string | null;
  total_revenue_currency: number;
  mrr: number;
  status_formatted: string;
  country_formatted: string | null;
  total_revenue_currency_formatted: string;
  mrr_formatted: string;
  urls: {
    customer_portal: string | null;
  };
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}
export type LSCustomer = LSResource<LSCustomerAttributes>;

// ====================================================================
// Phase 2 LS shapes — Checkout
// ====================================================================

export interface LSCheckoutProductOptions {
  name?: string;
  description?: string;
  media?: string[];
  redirect_url?: string;
  receipt_button_text?: string;
  receipt_link_url?: string;
  receipt_thank_you_note?: string;
  enabled_variants?: number[];
}

export interface LSCheckoutOptions {
  embed?: boolean;
  media?: boolean;
  logo?: boolean;
  desc?: boolean;
  discount?: boolean;
  dark?: boolean;
  subscription_preview?: boolean;
  button_color?: string;
}

export interface LSCheckoutData {
  email?: string;
  name?: string;
  billing_address?: {
    country?: string;
    zip?: string;
  };
  tax_number?: string;
  discount_code?: string;
  custom?: Record<string, string>;
  variant_quantities?: Array<{ variant_id: number; quantity: number }>;
}

export interface LSCheckoutAttributes {
  store_id: number;
  variant_id: number;
  custom_price: number | null;
  product_options: LSCheckoutProductOptions;
  checkout_options: LSCheckoutOptions;
  checkout_data: LSCheckoutData;
  expires_at: string | null;
  url: string;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}
export type LSCheckout = LSResource<LSCheckoutAttributes>;

// ====================================================================
// Phase 2 LS shapes — Webhook (registered in LS dashboard)
// ====================================================================

export interface LSWebhookAttributes {
  store_id: number;
  url: string;
  events: string[];
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
  test_mode: boolean;
}
export type LSWebhook = LSResource<LSWebhookAttributes>;

// ====================================================================
// Webhook event envelope (what LS POSTs to our URL)
// ====================================================================

export interface LSWebhookMeta {
  test_mode: boolean;
  event_name: string;
  webhook_id?: string;
  custom_data?: Record<string, unknown>;
}

export interface LSWebhookPayload<T = unknown> {
  meta: LSWebhookMeta;
  data: T;
}

/** Known event names we handle. */
export const WEBHOOK_EVENTS = [
  "order_created",
  "order_refunded",
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_success",
  "subscription_payment_failed",
  "subscription_payment_recovered",
  "license_key_created",
  "license_key_updated",
] as const;

export type WebhookEventName = (typeof WEBHOOK_EVENTS)[number];

// ====================================================================
// Internal types (flat, ready-to-use di UI)
// ====================================================================

// --- Phase 1 ---
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: "draft" | "published";
  statusLabel: string;
  thumbUrl: string | null;
  largeThumbUrl: string | null;
  price: number;
  priceFormatted: string;
  fromPrice: number | null;
  toPrice: number | null;
  buyNowUrl: string;
  variants: Variant[];
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: string;
  name: string;
  slug: string;
  price: number;
  isSubscription: boolean;
  interval: string | null;
  intervalCount: number | null;
  status: "pending" | "draft" | "published";
  statusLabel: string;
  sort: number;
}

// --- Phase 2 ---
export interface Order {
  id: string;
  providerOrderId: string;
  orderNumber: number | null;
  identifier: string | null;
  customerEmail: string | null;
  customerName: string | null;
  customerId: string | null;
  storeId: string | null;
  status: string;
  statusLabel: string | null;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  refundedAmount: number;
  subtotalFormatted: string | null;
  totalFormatted: string | null;
  taxFormatted: string | null;
  refundedAt: string | null;
  orderCreatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  providerSubscriptionId: string;
  orderId: string | null;
  productId: string | null;
  variantId: string | null;
  productName: string | null;
  variantName: string | null;
  customerEmail: string | null;
  customerName: string | null;
  customerId: string | null;
  storeId: string | null;
  status: string;
  statusLabel: string | null;
  pauseMode: string | null;
  pauseResumesAt: string | null;
  cardBrand: string | null;
  cardLastFour: string | null;
  trialEndsAt: string | null;
  renewsAt: string | null;
  endsAt: string | null;
  subscriptionCreatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  providerCustomerId: string;
  email: string | null;
  name: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  totalRevenueCurrency: number | null;
  mrr: number | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookConfig {
  connected: boolean;
  webhookUrl: string | null;
  webhookToken: string | null;
  secretHint: string | null;
  subscribedEvents: string[];
  isActive: boolean;
  lastEventAt: string | null;
}

export interface WebhookEvent {
  id: string;
  eventId: string;
  eventName: string;
  verified: boolean;
  processedAt: string | null;
  error: string | null;
  receivedAt: string;
}

// ====================================================================
// Service result types
// ====================================================================

export type LSErrorCode =
  | "invalid_credentials"
  | "rate_limited"
  | "forbidden"
  | "network_error"
  | "api_error"
  | "not_connected"
  | "decrypt_failed"
  | "save_failed"
  | "not_found"
  | "invalid_signature"
  | "invalid_action"
  | "already_cancelled";

export interface CredentialStatus {
  connected: boolean;
  keyHint: string | null;
  storeId: string | null;
  storeName: string | null;
  isTestMode: boolean;
  lastVerifiedAt: string | null;
}

export interface VerifyCredentialResult {
  valid: boolean;
  storeId?: string;
  storeName?: string;
  errorCode?: LSErrorCode;
}

export interface SaveCredentialResult {
  success: boolean;
  errorCode?: LSErrorCode;
  status?: CredentialStatus;
}

export interface DeleteCredentialResult {
  success: boolean;
  errorCode?: LSErrorCode;
}

export interface GetProductsResult {
  success: boolean;
  products?: Product[];
  errorCode?: LSErrorCode;
}

export interface GetOrdersResult {
  success: boolean;
  orders?: Order[];
  errorCode?: LSErrorCode;
}

export interface GetOrderResult {
  success: boolean;
  order?: Order;
  errorCode?: LSErrorCode;
}

export interface GetSubscriptionsResult {
  success: boolean;
  subscriptions?: Subscription[];
  errorCode?: LSErrorCode;
}

export interface GetSubscriptionResult {
  success: boolean;
  subscription?: Subscription;
  errorCode?: LSErrorCode;
}

export interface SubscriptionActionResult {
  success: boolean;
  subscription?: Subscription;
  errorCode?: LSErrorCode;
}

export interface GetCustomersResult {
  success: boolean;
  customers?: Customer[];
  errorCode?: LSErrorCode;
}

export interface CreateCheckoutInput {
  variantId: string;
  storeId?: string;
  email?: string;
  name?: string;
  discountCode?: string;
  customData?: Record<string, string>;
  redirectUrl?: string;
  receiptThankYouNote?: string;
  darkMode?: boolean;
  subscriptionPreview?: boolean;
  expiresInMinutes?: number;
}

export interface CreateCheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  expiresAt?: string | null;
  errorCode?: LSErrorCode;
}

export interface SaveWebhookConfigInput {
  userId: string;
  secret: string;
  subscribedEvents?: string[];
}

export interface SaveWebhookConfigResult {
  success: boolean;
  config?: WebhookConfig;
  errorCode?: LSErrorCode;
}

export interface WebhookIngestResult {
  ok: boolean;
  deduplicated: boolean;
  reason?: string;
  httpStatus: number;
}

/**
 * Action yang valid untuk PATCH /api/commerce/subscriptions/[id].
 */
export type SubscriptionAction = "pause" | "resume" | "cancel";
