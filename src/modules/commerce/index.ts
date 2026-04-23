/**
 * @/modules/commerce — public surface.
 *
 * Phase 1 + 2: Server-side foundation + client components.
 *
 * Import guidance:
 *   - Types & module config → safe untuk client & server
 *   - Components → client-only (semua "use client")
 *   - Services (`./services`) → SERVER ONLY (ada "server-only" import)
 */

// Module config
export { commerceModule, type CommerceModuleConfig } from "./module.config";

// Types
export type {
  Product,
  Variant,
  Order,
  Subscription,
  Customer,
  WebhookConfig,
  WebhookEvent,
  CredentialStatus,
  VerifyCredentialResult,
  SaveCredentialResult,
  DeleteCredentialResult,
  GetProductsResult,
  GetOrdersResult,
  GetOrderResult,
  GetSubscriptionsResult,
  GetSubscriptionResult,
  GetCustomersResult,
  CreateCheckoutInput,
  CreateCheckoutResult,
  SubscriptionAction,
  SubscriptionActionResult,
  SaveWebhookConfigInput,
  SaveWebhookConfigResult,
  WebhookIngestResult,
  LSErrorCode,
} from "./types";

// Components — re-export biar bisa `import { ProductsGrid } from "@/modules/commerce"`
export {
  ConnectLSForm,
  LSStatusCard,
  IntegrationPanel,
  ProductsGrid,
  ProductCard,
  OrdersTable,
  SubscriptionsTable,
  CustomersTable,
  CheckoutButton,
  WebhookConfigPanel,
} from "./components";
