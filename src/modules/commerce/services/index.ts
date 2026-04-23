/**
 * @/modules/commerce/services — DB + external API service calls.
 *
 * Server-only. Import dari route handlers atau RSC, bukan dari client.
 */

// Phase 1
export {
  verifyCredential,
  saveCredential,
  getCredentialStatus,
  getApiKeyForUser,
  touchLastUsed,
  deleteCredential,
  type SaveCredentialInput,
} from "./credentials.service";

export { listProductsForUser } from "./products.service";

// Phase 2 — Orders
export {
  listOrdersForUser,
  getOrderForUser,
  backfillOrders,
  type ListOrdersOptions,
} from "./orders.service";

// Phase 2 — Subscriptions
export {
  listSubscriptionsForUser,
  getSubscriptionForUser,
  executeSubscriptionAction,
  backfillSubscriptions,
  type ListSubscriptionsOptions,
} from "./subscriptions.service";

// Phase 2 — Customers
export {
  listCustomersForUser,
  backfillCustomers,
  type ListCustomersOptions,
} from "./customers.service";

// Phase 2 — Checkout
export { createCheckoutLink } from "./checkout.service";

// Phase 2 — Webhooks
export {
  getWebhookConfigStatus,
  provisionWebhookConfig,
  revealWebhookSecretOnce,
  deleteWebhookConfig,
  ingestWebhook,
} from "./webhooks.service";