/**
 * Module: forum (placeholder)
 *
 * Akan diaktifkan di Phase 2/3 sesuai roadmap boilerplate.
 * Toggle enable-nya di `src/config/app.config.ts`.
 */

import { appConfig } from "@/config";

export const forumModule = {
  name: "forum" as const,
  enabled: appConfig.modules.forum.enabled,
  basePath: appConfig.modules.forum.path,
  dependencies: [] as const,
} as const;

export type ForumModuleConfig = typeof forumModule;
