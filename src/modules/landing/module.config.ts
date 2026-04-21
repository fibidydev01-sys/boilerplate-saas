/**
 * Module: landing (placeholder)
 *
 * Akan diaktifkan di Phase 2/3 sesuai roadmap boilerplate.
 * Toggle enable-nya di `src/config/app.config.ts`.
 */

import { appConfig } from "@/config";

export const landingModule = {
  name: "landing" as const,
  enabled: appConfig.modules.landing.enabled,
  basePath: appConfig.modules.landing.path,
  dependencies: [] as const,
} as const;

export type LandingModuleConfig = typeof landingModule;
