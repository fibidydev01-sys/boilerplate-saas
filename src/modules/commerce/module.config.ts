/**
 * Module: commerce (placeholder)
 *
 * Akan diaktifkan di Phase 2/3 sesuai roadmap boilerplate.
 * Toggle enable-nya di `src/config/app.config.ts`.
 */

import { appConfig } from "@/config";

export const commerceModule = {
  name: "commerce" as const,
  enabled: appConfig.modules.commerce.enabled,
  basePath: appConfig.modules.commerce.path,
  dependencies: [] as const,
} as const;

export type CommerceModuleConfig = typeof commerceModule;
