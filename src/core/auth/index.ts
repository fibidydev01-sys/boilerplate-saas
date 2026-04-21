/**
 * @/core/auth — Auth barrel.
 *
 * Agregasi dari:
 *   - components/  (LoginForm, LogoutButton, provider sub-components)
 *   - hooks/       (useAuth, usePermission, usePermissions)
 *   - lib/         (can, canAll, canAny, canAccessAdmin — pure)
 *   - services/    (fetchActiveProfile, verifyProfile)
 *   - store/       (useAuthStore)
 *   - provider.tsx (AuthProvider)
 */

// Components
export {
  LoginForm,
  LogoutButton,
  EmailPasswordForm,
  OAuthButton,
  GoogleIcon,
  MagicLinkForm,
} from "./components";

// Hooks
export { useAuth, usePermission, usePermissions } from "./hooks";

// Pure lib
export {
  can,
  canAll,
  canAny,
  canAccessAdmin,
  getPermissionsForRole,
} from "./lib";

// Services
export {
  fetchActiveProfile,
  verifyProfile,
  type FetchProfileResult,
  type VerifyProfileResult,
} from "./services";

// Store
export { useAuthStore } from "./store";

// Provider
export { AuthProvider } from "./provider";
