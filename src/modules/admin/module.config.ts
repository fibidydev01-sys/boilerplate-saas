/**
 * Module: Admin (01)
 *
 * DNA: Interaksi dominant.
 * Role-gated interface buat user/data management, metrik, log aktivitas.
 * Biasanya dipakai sebagai backbone internal buat semua platform lain.
 *
 * Phase 2+ akan isi folder ini dengan:
 *   - components/  (data tables, form wrappers, metric cards)
 *   - services/    (user management, activity log, audit)
 *   - migrations/  (activity_logs, dst)
 */

import { appConfig } from "@/config";

export const adminModule = {
  name: "admin" as const,
  enabled: appConfig.modules.admin.enabled,
  basePath: appConfig.modules.admin.path,
  requiredRoles: appConfig.auth.adminRoles,
  dependencies: [] as const,
} as const;

export type AdminModuleConfig = typeof adminModule;
