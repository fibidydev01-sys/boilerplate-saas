/**
 * Config barrel export.
 *
 * Usage:
 *   import { appConfig, brandingConfig, isAdminRole } from "@/config";
 *   import { permissionMatrix, type Permission } from "@/config";
 */

export { appConfig } from "./app.config";
export type {
  AppConfig,
  UserRole,
  AdminRole,
  AuthProvider,
  Locale,
  ModuleName,
  PaymentMode,
} from "./app.config";
export {
  isAdminRole,
  isModuleEnabled,
  getEnabledModulePaths,
  resolvePostLoginRedirect,
} from "./app.config";

export { permissionMatrix } from "./permissions.config";
export type { Permission, PermissionMatrix } from "./permissions.config";

export { brandingConfig } from "./branding.config";
export type { BrandingConfig } from "./branding.config";
