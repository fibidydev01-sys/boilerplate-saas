/**
 * Module: chat (placeholder)
 *
 * Akan diaktifkan di Phase 2/3 sesuai roadmap boilerplate.
 * Toggle enable-nya di `src/config/app.config.ts`.
 */

import { appConfig } from "@/config";

export const chatModule = {
  name: "chat" as const,
  enabled: appConfig.modules.chat.enabled,
  basePath: appConfig.modules.chat.path,
  dependencies: [] as const,
} as const;

export type ChatModuleConfig = typeof chatModule;
