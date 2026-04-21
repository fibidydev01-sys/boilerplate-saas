/**
 * @/core/auth/services — DB/external service calls.
 *
 * Semua function di sini terima `supabase` client sebagai param,
 * biar reusable di client + server context.
 */

// Profile
export {
  fetchActiveProfile,
  verifyProfile,
  updateProfile,
  mergeProfileMetadata,
  type FetchProfileResult,
  type VerifyProfileResult,
  type UpdateProfileResult,
} from "./profile.service";

// Activity logging
export {
  logActivity,
  listActivity,
  ActivityAction,
  type LogActivityInput,
  type LogActivityResult,
  type ListActivityOptions,
  type ListActivityResult,
  type ActivityActionKey,
} from "./activity.service";
