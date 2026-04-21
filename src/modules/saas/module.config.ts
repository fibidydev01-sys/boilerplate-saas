/**
 * Module: saas (placeholder)
 *
 * Akan diaktifkan di Phase 2/3 sesuai roadmap boilerplate.
 * Toggle enable-nya di `src/config/app.config.ts`.
 */

import { appConfig } from "@/config";

export const saasModule = {
  name: "saas" as const,
  enabled: appConfig.modules.saas.enabled,
  basePath: appConfig.modules.saas.path,
  dependencies: [] as const,
} as const;

export type SaasModuleConfig = typeof saasModule;
