/**
 * Module: commerce
 *
 * DNA: Product catalog + payment integration.
 *
 * Phase 1: Lemon Squeezy credentials + products read-only.
 * Phase 2+: Orders, customers, subscriptions, webhooks.
 */

import { appConfig } from "@/config";

export const commerceModule = {
  name: "commerce" as const,
  enabled: appConfig.modules.commerce.enabled,
  basePath: appConfig.modules.commerce.path,
  dependencies: [] as const,
  provider: "lemonsqueezy" as const,
} as const;

export type CommerceModuleConfig = typeof commerceModule;
