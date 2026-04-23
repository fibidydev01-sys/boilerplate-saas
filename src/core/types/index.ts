export type { Database, Tables, InsertDto, UpdateDto, Json } from "./database";

import type { Tables, InsertDto, UpdateDto } from "./database";

// --------------------------------------------------------------------
// Core entity types
// --------------------------------------------------------------------

export type UserProfile = Tables<"user_profiles">;
export type UserProfileInsert = InsertDto<"user_profiles">;
export type UserProfileUpdate = UpdateDto<"user_profiles">;

export type ActivityLog = Tables<"activity_logs">;
export type ActivityLogInsert = InsertDto<"activity_logs">;

export type StripeEvent = Tables<"stripe_events">;
export type StripeEventInsert = InsertDto<"stripe_events">;

export type CommerceCredential = Tables<"commerce_credentials">;
export type CommerceCredentialInsert = InsertDto<"commerce_credentials">;
export type CommerceCredentialUpdate = UpdateDto<"commerce_credentials">;

// --------------------------------------------------------------------
// Module metadata typing (opt-in)
// --------------------------------------------------------------------
/**
 * Convention for typing metadata payload per module.
 *
 * Module defines shape di modules/<name>/types.ts, lalu augment:
 *
 *   declare module "@/core/types" {
 *     interface UserProfileMetadata {
 *       commerce?: { shipping_addresses: Address[] };
 *     }
 *   }
 */
export interface UserProfileMetadata {
  // Empty — modules extend via declaration merging
}

/**
 * Helper untuk akses metadata dengan type safety.
 */
export function getProfileMetadata<K extends keyof UserProfileMetadata>(
  profile: UserProfile,
  key: K
): UserProfileMetadata[K] | undefined {
  const meta = profile.metadata as Record<string, unknown>;
  return meta?.[key as string] as UserProfileMetadata[K] | undefined;
}

// --------------------------------------------------------------------
// Role — forwarded dari config (single source of truth)
// --------------------------------------------------------------------
export type { UserRole } from "@/config";
