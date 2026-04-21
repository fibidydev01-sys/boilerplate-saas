/**
 * Module: blog (placeholder)
 *
 * Akan diaktifkan di Phase 2/3 sesuai roadmap boilerplate.
 * Toggle enable-nya di `src/config/app.config.ts`.
 */

import { appConfig } from "@/config";

export const blogModule = {
  name: "blog" as const,
  enabled: appConfig.modules.blog.enabled,
  basePath: appConfig.modules.blog.path,
  dependencies: [] as const,
} as const;

export type BlogModuleConfig = typeof blogModule;
