/**
 * @/shared/email — public surface.
 *
 * Semua di sini SERVER-ONLY. Import dari route handler atau server
 * action — bukan dari client component.
 */

export { sendAuthEmail, type SendAuthEmailResult } from "./send-auth-email";
export { verifyHookRequest, type VerifyResult } from "./verify-webhook";
export type {
  SupabaseEmailHookPayload,
  SupabaseEmailUser,
  SupabaseEmailData,
  EmailActionType,
} from "./types";
