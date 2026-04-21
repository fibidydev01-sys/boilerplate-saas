/**
 * Module: project (placeholder)
 *
 * Akan diaktifkan di Phase 2/3 sesuai roadmap boilerplate.
 * Toggle enable-nya di `src/config/app.config.ts`.
 */

import { appConfig } from "@/config";

export const projectModule = {
  name: "project" as const,
  enabled: appConfig.modules.project.enabled,
  basePath: appConfig.modules.project.path,
  dependencies: [] as const,
} as const;

export type ProjectModuleConfig = typeof projectModule;
