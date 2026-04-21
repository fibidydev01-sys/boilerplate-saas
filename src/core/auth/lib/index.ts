/**
 * @/core/auth/lib — pure auth utilities.
 *
 * Framework-agnostic. No React, no Zustand.
 */

export {
  can,
  canAll,
  canAny,
  canAccessAdmin,
  getPermissionsForRole,
} from "./permissions";
